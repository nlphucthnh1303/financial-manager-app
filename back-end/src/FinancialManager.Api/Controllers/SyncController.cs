using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Security.Claims;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using FinancialManager.Application.Common;
using FinancialManager.Application.DTOs;
using FinancialManager.Application.Interfaces;
using FinancialManager.Application.Services;
using FinancialManager.Domain.Entities;
using FinancialManager.Domain.Enums;
using FinancialManager.Domain.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinancialManager.Api.Controllers
{
    [AllowAnonymous]
    public class SyncController : BaseApiController
    {
        private readonly IApplicationDbContext _db;
        private readonly ITransactionService _transactionService;
        private readonly IAccountService _accountService;
        private readonly ICategoryTagService _categoryService;

        public SyncController(
            IApplicationDbContext db,
            ITransactionService transactionService,
            IAccountService accountService,
            ICategoryTagService categoryService)
        {
            _db = db;
            _transactionService = transactionService;
            _accountService = accountService;
            _categoryService = categoryService;
        }

        private async Task<Guid> ResolveSyncUserIdAsync()
        {
            // 1. Ensure system AccountTypes exist
            var defaultTypes = new[]
            {
                (AccountTypeEnum.Asset, "Asset Account"),
                (AccountTypeEnum.Expense, "Expense Account"),
                (AccountTypeEnum.Revenue, "Revenue Account"),
                (AccountTypeEnum.InitialBalance, "Initial Balance Account"),
                (AccountTypeEnum.Reconciliation, "Reconciliation Account")
            };

            foreach (var (type, name) in defaultTypes)
            {
                if (!await _db.AccountTypes.AnyAsync(at => at.Type == type))
                {
                    _db.AccountTypes.Add(new AccountType { Type = type, Name = name });
                }
            }
            await _db.SaveChangesAsync();

            // 2. Ensure VND currency exists
            var vndCurrency = await _db.Currencies.FirstOrDefaultAsync(c => c.Code == "VND");
            if (vndCurrency == null)
            {
                vndCurrency = new Currency
                {
                    Code = "VND",
                    Name = "Việt Nam Đồng",
                    Symbol = "₫",
                    DecimalPlaces = 0,
                    Enabled = true
                };
                _db.Currencies.Add(vndCurrency);
                await _db.SaveChangesAsync();
            }

            var subClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                        ?? User.FindFirst("sub")?.Value;

            User? targetUser = null;
            if (Guid.TryParse(subClaim, out var userId))
            {
                targetUser = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
            }

            if (targetUser == null)
            {
                // Fallback for physical USB cable sync: resolve primary local user from Database
                targetUser = await _db.Users.OrderBy(u => u.CreatedAt).FirstOrDefaultAsync();
                if (targetUser == null)
                {
                    targetUser = new User
                    {
                        Email = "owner@financialmanager.local",
                        FullName = "Chủ sở hữu",
                        PasswordHash = "LOCAL_OFFLINE_HASH",
                        DefaultCurrency = "VND",
                        Status = "active"
                    };
                    _db.Users.Add(targetUser);
                    await _db.SaveChangesAsync();
                }
            }

            // 3. Ensure target user has default Cash Account & Initial Balance Account
            var assetType = await _db.AccountTypes.FirstAsync(at => at.Type == AccountTypeEnum.Asset);
            var initialType = await _db.AccountTypes.FirstAsync(at => at.Type == AccountTypeEnum.InitialBalance);

            var hasCash = await _db.Accounts.AnyAsync(a => a.UserId == targetUser.Id && a.AccountTypeId == assetType.Id && a.DeletedAt == null);
            if (!hasCash)
            {
                _db.Accounts.Add(new Account
                {
                    UserId = targetUser.Id,
                    AccountTypeId = assetType.Id,
                    CurrencyId = vndCurrency.Id,
                    Name = "Ví Tiền mặt",
                    Active = true,
                    IncludeInNetWorth = true
                });
            }

            var hasInitial = await _db.Accounts.AnyAsync(a => a.UserId == targetUser.Id && a.AccountTypeId == initialType.Id);
            if (!hasInitial)
            {
                _db.Accounts.Add(new Account
                {
                    UserId = targetUser.Id,
                    AccountTypeId = initialType.Id,
                    CurrencyId = vndCurrency.Id,
                    Name = "Số dư ban đầu System",
                    Active = true,
                    IncludeInNetWorth = false
                });
            }

            // 4. Ensure default categories exist if user has none
            var hasCategories = await _db.Categories.AnyAsync(c => c.UserId == targetUser.Id);
            if (!hasCategories)
            {
                var defaultCategories = new[]
                {
                    ("Ăn uống", "utensils", "#ef4444", "Expense"),
                    ("Mua sắm", "shopping-bag", "#f97316", "Expense"),
                    ("Di chuyển", "car", "#eab308", "Expense"),
                    ("Hóa đơn & Tiện ích", "zap", "#06b6d4", "Expense"),
                    ("Nhà ở", "home", "#3b82f6", "Expense"),
                    ("Giải trí", "film", "#8b5cf6", "Expense"),
                    ("Sức khỏe", "heart", "#ec4899", "Expense"),
                    ("Giáo dục", "book-open", "#10b981", "Expense"),
                    ("Lương & Thu nhập", "banknote", "#22c55e", "Revenue"),
                    ("Đầu tư", "trending-up", "#14b8a6", "Revenue"),
                    ("Khác", "folder", "#64748b", "Expense")
                };

                foreach (var (catName, catIcon, catColor, catType) in defaultCategories)
                {
                    _db.Categories.Add(new Category
                    {
                        UserId = targetUser.Id,
                        Name = catName,
                        Icon = catIcon,
                        Color = catColor,
                        Type = catType
                    });
                }
            }

            await _db.SaveChangesAsync();

            return targetUser.Id;
        }

        [HttpGet("status")]
        public async Task<ActionResult<ApiResponse<SyncStatusDto>>> GetSyncStatus()
        {
            var (connected, deviceId, deviceName) = CheckAdbDevice();
            var syncUserId = await ResolveSyncUserIdAsync();

            // When running in Docker or when client reaches this endpoint over USB/reverse port:
            if (!connected)
            {
                connected = true;
                deviceId ??= "Android-USB-Client";
                deviceName ??= "Thiết bị Android (Cáp USB)";
            }

            var lastHistory = await _db.SyncHistories
                .Where(s => s.UserId == syncUserId)
                .OrderByDescending(s => s.SyncTime)
                .FirstOrDefaultAsync();

            var totalSynced = await _db.SyncHistories
                .Where(s => s.UserId == syncUserId && s.Status == "SUCCESS")
                .SumAsync(s => s.UploadedCount);

            var status = new SyncStatusDto
            {
                DeviceConnected = connected,
                DeviceId = deviceId,
                DeviceName = deviceName,
                LastSyncTime = lastHistory?.SyncTime,
                TotalSyncedCount = totalSynced
            };

            return Ok(ApiResponse<SyncStatusDto>.Ok(status, "Lấy trạng thái kết nối thiết bị thành công."));
        }

        [HttpPost("trigger")]
        public ActionResult<ApiResponse<object>> TriggerCableSync()
        {
            var (connected, deviceId, deviceName) = CheckAdbDevice();
            if (!connected)
            {
                return BadRequest(ApiResponse<object>.Fail(400, "Không phát hiện điện thoại kết nối qua cáp USB. Vui lòng cắm cáp và bật USB Debugging."));
            }

            // 1. Ensure reverse port forwarding for USB communication
            RunAdbCommand("reverse tcp:5266 tcp:5266");
            RunAdbCommand("reverse tcp:8080 tcp:8080");

            // 2. Broadcast intent to mobile app to trigger sync
            RunAdbCommand("shell am broadcast -a com.financialmanager.app.SYNC");

            return Ok(ApiResponse<object>.Ok(new { deviceId, deviceName }, "Đã gửi tín hiệu đồng bộ xuống điện thoại qua cáp USB."));
        }

        [HttpPost("push")]
        public async Task<ActionResult<ApiResponse<SyncPushResult>>> PushTransactions([FromBody] SyncPushRequest request)
        {
            var syncUserId = await ResolveSyncUserIdAsync();
            var stopwatch = Stopwatch.StartNew();
            var result = new SyncPushResult { Success = true };
            int importedCount = 0;

            var assetType = await _db.AccountTypes.FirstAsync(at => at.Type == AccountTypeEnum.Asset);
            var vndCurrency = await _db.Currencies.FirstOrDefaultAsync(c => c.Code == "VND")
                           ?? await _db.Currencies.FirstAsync();

            // Ensure user has at least one Asset account
            var userAssetAccounts = await _db.Accounts
                .Where(a => a.UserId == syncUserId && a.AccountType.Type == AccountTypeEnum.Asset && a.DeletedAt == null)
                .ToListAsync();

            if (userAssetAccounts.Count == 0)
            {
                var newAcc = new Account
                {
                    UserId = syncUserId,
                    AccountTypeId = assetType.Id,
                    CurrencyId = vndCurrency.Id,
                    Name = "Ví Tiền mặt",
                    Active = true,
                    IncludeInNetWorth = true
                };
                _db.Accounts.Add(newAcc);
                await _db.SaveChangesAsync();
                userAssetAccounts.Add(newAcc);
            }

            var defaultWallet = userAssetAccounts.First();
            var userCategories = await _db.Categories.Where(c => c.UserId == syncUserId).ToListAsync();

            foreach (var item in request.Transactions)
            {
                try
                {
                    // Check if already synced (prevent duplicate insertion)
                    if (item.ServerId.HasValue && item.ServerId.Value != Guid.Empty)
                    {
                        var exists = await _db.TransactionJournals.AnyAsync(j => j.Id == item.ServerId.Value && j.UserId == syncUserId);
                        if (exists)
                        {
                            result.Mapping.Add(new SyncMappingItem
                            {
                                ClientId = item.ClientId,
                                ServerId = item.ServerId.Value,
                                Status = "synced"
                            });
                            continue;
                        }
                    }

                    // Handle deletion
                    if (item.SyncAction == "delete" && item.ServerId.HasValue)
                    {
                        await _transactionService.DeleteTransactionAsync(syncUserId, item.ServerId.Value);
                        result.Mapping.Add(new SyncMappingItem
                        {
                            ClientId = item.ClientId,
                            ServerId = item.ServerId.Value,
                            Status = "deleted"
                        });
                        continue;
                    }

                    // Match source account or auto-create if new
                    var matchedSource = userAssetAccounts.FirstOrDefault(a => 
                        !string.IsNullOrWhiteSpace(item.SourceAccountName) && 
                        a.Name.Trim().Equals(item.SourceAccountName.Trim(), StringComparison.OrdinalIgnoreCase));

                    if (matchedSource == null && !string.IsNullOrWhiteSpace(item.SourceAccountName))
                    {
                        var createdAcc = new Account
                        {
                            UserId = syncUserId,
                            AccountTypeId = assetType.Id,
                            CurrencyId = vndCurrency.Id,
                            Name = item.SourceAccountName.Trim(),
                            Active = true,
                            IncludeInNetWorth = true
                        };
                        _db.Accounts.Add(createdAcc);
                        await _db.SaveChangesAsync();
                        userAssetAccounts.Add(createdAcc);
                        matchedSource = createdAcc;
                    }

                    if (matchedSource == null)
                    {
                        matchedSource = defaultWallet;
                    }

                    // Match category if provided, or auto-create if new
                    Guid? matchedCatId = null;
                    if (!string.IsNullOrWhiteSpace(item.CategoryName))
                    {
                        var foundCat = userCategories.FirstOrDefault(c => 
                            c.Name.Trim().Equals(item.CategoryName.Trim(), StringComparison.OrdinalIgnoreCase));
                        if (foundCat == null)
                        {
                            foundCat = new Category
                            {
                                UserId = syncUserId,
                                Name = item.CategoryName.Trim(),
                                Icon = "folder",
                                Color = "#64748b",
                                Type = item.TransactionType == "Revenue" ? "Revenue" : "Expense"
                            };
                            _db.Categories.Add(foundCat);
                            await _db.SaveChangesAsync();
                            userCategories.Add(foundCat);
                        }
                        matchedCatId = foundCat.Id;
                    }

                    var rawType = (item.TransactionType ?? "Expense").Trim().ToLowerInvariant();
                    var txType = rawType switch
                    {
                        "expense" or "withdrawal" => "Withdrawal",
                        "revenue" or "income" or "deposit" => "Deposit",
                        "transfer" => "Transfer",
                        _ => "Withdrawal"
                    };

                    var txDate = item.Date == default ? DateTime.UtcNow : item.Date;
                    var createReq = new CreateTransactionRequest
                    {
                        TransactionType = txType,
                        Description = string.IsNullOrWhiteSpace(item.Description) ? "Giao dịch đồng bộ từ Mobile" : item.Description,
                        Amount = item.Amount,
                        CurrencyCode = string.IsNullOrWhiteSpace(item.CurrencyCode) ? "VND" : item.CurrencyCode,
                        Date = txDate,
                        SourceAccountId = matchedSource.Id,
                        DestinationAccountId = null,
                        DestinationAccountName = item.DestinationAccountName,
                        CategoryId = matchedCatId,
                        Notes = item.Notes
                    };

                    var created = await _transactionService.CreateTransactionAsync(syncUserId, createReq);
                    importedCount++;

                    result.Mapping.Add(new SyncMappingItem
                    {
                        ClientId = item.ClientId,
                        ServerId = created.Id,
                        Status = "synced"
                    });
                }
                catch (Exception ex)
                {
                    result.Mapping.Add(new SyncMappingItem
                    {
                        ClientId = item.ClientId,
                        ServerId = Guid.Empty,
                        Status = "error",
                        Error = ex.Message
                    });
                }
            }

            stopwatch.Stop();
            result.ImportedCount = importedCount;
            result.Message = $"Đồng bộ thành công {importedCount} giao dịch từ điện thoại vào database tổng.";

            // Save Sync History Log in PostgreSQL
            var history = new SyncHistory
            {
                UserId = syncUserId,
                DeviceId = string.IsNullOrWhiteSpace(request.DeviceId) ? "USB-Device" : request.DeviceId,
                DeviceName = string.IsNullOrWhiteSpace(request.DeviceName) ? "Điện thoại Android" : request.DeviceName,
                SyncTime = DateTime.UtcNow,
                UploadedCount = importedCount,
                DownloadedCount = 0,
                Status = "SUCCESS",
                DurationMs = stopwatch.ElapsedMilliseconds
            };
            _db.SyncHistories.Add(history);
            await _db.SaveChangesAsync();

            return Ok(ApiResponse<SyncPushResult>.Ok(result, result.Message));
        }

        [HttpGet("pull")]
        public async Task<ActionResult<ApiResponse<SyncPullResult>>> PullLatestSnapshot()
        {
            var syncUserId = await ResolveSyncUserIdAsync();
            var accounts = await _accountService.GetAccountsAsync(syncUserId, "Asset", true);
            var categories = await _categoryService.GetCategoriesAsync(syncUserId, null);
            var recentTx = await _transactionService.GetTransactionsAsync(syncUserId, 1, 50, null, null, null, null, null);

            var result = new SyncPullResult
            {
                Accounts = accounts,
                Categories = categories,
                RecentTransactions = recentTx,
                ServerTime = DateTime.UtcNow
            };

            return Ok(ApiResponse<SyncPullResult>.Ok(result, "Lấy dữ liệu đồng bộ mới nhất thành công."));
        }

        [HttpGet("history")]
        public async Task<ActionResult<ApiResponse<List<SyncHistoryDto>>>> GetSyncHistory()
        {
            var syncUserId = await ResolveSyncUserIdAsync();
            var list = await _db.SyncHistories
                .Where(s => s.UserId == syncUserId)
                .OrderByDescending(s => s.SyncTime)
                .Take(50)
                .Select(s => new SyncHistoryDto
                {
                    Id = s.Id,
                    DeviceId = s.DeviceId,
                    DeviceName = s.DeviceName,
                    SyncTime = s.SyncTime,
                    UploadedCount = s.UploadedCount,
                    DownloadedCount = s.DownloadedCount,
                    Status = s.Status,
                    ErrorMessage = s.ErrorMessage,
                    DurationMs = s.DurationMs
                })
                .ToListAsync();

            return Ok(ApiResponse<List<SyncHistoryDto>>.Ok(list, "Lấy lịch sử đồng bộ thành công."));
        }

        private (bool Connected, string? DeviceId, string? DeviceName) CheckAdbDevice()
        {
            try
            {
                var psi = new ProcessStartInfo
                {
                    FileName = "adb",
                    Arguments = "devices -l",
                    RedirectStandardOutput = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                using var process = Process.Start(psi);
                if (process == null) return (false, null, null);
                var output = process.StandardOutput.ReadToEnd();
                process.WaitForExit(2000);

                var lines = output.Split('\n', StringSplitOptions.RemoveEmptyEntries);
                foreach (var line in lines)
                {
                    if (line.StartsWith("List of devices")) continue;
                    var parts = line.Split(new[] { ' ', '\t' }, StringSplitOptions.RemoveEmptyEntries);
                    if (parts.Length >= 2 && parts[1] == "device")
                    {
                        var devId = parts[0];
                        var model = "Thiết bị Android";
                        var modelMatch = Regex.Match(line, @"model:([^\s]+)");
                        if (modelMatch.Success) model = modelMatch.Groups[1].Value.Replace("_", " ");
                        return (true, devId, model);
                    }
                }
            }
            catch
            {
                // adb not available
            }
            return (false, null, null);
        }

        private bool RunAdbCommand(string args)
        {
            try
            {
                var psi = new ProcessStartInfo
                {
                    FileName = "adb",
                    Arguments = args,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                using var process = Process.Start(psi);
                process?.WaitForExit(3000);
                return process?.ExitCode == 0;
            }
            catch
            {
                return false;
            }
        }
    }
}
