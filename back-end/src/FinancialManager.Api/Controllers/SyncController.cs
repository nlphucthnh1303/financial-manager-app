using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using FinancialManager.Application.Common;
using FinancialManager.Application.DTOs;
using FinancialManager.Application.Interfaces;
using FinancialManager.Application.Services;
using FinancialManager.Domain.Entities;
using FinancialManager.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinancialManager.Api.Controllers
{
    [Authorize]
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

        [HttpGet("status")]
        public async Task<ActionResult<ApiResponse<SyncStatusDto>>> GetSyncStatus()
        {
            var (connected, deviceId, deviceName) = CheckAdbDevice();

            var lastHistory = await _db.SyncHistories
                .Where(s => s.UserId == CurrentUserId)
                .OrderByDescending(s => s.SyncTime)
                .FirstOrDefaultAsync();

            var totalSynced = await _db.SyncHistories
                .Where(s => s.UserId == CurrentUserId && s.Status == "SUCCESS")
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
        public async Task<ActionResult<ApiResponse<object>>> TriggerCableSync()
        {
            var (connected, deviceId, deviceName) = CheckAdbDevice();
            if (!connected)
            {
                return BadRequest(ApiResponse<object>.Fail(400, "Không phát hiện điện thoại kết nối qua cáp USB. Vui lòng cắm cáp và bật USB Debugging."));
            }

            // 1. Ensure reverse port forwarding for USB communication
            RunAdbCommand("reverse tcp:5266 tcp:5266");

            // 2. Broadcast intent to mobile app to trigger sync
            RunAdbCommand("shell am broadcast -a com.financialmanager.app.SYNC");

            return Ok(ApiResponse<object>.Ok(new { deviceId, deviceName }, "Đã gửi tín hiệu đồng bộ xuống điện thoại qua cáp USB."));
        }

        [HttpPost("push")]
        public async Task<ActionResult<ApiResponse<SyncPushResult>>> PushTransactions([FromBody] SyncPushRequest request)
        {
            var stopwatch = Stopwatch.StartNew();
            var result = new SyncPushResult { Success = true };
            int importedCount = 0;

            // Ensure user has at least one Asset account
            var userAssetAccounts = await _db.Accounts
                .Where(a => a.UserId == CurrentUserId && a.AccountType.Type == AccountTypeEnum.Asset && a.DeletedAt == null)
                .ToListAsync();

            if (userAssetAccounts.Count == 0)
            {
                var assetTypeId = (await _db.AccountTypes.FirstAsync(at => at.Type == AccountTypeEnum.Asset)).Id;
                var currencyId = (await _db.Currencies.FirstAsync(c => c.Enabled)).Id;
                await _accountService.CreateAccountAsync(CurrentUserId, new CreateAccountRequest
                {
                    Name = "Ví Tiền mặt",
                    AccountTypeId = assetTypeId,
                    CurrencyId = currencyId,
                    OpeningBalance = 0
                });
                userAssetAccounts = await _db.Accounts
                    .Where(a => a.UserId == CurrentUserId && a.AccountType.Type == AccountTypeEnum.Asset && a.DeletedAt == null)
                    .ToListAsync();
            }

            var defaultWallet = userAssetAccounts.First();
            var userCategories = await _db.Categories.Where(c => c.UserId == CurrentUserId).ToListAsync();

            foreach (var item in request.Transactions)
            {
                try
                {
                    // Check if already synced (prevent duplicate insertion)
                    if (item.ServerId.HasValue && item.ServerId.Value != Guid.Empty)
                    {
                        var exists = await _db.TransactionJournals.AnyAsync(j => j.Id == item.ServerId.Value && j.UserId == CurrentUserId);
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
                        await _transactionService.DeleteTransactionAsync(CurrentUserId, item.ServerId.Value);
                        result.Mapping.Add(new SyncMappingItem
                        {
                            ClientId = item.ClientId,
                            ServerId = item.ServerId.Value,
                            Status = "deleted"
                        });
                        continue;
                    }

                    // Match source account
                    var matchedSource = userAssetAccounts.FirstOrDefault(a => 
                        !string.IsNullOrWhiteSpace(item.SourceAccountName) && 
                        a.Name.Trim().Equals(item.SourceAccountName.Trim(), StringComparison.OrdinalIgnoreCase)) ?? defaultWallet;

                    // Match category if provided
                    Guid? matchedCatId = null;
                    if (!string.IsNullOrWhiteSpace(item.CategoryName))
                    {
                        var foundCat = userCategories.FirstOrDefault(c => 
                            c.Name.Trim().Equals(item.CategoryName.Trim(), StringComparison.OrdinalIgnoreCase));
                        if (foundCat != null)
                        {
                            matchedCatId = foundCat.Id;
                        }
                    }

                    var txDate = item.Date == default ? DateTime.UtcNow : item.Date;
                    var createReq = new CreateTransactionRequest
                    {
                        TransactionType = item.TransactionType,
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

                    var created = await _transactionService.CreateTransactionAsync(CurrentUserId, createReq);
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
                UserId = CurrentUserId,
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
            var accounts = await _accountService.GetAccountsAsync(CurrentUserId, "Asset", true);
            var categories = await _categoryService.GetCategoriesAsync(CurrentUserId, null);
            var recentTx = await _transactionService.GetTransactionsAsync(CurrentUserId, 1, 50, null, null, null, null, null);

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
            var list = await _db.SyncHistories
                .Where(s => s.UserId == CurrentUserId)
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
