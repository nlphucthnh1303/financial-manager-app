using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FinancialManager.Application.DTOs;
using FinancialManager.Application.Interfaces;
using FinancialManager.Domain.Entities;
using FinancialManager.Domain.Enums;
using FinancialManager.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace FinancialManager.Application.Services
{
    // --- MODULE 01: AUTH SERVICE ---
    public interface IAuthService
    {
        Task<AuthResponse> RegisterAsync(RegisterRequest request);
        Task<AuthResponse> LoginAsync(LoginRequest request);
        Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request);
        Task LogoutAsync(Guid userId, string refreshToken);
        Task<UserProfileDto> GetProfileAsync(Guid userId);
        Task<ClearDataResult> ClearDataAsync(Guid userId, ClearDataRequest request);
    }

    public class AuthService : IAuthService
    {
        private readonly IApplicationDbContext _db;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IJwtTokenGenerator _tokenGenerator;

        public AuthService(IApplicationDbContext db, IPasswordHasher passwordHasher, IJwtTokenGenerator tokenGenerator)
        {
            _db = db;
            _passwordHasher = passwordHasher;
            _tokenGenerator = tokenGenerator;
        }

        public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
        {
            var errors = new List<ValidationErrorItem>();
            if (string.IsNullOrWhiteSpace(request.Email)) errors.Add(new ValidationErrorItem("email", "Email không được bỏ trống."));
            else if (!System.Text.RegularExpressions.Regex.IsMatch(request.Email.Trim(), @"^[^@\s]+@[^@\s]+\.[^@\s]+$")) errors.Add(new ValidationErrorItem("email", "Email không đúng định dạng."));
            if (string.IsNullOrWhiteSpace(request.FullName)) errors.Add(new ValidationErrorItem("fullName", "Họ và tên không được bỏ trống."));
            if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6) errors.Add(new ValidationErrorItem("password", "Mật khẩu phải từ 6 ký tự trở lên."));
            if (request.Password != request.ConfirmPassword) errors.Add(new ValidationErrorItem("confirmPassword", "Xác nhận mật khẩu không khớp."));
            
            if (errors.Any()) throw new ValidationAppException("Dữ liệu đăng ký không hợp lệ.", errors);

            var existingUser = await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());
            if (existingUser != null) throw new ConflictException("Email này đã được sử dụng trên hệ thống.");

            using var tx = await _db.BeginTransactionAsync();

            var user = new User
            {
                Email = request.Email.ToLower().Trim(),
                FullName = request.FullName.Trim(),
                PasswordHash = _passwordHasher.HashPassword(request.Password),
                DefaultCurrency = string.IsNullOrWhiteSpace(request.CurrencyCode) ? "VND" : request.CurrencyCode.ToUpper(),
                Status = "active"
            };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            // Ensure system AccountTypes exist for user
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

            // Create Default VND Currency if not exists
            var vndCurrency = await _db.Currencies.FirstOrDefaultAsync(c => c.Code == user.DefaultCurrency);
            if (vndCurrency == null)
            {
                vndCurrency = new Currency { Code = user.DefaultCurrency, Name = user.DefaultCurrency == "VND" ? "Việt Nam Đồng" : user.DefaultCurrency, Symbol = user.DefaultCurrency == "VND" ? "₫" : "$", DecimalPlaces = user.DefaultCurrency == "VND" ? 0 : 2, Enabled = true };
                _db.Currencies.Add(vndCurrency);
                await _db.SaveChangesAsync();
            }

            // Create Default Cash Asset Account & Initial Balance Account for the user
            var assetType = await _db.AccountTypes.FirstAsync(at => at.Type == AccountTypeEnum.Asset);
            var initialType = await _db.AccountTypes.FirstAsync(at => at.Type == AccountTypeEnum.InitialBalance);

            var cashAccount = new Account
            {
                UserId = user.Id,
                AccountTypeId = assetType.Id,
                CurrencyId = vndCurrency.Id,
                Name = "Ví Tiền mặt",
                Active = true,
                IncludeInNetWorth = true
            };
            _db.Accounts.Add(cashAccount);

            var initialAccount = new Account
            {
                UserId = user.Id,
                AccountTypeId = initialType.Id,
                CurrencyId = vndCurrency.Id,
                Name = "Số dư ban đầu System",
                Active = true,
                IncludeInNetWorth = false
            };
            _db.Accounts.Add(initialAccount);

            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            var (accessToken, expiresIn) = _tokenGenerator.GenerateAccessToken(user);
            var refreshTokenStr = _tokenGenerator.GenerateRefreshToken();
            var refreshTokenHash = _tokenGenerator.HashToken(refreshTokenStr);

            _db.PersonalAccessTokens.Add(new PersonalAccessToken
            {
                UserId = user.Id,
                TokenHash = refreshTokenHash,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                Revoked = false
            });
            await _db.SaveChangesAsync();

            return new AuthResponse
            {
                AccessToken = accessToken,
                ExpiresIn = expiresIn,
                RefreshToken = refreshTokenStr,
                User = new UserProfileDto { Id = user.Id, Email = user.Email, FullName = user.FullName, DefaultCurrency = user.DefaultCurrency }
            };
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest request)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());
            if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
            {
                throw new UnauthorizedAppException("Email hoặc mật khẩu không chính xác.");
            }

            if (user.Status != "active")
            {
                throw new ForbiddenException("Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động.");
            }

            var (accessToken, expiresIn) = _tokenGenerator.GenerateAccessToken(user);
            var refreshTokenStr = _tokenGenerator.GenerateRefreshToken();
            var refreshTokenHash = _tokenGenerator.HashToken(refreshTokenStr);

            _db.PersonalAccessTokens.Add(new PersonalAccessToken
            {
                UserId = user.Id,
                TokenHash = refreshTokenHash,
                ExpiresAt = DateTime.UtcNow.AddDays(request.RememberMe ? 14 : 1),
                Revoked = false
            });
            await _db.SaveChangesAsync();

            return new AuthResponse
            {
                AccessToken = accessToken,
                ExpiresIn = expiresIn,
                RefreshToken = refreshTokenStr,
                User = new UserProfileDto { Id = user.Id, Email = user.Email, FullName = user.FullName, DefaultCurrency = user.DefaultCurrency }
            };
        }

        public async Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request)
        {
            var hash = _tokenGenerator.HashToken(request.RefreshToken);
            var token = await _db.PersonalAccessTokens.Include(p => p.User)
                .FirstOrDefaultAsync(p => p.TokenHash == hash && !p.Revoked && p.ExpiresAt > DateTime.UtcNow);

            if (token == null) throw new UnauthorizedAppException("Refresh Token không hợp lệ hoặc đã hết hạn.");

            token.Revoked = true;

            var (accessToken, expiresIn) = _tokenGenerator.GenerateAccessToken(token.User);
            var newRefreshTokenStr = _tokenGenerator.GenerateRefreshToken();
            var newRefreshTokenHash = _tokenGenerator.HashToken(newRefreshTokenStr);

            _db.PersonalAccessTokens.Add(new PersonalAccessToken
            {
                UserId = token.UserId,
                TokenHash = newRefreshTokenHash,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                Revoked = false
            });
            await _db.SaveChangesAsync();

            return new AuthResponse
            {
                AccessToken = accessToken,
                ExpiresIn = expiresIn,
                RefreshToken = newRefreshTokenStr,
                User = new UserProfileDto { Id = token.User.Id, Email = token.User.Email, FullName = token.User.FullName, DefaultCurrency = token.User.DefaultCurrency }
            };
        }

        public async Task LogoutAsync(Guid userId, string refreshToken)
        {
            var hash = _tokenGenerator.HashToken(refreshToken);
            var token = await _db.PersonalAccessTokens.FirstOrDefaultAsync(p => p.UserId == userId && p.TokenHash == hash);
            if (token != null)
            {
                token.Revoked = true;
                await _db.SaveChangesAsync();
            }
        }

        public async Task<UserProfileDto> GetProfileAsync(Guid userId)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user == null) throw new NotFoundException("Không tìm thấy người dùng.");
            return new UserProfileDto { Id = user.Id, Email = user.Email, FullName = user.FullName, DefaultCurrency = user.DefaultCurrency };
        }

        public async Task<ClearDataResult> ClearDataAsync(Guid userId, ClearDataRequest request)
        {
            var scope = (request.Scope ?? "").Trim().ToLower();
            if (scope != "transactions" && scope != "all")
                throw new ValidationAppException("Dữ liệu không hợp lệ.", new List<ValidationErrorItem> { new("scope", "Phạm vi xoá phải là 'transactions' hoặc 'all'.") });

            var user = await _db.Users.FindAsync(userId);
            if (user == null) throw new NotFoundException("Không tìm thấy người dùng.");
            if (string.IsNullOrEmpty(request.Password) || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
                throw new ValidationAppException("Mật khẩu xác nhận không đúng.", new List<ValidationErrorItem> { new("password", "Mật khẩu xác nhận không đúng.") });

            var result = new ClearDataResult { Scope = scope };
            using var tx = await _db.BeginTransactionAsync();

            // Transactions: journals + their legs, tags links, metas, and piggy bank history (the money lives in the journals)
            var journals = await _db.TransactionJournals.Where(j => j.UserId == userId).ToListAsync();
            var journalIds = journals.Select(j => j.Id).ToList();
            var piggies = await _db.PiggyBanks.Where(p => p.Account.UserId == userId).ToListAsync();
            var piggyIds = piggies.Select(p => p.Id).ToList();

            _db.PiggyBankEvents.RemoveRange(await _db.PiggyBankEvents.Where(e => piggyIds.Contains(e.PiggyBankId) || (e.TransactionJournalId != null && journalIds.Contains(e.TransactionJournalId.Value))).ToListAsync());
            _db.Taggables.RemoveRange(await _db.Taggables.Where(t => journalIds.Contains(t.TransactionJournalId)).ToListAsync());
            _db.JournalMetas.RemoveRange(await _db.JournalMetas.Where(m => journalIds.Contains(m.TransactionJournalId)).ToListAsync());
            _db.Transactions.RemoveRange(await _db.Transactions.Where(t => journalIds.Contains(t.TransactionJournalId)).ToListAsync());
            _db.TransactionJournals.RemoveRange(journals);
            result.Transactions = journals.Count;

            if (scope == "transactions")
            {
                foreach (var p in piggies) p.CurrentAmount = 0;
                await _db.SaveChangesAsync();
                await tx.CommitAsync();
                return result;
            }
            await _db.SaveChangesAsync();

            // Everything else the user owns
            _db.PiggyBanks.RemoveRange(piggies);
            result.PiggyBanks = piggies.Count;

            var recurrences = await _db.Recurrences.Where(r => r.UserId == userId).ToListAsync();
            _db.Recurrences.RemoveRange(recurrences);
            result.Recurrences = recurrences.Count;

            var budgets = await _db.Budgets.Where(b => b.UserId == userId).ToListAsync();
            var budgetIds = budgets.Select(b => b.Id).ToList();
            _db.BudgetLimits.RemoveRange(await _db.BudgetLimits.Where(l => budgetIds.Contains(l.BudgetId)).ToListAsync());
            _db.Budgets.RemoveRange(budgets);
            result.Budgets = budgets.Count;

            var bills = await _db.Bills.Where(b => b.UserId == userId).ToListAsync();
            _db.Bills.RemoveRange(bills);
            result.Bills = bills.Count;

            var tags = await _db.Tags.Where(t => t.UserId == userId).ToListAsync();
            _db.Taggables.RemoveRange(await _db.Taggables.Where(t => t.Tag.UserId == userId).ToListAsync());
            _db.Tags.RemoveRange(tags);
            result.Tags = tags.Count;

            // Parent FK is Restrict: detach children first
            var categories = await _db.Categories.Where(c => c.UserId == userId).ToListAsync();
            foreach (var c in categories) c.ParentId = null;
            await _db.SaveChangesAsync();
            _db.Categories.RemoveRange(categories);
            result.Categories = categories.Count;

            var accounts = await _db.Accounts.Include(a => a.AccountType).Where(a => a.UserId == userId).ToListAsync();
            var accountIds = accounts.Select(a => a.Id).ToList();
            _db.AccountMetas.RemoveRange(await _db.AccountMetas.Where(m => accountIds.Contains(m.AccountId)).ToListAsync());
            _db.Accounts.RemoveRange(accounts);
            result.Accounts = accounts.Count(a => a.AccountType.Type == AccountTypeEnum.Asset);
            await _db.SaveChangesAsync();

            // Back to the state right after registration: a cash wallet + the system opening-balance account
            var currency = await _db.Currencies.FirstOrDefaultAsync(c => c.Code == user.DefaultCurrency)
                ?? await _db.Currencies.FirstAsync(c => c.Code == "VND");
            var assetType = await _db.AccountTypes.FirstAsync(at => at.Type == AccountTypeEnum.Asset);
            var initialType = await _db.AccountTypes.FirstAsync(at => at.Type == AccountTypeEnum.InitialBalance);
            _db.Accounts.Add(new Account { UserId = userId, AccountTypeId = assetType.Id, CurrencyId = currency.Id, Name = "Ví Tiền mặt", Active = true, IncludeInNetWorth = true });
            _db.Accounts.Add(new Account { UserId = userId, AccountTypeId = initialType.Id, CurrencyId = currency.Id, Name = "Số dư ban đầu System", Active = true, IncludeInNetWorth = false });
            await _db.SaveChangesAsync();

            await tx.CommitAsync();
            return result;
        }
    }

    // --- MODULE 02: CURRENCY SERVICE ---
    public interface ICurrencyService
    {
        Task<List<CurrencyDto>> GetCurrenciesAsync(Guid userId);
        Task<CurrencyDto> CreateCurrencyAsync(Guid userId, CreateCurrencyRequest request);
        Task<ExchangeRateDto> AddExchangeRateAsync(CreateExchangeRateRequest request);
        Task<ConvertCurrencyResponse> ConvertCurrencyAsync(string from, string to, decimal amount, DateTime? date);
    }

    public class CurrencyService : ICurrencyService
    {
        private readonly IApplicationDbContext _db;

        public CurrencyService(IApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<List<CurrencyDto>> GetCurrenciesAsync(Guid userId)
        {
            var currencies = await _db.Currencies
                .Where(c => c.Enabled || c.UserId == userId)
                .OrderBy(c => c.Code)
                .ToListAsync();

            return currencies.Select(c => new CurrencyDto
            {
                Id = c.Id,
                Code = c.Code,
                Name = c.Name,
                Symbol = c.Symbol,
                DecimalPlaces = c.DecimalPlaces,
                Enabled = c.Enabled
            }).ToList();
        }

        public async Task<CurrencyDto> CreateCurrencyAsync(Guid userId, CreateCurrencyRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Code) || request.Code.Length != 3)
            {
                throw new ValidationAppException("Mã ISO tiền tệ phải đúng 3 ký tự (VD: USD, VND).", new List<ValidationErrorItem> { new ValidationErrorItem("code", "Mã ISO 3 ký tự.") });
            }

            var codeUpper = request.Code.ToUpper();
            if (await _db.Currencies.AnyAsync(c => c.Code == codeUpper && (c.UserId == null || c.UserId == userId)))
            {
                throw new ConflictException($"Mã tiền tệ {codeUpper} đã tồn tại.");
            }

            var currency = new Currency
            {
                Code = codeUpper,
                Name = request.Name,
                Symbol = request.Symbol,
                DecimalPlaces = request.DecimalPlaces,
                Enabled = request.Enabled,
                UserId = userId
            };
            _db.Currencies.Add(currency);
            await _db.SaveChangesAsync();

            return new CurrencyDto { Id = currency.Id, Code = currency.Code, Name = currency.Name, Symbol = currency.Symbol, DecimalPlaces = currency.DecimalPlaces, Enabled = currency.Enabled };
        }

        public async Task<ExchangeRateDto> AddExchangeRateAsync(CreateExchangeRateRequest request)
        {
            if (request.FromCurrencyId == request.ToCurrencyId)
            {
                throw new AppException("Không thể tạo tỷ giá cho 2 đồng tiền giống nhau.", 400);
            }
            if (request.Rate <= 0)
            {
                throw new AppException("Tỷ giá quy đổi phải lớn hơn 0.", 400);
            }

            var dateOnly = request.Date.Date;
            var existing = await _db.CurrencyExchangeRates.FirstOrDefaultAsync(r => r.FromCurrencyId == request.FromCurrencyId && r.ToCurrencyId == request.ToCurrencyId && r.Date == dateOnly);

            if (existing != null)
            {
                existing.Rate = request.Rate;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                existing = new CurrencyExchangeRate
                {
                    FromCurrencyId = request.FromCurrencyId,
                    ToCurrencyId = request.ToCurrencyId,
                    Date = dateOnly,
                    Rate = request.Rate
                };
                _db.CurrencyExchangeRates.Add(existing);
            }
            await _db.SaveChangesAsync();

            var fromC = await _db.Currencies.FindAsync(request.FromCurrencyId);
            var toC = await _db.Currencies.FindAsync(request.ToCurrencyId);

            return new ExchangeRateDto
            {
                Id = existing.Id,
                FromCurrencyId = request.FromCurrencyId,
                FromCurrencyCode = fromC?.Code ?? "",
                ToCurrencyId = request.ToCurrencyId,
                ToCurrencyCode = toC?.Code ?? "",
                Date = existing.Date,
                Rate = existing.Rate
            };
        }

        public async Task<ConvertCurrencyResponse> ConvertCurrencyAsync(string from, string to, decimal amount, DateTime? date)
        {
            from = from.ToUpper();
            to = to.ToUpper();
            if (from == to)
            {
                return new ConvertCurrencyResponse { FromCurrency = from, ToCurrency = to, OriginalAmount = amount, ExchangeRate = 1.0m, RateDate = (date ?? DateTime.UtcNow).ToString("yyyy-MM-dd"), ConvertedAmount = amount };
            }

            var fromC = await _db.Currencies.FirstOrDefaultAsync(c => c.Code == from) ?? throw new NotFoundException($"Không tìm thấy loại tiền {from}");
            var toC = await _db.Currencies.FirstOrDefaultAsync(c => c.Code == to) ?? throw new NotFoundException($"Không tìm thấy loại tiền {to}");

            var targetDate = (date ?? DateTime.UtcNow).Date;
            var rateObj = await _db.CurrencyExchangeRates
                .Where(r => r.FromCurrencyId == fromC.Id && r.ToCurrencyId == toC.Id && r.Date <= targetDate)
                .OrderByDescending(r => r.Date)
                .FirstOrDefaultAsync();

            decimal rate = 1.0m;
            if (rateObj != null)
            {
                rate = rateObj.Rate;
            }
            else
            {
                var invRateObj = await _db.CurrencyExchangeRates
                    .Where(r => r.FromCurrencyId == toC.Id && r.ToCurrencyId == fromC.Id && r.Date <= targetDate)
                    .OrderByDescending(r => r.Date)
                    .FirstOrDefaultAsync();

                if (invRateObj != null && invRateObj.Rate > 0)
                {
                    rate = 1.0m / invRateObj.Rate;
                }
                else
                {
                    throw new NotFoundException($"Chưa có tỷ giá quy đổi từ {from} sang {to} cho ngày {targetDate:yyyy-MM-dd}.");
                }
            }

            var converted = Math.Round(amount * rate, toC.DecimalPlaces);
            return new ConvertCurrencyResponse
            {
                FromCurrency = from,
                ToCurrency = to,
                OriginalAmount = amount,
                ExchangeRate = rate,
                RateDate = targetDate.ToString("yyyy-MM-dd"),
                ConvertedAmount = converted
            };
        }
    }

    // --- MODULE 03: ACCOUNT SERVICE ---
    public interface IAccountService
    {
        Task<List<AccountDto>> GetAccountsAsync(Guid userId, string? type, bool? active);
        Task<AccountDto> GetAccountByIdAsync(Guid userId, Guid accountId);
        Task<AccountDto> CreateAccountAsync(Guid userId, CreateAccountRequest request);
        Task<AccountDto> UpdateAccountAsync(Guid userId, Guid accountId, UpdateAccountRequest request);
        Task DeleteAccountAsync(Guid userId, Guid accountId);
    }

    public class AccountService : IAccountService
    {
        private readonly IApplicationDbContext _db;

        public AccountService(IApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<List<AccountDto>> GetAccountsAsync(Guid userId, string? type, bool? active)
        {
            var query = _db.Accounts
                .Include(a => a.AccountType)
                .Include(a => a.Currency)
                .Include(a => a.AccountMetas)
                .Include(a => a.Transactions)
                .Where(a => a.UserId == userId && a.DeletedAt == null);

            if (active.HasValue) query = query.Where(a => a.Active == active.Value);
            if (!string.IsNullOrWhiteSpace(type))
            {
                if (Enum.TryParse<AccountTypeEnum>(type, true, out var parsedType))
                {
                    query = query.Where(a => a.AccountType.Type == parsedType);
                }
            }

            var accounts = await query.ToListAsync();
            return accounts.Select(MapToAccountDto).ToList();
        }

        public async Task<AccountDto> GetAccountByIdAsync(Guid userId, Guid accountId)
        {
            var account = await _db.Accounts
                .Include(a => a.AccountType)
                .Include(a => a.Currency)
                .Include(a => a.AccountMetas)
                .Include(a => a.Transactions)
                .FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userId && a.DeletedAt == null);

            if (account == null) throw new NotFoundException("Không tìm thấy tài khoản.");
            return MapToAccountDto(account);
        }

        public async Task<AccountDto> CreateAccountAsync(Guid userId, CreateAccountRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                throw new ValidationAppException("Tên tài khoản không được bỏ trống.", new List<ValidationErrorItem> { new ValidationErrorItem("name", "Tên tài khoản không được trống.") });
            }

            if (await _db.Accounts.AnyAsync(a => a.UserId == userId && a.DeletedAt == null && a.Name.ToLower() == request.Name.ToLower()))
            {
                throw new ConflictException($"Tài khoản với tên '{request.Name}' đã tồn tại.");
            }

            if (request.AccountTypeId == Guid.Empty)
            {
                request.AccountTypeId = (await _db.AccountTypes.FirstAsync(at => at.Type == AccountTypeEnum.Asset)).Id;
            }
            else if (!await _db.AccountTypes.AnyAsync(at => at.Id == request.AccountTypeId))
            {
                throw new ValidationAppException("Loại tài khoản không hợp lệ.", new List<ValidationErrorItem> { new ValidationErrorItem("accountTypeId", "Loại tài khoản không tồn tại.") });
            }

            if (request.CurrencyId == Guid.Empty)
            {
                var defaultCode = await _db.Users.Where(u => u.Id == userId).Select(u => u.DefaultCurrency).FirstOrDefaultAsync() ?? "VND";
                request.CurrencyId = (await _db.Currencies.FirstOrDefaultAsync(c => c.Code == defaultCode) ?? await _db.Currencies.FirstAsync(c => c.Enabled)).Id;
            }
            else if (!await _db.Currencies.AnyAsync(c => c.Id == request.CurrencyId))
            {
                throw new ValidationAppException("Loại tiền tệ không hợp lệ.", new List<ValidationErrorItem> { new ValidationErrorItem("currencyId", "Loại tiền tệ không tồn tại.") });
            }

            using var tx = await _db.BeginTransactionAsync();

            var account = new Account
            {
                UserId = userId,
                AccountTypeId = request.AccountTypeId,
                CurrencyId = request.CurrencyId,
                Name = request.Name.Trim(),
                Active = true,
                IncludeInNetWorth = request.IncludeInNetWorth,
                Notes = request.Notes
            };
            _db.Accounts.Add(account);
            await _db.SaveChangesAsync();

            if (!string.IsNullOrWhiteSpace(request.BankName))
            {
                _db.AccountMetas.Add(new AccountMeta { AccountId = account.Id, Name = "bank_name", Value = request.BankName });
            }
            if (!string.IsNullOrWhiteSpace(request.AccountNumber))
            {
                _db.AccountMetas.Add(new AccountMeta { AccountId = account.Id, Name = "account_number", Value = request.AccountNumber });
            }
            await _db.SaveChangesAsync();

            if (request.OpeningBalance > 0)
            {
                var initialType = await _db.AccountTypes.FirstAsync(at => at.Type == AccountTypeEnum.InitialBalance);
                var initialAccount = await _db.Accounts.FirstOrDefaultAsync(a => a.UserId == userId && a.AccountTypeId == initialType.Id);
                if (initialAccount == null)
                {
                    initialAccount = new Account { UserId = userId, AccountTypeId = initialType.Id, CurrencyId = request.CurrencyId, Name = "Số dư ban đầu System", Active = true, IncludeInNetWorth = false };
                    _db.Accounts.Add(initialAccount);
                    await _db.SaveChangesAsync();
                }

                var journal = new TransactionJournal
                {
                    UserId = userId,
                    TransactionType = TransactionTypeEnum.OpeningBalance,
                    Description = $"Số dư ban đầu cho {account.Name}",
                    CompletedAt = request.OpeningBalanceDate ?? DateTime.UtcNow,
                    CurrencyId = request.CurrencyId
                };
                _db.TransactionJournals.Add(journal);
                await _db.SaveChangesAsync();

                _db.Transactions.Add(new Transaction { TransactionJournalId = journal.Id, AccountId = initialAccount.Id, Amount = -request.OpeningBalance, Description = "Opening balance debit leg" });
                _db.Transactions.Add(new Transaction { TransactionJournalId = journal.Id, AccountId = account.Id, Amount = request.OpeningBalance, Description = "Opening balance credit leg" });

                await _db.SaveChangesAsync();
            }

            await tx.CommitAsync();

            return await GetAccountByIdAsync(userId, account.Id);
        }

        public async Task<AccountDto> UpdateAccountAsync(Guid userId, Guid accountId, UpdateAccountRequest request)
        {
            var account = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userId && a.DeletedAt == null);
            if (account == null) throw new NotFoundException("Không tìm thấy tài khoản.");

            if (string.IsNullOrWhiteSpace(request.Name))
            {
                throw new ValidationAppException("Tên tài khoản không được bỏ trống.", new List<ValidationErrorItem> { new ValidationErrorItem("name", "Tên tài khoản không được trống.") });
            }
            if (await _db.Accounts.AnyAsync(a => a.UserId == userId && a.DeletedAt == null && a.Id != accountId && a.Name.ToLower() == request.Name.Trim().ToLower()))
            {
                throw new ConflictException($"Tài khoản với tên '{request.Name}' đã tồn tại.");
            }

            account.Name = request.Name.Trim();
            account.Active = request.Active;
            account.IncludeInNetWorth = request.IncludeInNetWorth;
            account.Notes = request.Notes;
            account.UpdatedAt = DateTime.UtcNow;

            var metas = await _db.AccountMetas.Where(m => m.AccountId == accountId).ToListAsync();
            if (!string.IsNullOrWhiteSpace(request.BankName))
            {
                var bankMeta = metas.FirstOrDefault(m => m.Name == "bank_name");
                if (bankMeta != null) bankMeta.Value = request.BankName;
                else _db.AccountMetas.Add(new AccountMeta { AccountId = accountId, Name = "bank_name", Value = request.BankName });
            }
            if (!string.IsNullOrWhiteSpace(request.AccountNumber))
            {
                var numMeta = metas.FirstOrDefault(m => m.Name == "account_number");
                if (numMeta != null) numMeta.Value = request.AccountNumber;
                else _db.AccountMetas.Add(new AccountMeta { AccountId = accountId, Name = "account_number", Value = request.AccountNumber });
            }

            await _db.SaveChangesAsync();
            return await GetAccountByIdAsync(userId, accountId);
        }

        public async Task DeleteAccountAsync(Guid userId, Guid accountId)
        {
            var account = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userId && a.DeletedAt == null);
            if (account == null) throw new NotFoundException("Không tìm thấy tài khoản.");

            // Soft delete: hide the account everywhere but keep it so past transactions still show where the money went
            account.DeletedAt = DateTime.UtcNow;
            account.Active = false;
            account.IncludeInNetWorth = false;
            account.UpdatedAt = DateTime.UtcNow;

            // Scheduled transactions on this account can no longer run
            foreach (var r in await _db.Recurrences.Where(r => r.UserId == userId && (r.SourceAccountId == accountId || r.DestinationAccountId == accountId)).ToListAsync())
                r.Active = false;

            await _db.SaveChangesAsync();
        }

        private static AccountDto MapToAccountDto(Account a)
        {
            var currentBalance = a.Transactions.Sum(t => t.Amount);
            var metadata = a.AccountMetas.ToDictionary(m => m.Name, m => m.Value);

            return new AccountDto
            {
                Id = a.Id,
                Name = a.Name,
                AccountType = a.AccountType?.Type.ToString() ?? "Asset",
                Currency = new CurrencyDto
                {
                    Id = a.Currency.Id,
                    Code = a.Currency.Code,
                    Name = a.Currency.Name,
                    Symbol = a.Currency.Symbol,
                    DecimalPlaces = a.Currency.DecimalPlaces,
                    Enabled = a.Currency.Enabled
                },
                CurrentBalance = currentBalance,
                Active = a.Active,
                IncludeInNetWorth = a.IncludeInNetWorth,
                Metadata = metadata,
                CreatedAt = a.CreatedAt
            };
        }
    }

    // --- MODULE 04: TRANSACTION SERVICE ---
    public interface ITransactionService
    {
        Task<List<TransactionJournalDto>> GetTransactionsAsync(Guid userId, int page, int pageSize, DateTime? startDate, DateTime? endDate, Guid? accountId, Guid? categoryId, string? type);
        Task<TransactionJournalDto> GetTransactionByIdAsync(Guid userId, Guid id);
        Task<TransactionJournalDto> CreateTransactionAsync(Guid userId, CreateTransactionRequest request);
        Task DeleteTransactionAsync(Guid userId, Guid id);
    }

    public class TransactionService : ITransactionService
    {
        private readonly IApplicationDbContext _db;

        public TransactionService(IApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<List<TransactionJournalDto>> GetTransactionsAsync(Guid userId, int page, int pageSize, DateTime? startDate, DateTime? endDate, Guid? accountId, Guid? categoryId, string? type)
        {
            var query = _db.TransactionJournals
                .Include(j => j.Currency)
                .Include(j => j.Category)
                .Include(j => j.Budget)
                .Include(j => j.Taggables).ThenInclude(tg => tg.Tag)
                .Include(j => j.Transactions).ThenInclude(t => t.Account).ThenInclude(a => a.AccountType)
                .Include(j => j.Transactions).ThenInclude(t => t.Account).ThenInclude(a => a.Currency)
                .Where(j => j.UserId == userId);

            if (startDate.HasValue) query = query.Where(j => j.CompletedAt >= startDate.Value);
            if (endDate.HasValue) query = query.Where(j => j.CompletedAt <= endDate.Value);
            if (categoryId.HasValue) query = query.Where(j => j.CategoryId == categoryId.Value);
            if (accountId.HasValue) query = query.Where(j => j.Transactions.Any(t => t.AccountId == accountId.Value));
            if (!string.IsNullOrWhiteSpace(type) && Enum.TryParse<TransactionTypeEnum>(type, true, out var parsedType))
            {
                query = query.Where(j => j.TransactionType == parsedType);
            }

            var journals = await query.OrderByDescending(j => j.CompletedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return journals.Select(MapToJournalDto).ToList();
        }

        public async Task<TransactionJournalDto> GetTransactionByIdAsync(Guid userId, Guid id)
        {
            var journal = await _db.TransactionJournals
                .Include(j => j.Currency)
                .Include(j => j.Category)
                .Include(j => j.Budget)
                .Include(j => j.Taggables).ThenInclude(tg => tg.Tag)
                .Include(j => j.Transactions).ThenInclude(t => t.Account).ThenInclude(a => a.AccountType)
                .Include(j => j.Transactions).ThenInclude(t => t.Account).ThenInclude(a => a.Currency)
                .FirstOrDefaultAsync(j => j.Id == id && j.UserId == userId);

            if (journal == null) throw new NotFoundException("Không tìm thấy giao dịch.");
            return MapToJournalDto(journal);
        }

        public async Task<TransactionJournalDto> CreateTransactionAsync(Guid userId, CreateTransactionRequest request)
        {
            if (request.Amount <= 0)
            {
                throw new ValidationAppException("Số tiền giao dịch phải lớn hơn 0.", new List<ValidationErrorItem> { new ValidationErrorItem("amount", "Số tiền phải lớn hơn 0.") });
            }
            if (string.IsNullOrWhiteSpace(request.Description))
            {
                throw new ValidationAppException("Diễn giải giao dịch không được trống.", new List<ValidationErrorItem> { new ValidationErrorItem("description", "Vui lòng nhập mô tả.") });
            }

            if (!Enum.TryParse<TransactionTypeEnum>(request.TransactionType, true, out var txType)
                || txType is not (TransactionTypeEnum.Withdrawal or TransactionTypeEnum.Deposit or TransactionTypeEnum.Transfer))
            {
                throw new ValidationAppException("Loại giao dịch không hợp lệ.", new List<ValidationErrorItem> { new ValidationErrorItem("transactionType", "Chỉ chấp nhận Withdrawal, Deposit hoặc Transfer.") });
            }

            if (!await _db.Accounts.AnyAsync(a => a.Id == request.SourceAccountId && a.UserId == userId && a.DeletedAt == null))
                throw new NotFoundException("Không tìm thấy tài khoản nguồn.");
            if (request.DestinationAccountId.HasValue && !await _db.Accounts.AnyAsync(a => a.Id == request.DestinationAccountId && a.UserId == userId && a.DeletedAt == null))
                throw new NotFoundException("Không tìm thấy tài khoản đích.");
            if (request.CategoryId.HasValue && !await _db.Categories.AnyAsync(c => c.Id == request.CategoryId && c.UserId == userId))
                throw new NotFoundException("Không tìm thấy danh mục.");
            if (request.BudgetId.HasValue && !await _db.Budgets.AnyAsync(b => b.Id == request.BudgetId && b.UserId == userId))
                throw new NotFoundException("Không tìm thấy ngân sách.");

            var currency = await _db.Currencies.FirstOrDefaultAsync(c => c.Code == request.CurrencyCode.ToUpper()) ?? await _db.Currencies.FirstAsync(c => c.Enabled);
            var txDate = request.Date == default ? DateTime.UtcNow : request.Date;

            using var tx = await _db.BeginTransactionAsync();

            Guid destAccountId;
            if (txType == TransactionTypeEnum.Transfer)
            {
                if (!request.DestinationAccountId.HasValue || request.DestinationAccountId.Value == request.SourceAccountId)
                {
                    throw new AppException("Tài khoản nguồn và tài khoản đích trong giao dịch chuyển khoản không được trùng nhau.", 400);
                }
                destAccountId = request.DestinationAccountId.Value;
            }
            else if (request.DestinationAccountId.HasValue && request.DestinationAccountId.Value != request.SourceAccountId)
            {
                destAccountId = request.DestinationAccountId.Value;
            }
            else
            {
                // Withdrawals go to an expense account (the shop), deposits come from a revenue account (the payer).
                // Without a name they fall back to a shared bucket so the wallet balance still moves.
                var counterpartType = txType == TransactionTypeEnum.Withdrawal ? AccountTypeEnum.Expense : AccountTypeEnum.Revenue;
                var counterpartName = string.IsNullOrWhiteSpace(request.DestinationAccountName)
                    ? (txType == TransactionTypeEnum.Withdrawal ? "Chi tiêu khác" : "Thu nhập khác")
                    : request.DestinationAccountName.Trim();
                var counterpartTypeId = (await _db.AccountTypes.FirstAsync(at => at.Type == counterpartType)).Id;
                var counterpart = await _db.Accounts.FirstOrDefaultAsync(a => a.UserId == userId && a.DeletedAt == null && a.AccountTypeId == counterpartTypeId && a.Name.ToLower() == counterpartName.ToLower());
                if (counterpart == null)
                {
                    counterpart = new Account { UserId = userId, AccountTypeId = counterpartTypeId, CurrencyId = currency.Id, Name = counterpartName, Active = true, IncludeInNetWorth = false };
                    _db.Accounts.Add(counterpart);
                    await _db.SaveChangesAsync();
                }
                destAccountId = counterpart.Id;
            }

            var journal = new TransactionJournal
            {
                UserId = userId,
                TransactionType = txType,
                Description = request.Description.Trim(),
                CompletedAt = txDate,
                CurrencyId = currency.Id,
                Notes = request.Notes,
                CategoryId = request.CategoryId,
                BudgetId = request.BudgetId
            };
            _db.TransactionJournals.Add(journal);
            await _db.SaveChangesAsync();

            // DOUBLE-ENTRY LEGS
            if (txType == TransactionTypeEnum.Withdrawal)
            {
                _db.Transactions.Add(new Transaction { TransactionJournalId = journal.Id, AccountId = request.SourceAccountId, Amount = -request.Amount });
                _db.Transactions.Add(new Transaction { TransactionJournalId = journal.Id, AccountId = destAccountId, Amount = request.Amount });
            }
            else if (txType == TransactionTypeEnum.Deposit)
            {
                _db.Transactions.Add(new Transaction { TransactionJournalId = journal.Id, AccountId = destAccountId, Amount = -request.Amount });
                _db.Transactions.Add(new Transaction { TransactionJournalId = journal.Id, AccountId = request.SourceAccountId, Amount = request.Amount });
            }
            else
            {
                _db.Transactions.Add(new Transaction { TransactionJournalId = journal.Id, AccountId = request.SourceAccountId, Amount = -request.Amount });
                _db.Transactions.Add(new Transaction { TransactionJournalId = journal.Id, AccountId = destAccountId, Amount = request.Amount });
            }

            if (request.Tags != null && request.Tags.Any())
            {
                foreach (var tagStr in request.Tags)
                {
                    var cleanTag = tagStr.Trim().ToLower();
                    if (string.IsNullOrWhiteSpace(cleanTag)) continue;

                    var tagObj = await _db.Tags.FirstOrDefaultAsync(t => t.UserId == userId && t.Name.ToLower() == cleanTag);
                    if (tagObj == null)
                    {
                        tagObj = new Tag { UserId = userId, Name = cleanTag };
                        _db.Tags.Add(tagObj);
                        await _db.SaveChangesAsync();
                    }

                    _db.Taggables.Add(new Taggable { TagId = tagObj.Id, TransactionJournalId = journal.Id });
                }
            }

            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            return await GetTransactionByIdAsync(userId, journal.Id);
        }

        public async Task DeleteTransactionAsync(Guid userId, Guid id)
        {
            var journal = await _db.TransactionJournals.FirstOrDefaultAsync(j => j.Id == id && j.UserId == userId);
            if (journal == null) throw new NotFoundException("Không tìm thấy giao dịch.");

            using var tx = await _db.BeginTransactionAsync();

            var taggables = await _db.Taggables.Where(t => t.TransactionJournalId == id).ToListAsync();
            _db.Taggables.RemoveRange(taggables);

            var transactions = await _db.Transactions.Where(t => t.TransactionJournalId == id).ToListAsync();
            _db.Transactions.RemoveRange(transactions);

            _db.TransactionJournals.Remove(journal);
            await _db.SaveChangesAsync();

            await tx.CommitAsync();
        }

        private static TransactionJournalDto MapToJournalDto(TransactionJournal j)
        {
            var srcLeg = j.Transactions.FirstOrDefault(t => t.Amount < 0) ?? j.Transactions.FirstOrDefault();
            var dstLeg = j.Transactions.FirstOrDefault(t => t.Amount > 0) ?? j.Transactions.LastOrDefault();

            var amount = j.Transactions.Where(t => t.Amount > 0).Sum(t => t.Amount);
            if (amount == 0) amount = j.Transactions.Select(t => Math.Abs(t.Amount)).FirstOrDefault();

            return new TransactionJournalDto
            {
                Id = j.Id,
                TransactionType = j.TransactionType.ToString(),
                Description = j.Description,
                Amount = amount,
                CurrencyCode = j.Currency?.Code ?? "VND",
                Date = j.CompletedAt,
                Category = j.Category == null ? null : new CategoryDto { Id = j.Category.Id, Name = j.Category.Name, Icon = j.Category.Icon, Color = j.Category.Color, Type = j.Category.Type },
                Budget = j.Budget == null ? null : new BudgetDto { Id = j.Budget.Id, Name = j.Budget.Name, AutoRenewal = j.Budget.AutoRenewal },
                SourceAccount = srcLeg == null ? null! : MapAccountToDto(srcLeg.Account),
                DestinationAccount = dstLeg == null ? null! : MapAccountToDto(dstLeg.Account),
                Tags = j.Taggables.Where(t => t.Tag != null).Select(t => t.Tag.Name).ToList(),
                Notes = j.Notes,
                CreatedAt = j.CreatedAt
            };
        }

        private static AccountDto MapAccountToDto(Account a)
        {
            if (a == null) return null!;
            return new AccountDto
            {
                Id = a.Id,
                Name = a.Name,
                AccountType = a.AccountType?.Type.ToString() ?? "Asset",
                Currency = a.Currency == null ? null! : new CurrencyDto { Id = a.Currency.Id, Code = a.Currency.Code, Symbol = a.Currency.Symbol },
                Active = a.Active
            };
        }
    }

    // --- MODULE 05: CATEGORY & TAG SERVICE ---
    public interface ICategoryTagService
    {
        Task<List<CategoryDto>> GetCategoriesAsync(Guid userId, string? type);
        Task<CategoryDto> CreateCategoryAsync(Guid userId, CreateCategoryRequest request);
        Task<CategoryDto> UpdateCategoryAsync(Guid userId, Guid id, UpdateCategoryRequest request);
        Task DeleteCategoryAsync(Guid userId, Guid id);
        Task<List<TagDto>> GetTagsAsync(Guid userId);
        Task<TagDto> CreateTagAsync(Guid userId, CreateTagRequest request);
        Task<TagDto> UpdateTagAsync(Guid userId, Guid id, UpdateTagRequest request);
        Task DeleteTagAsync(Guid userId, Guid id);
    }

    public class CategoryTagService : ICategoryTagService
    {
        private readonly IApplicationDbContext _db;

        public CategoryTagService(IApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<List<CategoryDto>> GetCategoriesAsync(Guid userId, string? type)
        {
            var query = _db.Categories.Include(c => c.SubCategories).Where(c => c.UserId == userId && c.ParentId == null);
            if (!string.IsNullOrWhiteSpace(type)) query = query.Where(c => c.Type.ToLower() == type.ToLower());

            var parents = await query.OrderBy(c => c.Name).ToListAsync();
            return parents.Select(MapCategoryTree).ToList();
        }

        public async Task<CategoryDto> CreateCategoryAsync(Guid userId, CreateCategoryRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name)) throw new ValidationAppException("Tên danh mục không được trống.", new List<ValidationErrorItem> { new ValidationErrorItem("name", "Vui lòng nhập tên danh mục.") });

            if (await _db.Categories.AnyAsync(c => c.UserId == userId && c.ParentId == request.ParentId && c.Name.ToLower() == request.Name.ToLower()))
            {
                throw new ConflictException("Danh mục với tên này đã tồn tại.");
            }

            if (request.ParentId.HasValue && !await _db.Categories.AnyAsync(c => c.Id == request.ParentId && c.UserId == userId))
            {
                throw new NotFoundException("Không tìm thấy danh mục cha.");
            }

            var category = new Category
            {
                UserId = userId,
                ParentId = request.ParentId,
                Name = request.Name.Trim(),
                Icon = request.Icon,
                Color = request.Color,
                Type = request.Type
            };
            _db.Categories.Add(category);
            await _db.SaveChangesAsync();

            return new CategoryDto { Id = category.Id, Name = category.Name, ParentId = category.ParentId, Icon = category.Icon, Color = category.Color, Type = category.Type };
        }

        public async Task<List<TagDto>> GetTagsAsync(Guid userId)
        {
            var tags = await _db.Tags.Include(t => t.Taggables).Where(t => t.UserId == userId).ToListAsync();
            return tags.Select(t => new TagDto
            {
                Id = t.Id,
                Tag = t.Name,
                Description = t.Description,
                DateFrom = t.DateFrom,
                DateTo = t.DateTo,
                TransactionCount = t.Taggables.Count
            }).ToList();
        }

        public async Task<TagDto> CreateTagAsync(Guid userId, CreateTagRequest request)
        {
            var cleanTag = NormalizeTag(request.Tag, request.DateFrom, request.DateTo);
            if (await _db.Tags.AnyAsync(t => t.UserId == userId && t.Name.ToLower() == cleanTag))
            {
                throw new ConflictException("Tag này đã tồn tại.");
            }

            var tag = new Tag
            {
                UserId = userId,
                Name = cleanTag,
                Description = request.Description,
                DateFrom = request.DateFrom,
                DateTo = request.DateTo
            };
            _db.Tags.Add(tag);
            await _db.SaveChangesAsync();

            return new TagDto { Id = tag.Id, Tag = tag.Name, Description = tag.Description, DateFrom = tag.DateFrom, DateTo = tag.DateTo, TransactionCount = 0 };
        }

        public async Task<CategoryDto> UpdateCategoryAsync(Guid userId, Guid id, UpdateCategoryRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name)) throw new ValidationAppException("Tên danh mục không được trống.", new List<ValidationErrorItem> { new ValidationErrorItem("name", "Vui lòng nhập tên danh mục.") });

            var category = await _db.Categories.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId)
                ?? throw new NotFoundException("Không tìm thấy danh mục.");

            if (request.ParentId.HasValue)
            {
                // Walk up from the new parent; reaching this category means a cycle
                var cursor = request.ParentId;
                while (cursor.HasValue)
                {
                    if (cursor == id) throw new AppException("Không thể chọn chính danh mục này hoặc danh mục con của nó làm danh mục cha.");
                    var node = await _db.Categories.FirstOrDefaultAsync(c => c.Id == cursor && c.UserId == userId)
                        ?? throw new NotFoundException("Không tìm thấy danh mục cha.");
                    cursor = node.ParentId;
                }
            }

            if (await _db.Categories.AnyAsync(c => c.UserId == userId && c.Id != id && c.ParentId == request.ParentId && c.Name.ToLower() == request.Name.Trim().ToLower()))
            {
                throw new ConflictException("Danh mục với tên này đã tồn tại.");
            }

            category.Name = request.Name.Trim();
            category.ParentId = request.ParentId;
            category.Icon = request.Icon;
            category.Color = request.Color;
            category.Type = request.Type;
            await _db.SaveChangesAsync();

            return new CategoryDto { Id = category.Id, Name = category.Name, ParentId = category.ParentId, Icon = category.Icon, Color = category.Color, Type = category.Type };
        }

        public async Task DeleteCategoryAsync(Guid userId, Guid id)
        {
            var category = await _db.Categories.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId)
                ?? throw new NotFoundException("Không tìm thấy danh mục.");

            if (await _db.Categories.AnyAsync(c => c.ParentId == id))
            {
                throw new ConflictException("Danh mục đang có danh mục con. Vui lòng xóa hoặc chuyển các danh mục con trước.");
            }

            // Transactions and recurrences keep existing, just without a category
            var journals = await _db.TransactionJournals.Where(j => j.CategoryId == id).ToListAsync();
            foreach (var j in journals) j.CategoryId = null;
            var recurrences = await _db.Recurrences.Where(r => r.CategoryId == id).ToListAsync();
            foreach (var r in recurrences) r.CategoryId = null;

            _db.Categories.Remove(category);
            await _db.SaveChangesAsync();
        }

        public async Task<TagDto> UpdateTagAsync(Guid userId, Guid id, UpdateTagRequest request)
        {
            var tag = await _db.Tags.Include(t => t.Taggables).FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId)
                ?? throw new NotFoundException("Không tìm thấy thẻ tag.");

            var cleanTag = NormalizeTag(request.Tag, request.DateFrom, request.DateTo);
            if (await _db.Tags.AnyAsync(t => t.UserId == userId && t.Id != id && t.Name.ToLower() == cleanTag))
            {
                throw new ConflictException("Tag này đã tồn tại.");
            }

            tag.Name = cleanTag;
            tag.Description = request.Description;
            tag.DateFrom = request.DateFrom;
            tag.DateTo = request.DateTo;
            await _db.SaveChangesAsync();

            return new TagDto { Id = tag.Id, Tag = tag.Name, Description = tag.Description, DateFrom = tag.DateFrom, DateTo = tag.DateTo, TransactionCount = tag.Taggables.Count };
        }

        public async Task DeleteTagAsync(Guid userId, Guid id)
        {
            var tag = await _db.Tags.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId)
                ?? throw new NotFoundException("Không tìm thấy thẻ tag.");

            // Taggables are removed by cascade
            _db.Tags.Remove(tag);
            await _db.SaveChangesAsync();
        }

        private static string NormalizeTag(string tag, DateTime? dateFrom, DateTime? dateTo)
        {
            var clean = (tag ?? string.Empty).Trim().ToLower();
            if (!System.Text.RegularExpressions.Regex.IsMatch(clean, "^[a-z0-9_\\-]+$"))
            {
                throw new ValidationAppException("Tên tag không hợp lệ.", new List<ValidationErrorItem> { new ValidationErrorItem("tag", "Tên tag chỉ gồm chữ không dấu, số, gạch ngang hoặc gạch dưới, không có khoảng trắng.") });
            }
            if (dateFrom.HasValue && dateTo.HasValue && dateTo < dateFrom)
            {
                throw new ValidationAppException("Khoảng thời gian không hợp lệ.", new List<ValidationErrorItem> { new ValidationErrorItem("dateTo", "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.") });
            }
            return clean;
        }

        private static CategoryDto MapCategoryTree(Category c)
        {
            return new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                ParentId = c.ParentId,
                Icon = c.Icon,
                Color = c.Color,
                Type = c.Type,
                SubCategories = c.SubCategories.Select(MapCategoryTree).ToList()
            };
        }
    }

    // --- MODULE 06: BUDGET SERVICE ---
    public interface IBudgetService
    {
        Task<List<BudgetStatusDto>> GetBudgetsStatusAsync(Guid userId, DateTime start, DateTime end);
        Task<BudgetDto> CreateBudgetAsync(Guid userId, CreateBudgetRequest request);
    }

    public class BudgetService : IBudgetService
    {
        private readonly IApplicationDbContext _db;

        public BudgetService(IApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<List<BudgetStatusDto>> GetBudgetsStatusAsync(Guid userId, DateTime start, DateTime end)
        {
            var budgets = await _db.Budgets.Include(b => b.BudgetLimits).Where(b => b.UserId == userId).ToListAsync();
            var result = new List<BudgetStatusDto>();

            foreach (var b in budgets)
            {
                var limitObj = b.BudgetLimits.FirstOrDefault(l => l.StartDate <= end && l.EndDate >= start);
                var limitAmount = limitObj?.Amount ?? 0;

                var spentAmount = await _db.TransactionJournals
                    .Where(j => j.BudgetId == b.Id && j.CompletedAt >= start && j.CompletedAt <= end)
                    .SelectMany(j => j.Transactions)
                    .Where(t => t.Amount > 0)
                    .SumAsync(t => (decimal?)t.Amount) ?? 0;

                var remaining = limitAmount - spentAmount;
                var percentage = limitAmount > 0 ? Math.Round((spentAmount / limitAmount) * 100, 2) : 0;
                var status = percentage >= 100 ? "Overspent" : (percentage >= 80 ? "Warning" : "Normal");

                result.Add(new BudgetStatusDto
                {
                    BudgetId = b.Id,
                    BudgetName = b.Name,
                    Period = limitObj?.Period ?? "Monthly",
                    StartDate = limitObj?.StartDate ?? start,
                    EndDate = limitObj?.EndDate ?? end,
                    LimitAmount = limitAmount,
                    SpentAmount = spentAmount,
                    RemainingAmount = remaining,
                    PercentageSpent = percentage,
                    Status = status
                });
            }

            return result;
        }

        public async Task<BudgetDto> CreateBudgetAsync(Guid userId, CreateBudgetRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name)) throw new ValidationAppException("Tên ngân sách không được trống.", new List<ValidationErrorItem> { new ValidationErrorItem("name", "Vui lòng nhập tên.") });
            if (request.LimitAmount <= 0) throw new ValidationAppException("Hạn mức ngân sách phải lớn hơn 0.", new List<ValidationErrorItem> { new ValidationErrorItem("limitAmount", "Hạn mức phải lớn hơn 0.") });
            if (request.End < request.Start) throw new ValidationAppException("Khoảng thời gian không hợp lệ.", new List<ValidationErrorItem> { new ValidationErrorItem("end", "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.") });

            using var tx = await _db.BeginTransactionAsync();

            var budget = new Budget { UserId = userId, Name = request.Name.Trim(), AutoRenewal = true };
            _db.Budgets.Add(budget);
            await _db.SaveChangesAsync();

            _db.BudgetLimits.Add(new BudgetLimit
            {
                BudgetId = budget.Id,
                Amount = request.LimitAmount,
                Period = request.Period,
                StartDate = request.Start,
                EndDate = request.End
            });
            await _db.SaveChangesAsync();

            await tx.CommitAsync();

            return new BudgetDto { Id = budget.Id, Name = budget.Name, AutoRenewal = budget.AutoRenewal };
        }
    }

    // --- MODULE 07: BILL & RECURRENCE SERVICE ---
    public interface IBillRecurrenceService
    {
        Task<List<BillDto>> GetBillsAsync(Guid userId);
        Task<BillDto> CreateBillAsync(Guid userId, CreateBillRequest request);
        Task<List<RecurrenceDto>> GetRecurrencesAsync(Guid userId);
        Task<RecurrenceDto> CreateRecurrenceAsync(Guid userId, CreateRecurrenceRequest request);
    }

    public class BillRecurrenceService : IBillRecurrenceService
    {
        private readonly IApplicationDbContext _db;

        public BillRecurrenceService(IApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<List<BillDto>> GetBillsAsync(Guid userId)
        {
            var bills = await _db.Bills.Include(b => b.TransactionJournals).Where(b => b.UserId == userId && b.Active).ToListAsync();
            var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);

            return bills.Select(b =>
            {
                var matched = b.TransactionJournals.FirstOrDefault(j => j.CompletedAt >= startOfMonth);
                return new BillDto
                {
                    Id = b.Id,
                    Name = b.Name,
                    AmountMin = b.AmountMin,
                    AmountMax = b.AmountMax,
                    RepeatFrequency = b.RepeatFrequency,
                    NextDueDate = b.Date,
                    IsPaidThisPeriod = matched != null,
                    MatchedTransactionId = matched?.Id
                };
            }).ToList();
        }

        public async Task<BillDto> CreateBillAsync(Guid userId, CreateBillRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name)) throw new ValidationAppException("Tên hóa đơn không được trống.", new List<ValidationErrorItem> { new ValidationErrorItem("name", "Vui lòng nhập tên hóa đơn.") });
            if (request.AmountMin <= 0) throw new ValidationAppException("Số tiền hóa đơn phải lớn hơn 0.", new List<ValidationErrorItem> { new ValidationErrorItem("amountMin", "Số tiền phải lớn hơn 0.") });
            if (request.AmountMin > request.AmountMax) throw new AppException("Số tiền Min không thể lớn hơn Max.", 400);

            var bill = new Bill
            {
                UserId = userId,
                Name = request.Name.Trim(),
                AmountMin = request.AmountMin,
                AmountMax = request.AmountMax,
                RepeatFrequency = request.RepeatFrequency,
                Date = request.Date,
                Active = request.Active
            };
            _db.Bills.Add(bill);
            await _db.SaveChangesAsync();

            return new BillDto { Id = bill.Id, Name = bill.Name, AmountMin = bill.AmountMin, AmountMax = bill.AmountMax, RepeatFrequency = bill.RepeatFrequency, NextDueDate = bill.Date, IsPaidThisPeriod = false };
        }

        public async Task<List<RecurrenceDto>> GetRecurrencesAsync(Guid userId)
        {
            var recurrences = await _db.Recurrences.Where(r => r.UserId == userId).ToListAsync();
            return recurrences.Select(r => new RecurrenceDto
            {
                Id = r.Id,
                Title = r.Title,
                TransactionType = r.TransactionType.ToString(),
                RepeatFrequency = r.RepeatFrequency,
                FirstDate = r.FirstDate,
                NextDate = r.NextDate,
                RepeatUntil = r.RepeatUntil,
                Amount = r.Amount,
                Active = r.Active
            }).ToList();
        }

        public async Task<RecurrenceDto> CreateRecurrenceAsync(Guid userId, CreateRecurrenceRequest request)
        {
            if (!Enum.TryParse<TransactionTypeEnum>(request.Type, true, out var txType)) txType = TransactionTypeEnum.Deposit;
            if (string.IsNullOrWhiteSpace(request.Title)) throw new ValidationAppException("Tên giao dịch định kỳ không được trống.", new List<ValidationErrorItem> { new ValidationErrorItem("title", "Vui lòng nhập tên.") });
            if (request.Amount <= 0) throw new ValidationAppException("Số tiền phải lớn hơn 0.", new List<ValidationErrorItem> { new ValidationErrorItem("amount", "Số tiền phải lớn hơn 0.") });
            if (!await _db.Accounts.AnyAsync(a => a.Id == request.SourceAccountId && a.UserId == userId && a.DeletedAt == null)
                || !await _db.Accounts.AnyAsync(a => a.Id == request.DestinationAccountId && a.UserId == userId && a.DeletedAt == null))
                throw new NotFoundException("Không tìm thấy tài khoản.");
            if (request.CategoryId.HasValue && !await _db.Categories.AnyAsync(c => c.Id == request.CategoryId && c.UserId == userId))
                throw new NotFoundException("Không tìm thấy danh mục.");

            var rec = new Recurrence
            {
                UserId = userId,
                Title = request.Title,
                TransactionType = txType,
                RepeatFrequency = request.RepeatFrequency,
                FirstDate = request.FirstDate,
                NextDate = request.FirstDate,
                RepeatUntil = request.RepeatUntil,
                Amount = request.Amount,
                SourceAccountId = request.SourceAccountId,
                DestinationAccountId = request.DestinationAccountId,
                CategoryId = request.CategoryId,
                Active = true
            };
            _db.Recurrences.Add(rec);
            await _db.SaveChangesAsync();

            return new RecurrenceDto { Id = rec.Id, Title = rec.Title, TransactionType = rec.TransactionType.ToString(), RepeatFrequency = rec.RepeatFrequency, FirstDate = rec.FirstDate, NextDate = rec.NextDate, Amount = rec.Amount, Active = rec.Active };
        }
    }

    // --- MODULE 08: PIGGY BANK SERVICE ---
    public interface IPiggyBankService
    {
        Task<List<PiggyBankDto>> GetPiggyBanksAsync(Guid userId);
        Task<PiggyBankDto> CreatePiggyBankAsync(Guid userId, CreatePiggyBankRequest request);
        Task<PiggyBankDto> ProcessEventAsync(Guid userId, Guid piggyBankId, PiggyBankEventRequest request);
    }

    public class PiggyBankService : IPiggyBankService
    {
        private readonly IApplicationDbContext _db;

        public PiggyBankService(IApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<List<PiggyBankDto>> GetPiggyBanksAsync(Guid userId)
        {
            var piggyBanks = await _db.PiggyBanks.Include(p => p.Account).Where(p => p.Account.UserId == userId && p.Account.DeletedAt == null).ToListAsync();
            return piggyBanks.Select(MapPiggyDto).ToList();
        }

        public async Task<PiggyBankDto> CreatePiggyBankAsync(Guid userId, CreatePiggyBankRequest request)
        {
            var account = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == request.AccountId && a.UserId == userId && a.DeletedAt == null) ?? throw new NotFoundException("Không tìm thấy ví.");
            if (string.IsNullOrWhiteSpace(request.Name)) throw new ValidationAppException("Tên hũ tiết kiệm không được trống.", new List<ValidationErrorItem> { new ValidationErrorItem("name", "Vui lòng nhập tên hũ.") });
            if (request.TargetAmount <= 0) throw new ValidationAppException("Số tiền mục tiêu phải lớn hơn 0.", new List<ValidationErrorItem> { new ValidationErrorItem("targetAmount", "Số tiền mục tiêu phải lớn hơn 0.") });
            if (request.CurrentAmount < 0) throw new ValidationAppException("Số tiền hiện có không được âm.", new List<ValidationErrorItem> { new ValidationErrorItem("currentAmount", "Số tiền không được âm.") });

            using var tx = await _db.BeginTransactionAsync();

            var piggy = new PiggyBank
            {
                AccountId = request.AccountId,
                Name = request.Name.Trim(),
                TargetAmount = request.TargetAmount,
                CurrentAmount = request.CurrentAmount,
                TargetDate = request.TargetDate,
                Notes = request.Notes
            };
            _db.PiggyBanks.Add(piggy);
            await _db.SaveChangesAsync();

            if (request.CurrentAmount > 0)
            {
                _db.PiggyBankEvents.Add(new PiggyBankEvent { PiggyBankId = piggy.Id, Action = PiggyEventActionEnum.Deposit, Amount = request.CurrentAmount, Notes = "Khởi tạo hũ" });
                await _db.SaveChangesAsync();
            }

            await tx.CommitAsync();

            piggy.Account = account;
            return MapPiggyDto(piggy);
        }

        public async Task<PiggyBankDto> ProcessEventAsync(Guid userId, Guid piggyBankId, PiggyBankEventRequest request)
        {
            var piggy = await _db.PiggyBanks.Include(p => p.Account).FirstOrDefaultAsync(p => p.Id == piggyBankId && p.Account.UserId == userId && p.Account.DeletedAt == null) ?? throw new NotFoundException("Không tìm thấy hũ tiết kiệm.");

            if (!Enum.TryParse<PiggyEventActionEnum>(request.Action, true, out var action)) action = PiggyEventActionEnum.Deposit;
            if (request.Amount <= 0) throw new ValidationAppException("Số tiền phải lớn hơn 0.", new List<ValidationErrorItem> { new ValidationErrorItem("amount", "Số tiền phải lớn hơn 0.") });

            if (action == PiggyEventActionEnum.Withdraw && request.Amount > piggy.CurrentAmount)
            {
                throw new AppException("Số tiền rút vượt quá số tiền hiện có trong hũ.", 400);
            }

            using var tx = await _db.BeginTransactionAsync();

            if (action == PiggyEventActionEnum.Deposit) piggy.CurrentAmount += request.Amount;
            else piggy.CurrentAmount -= request.Amount;

            piggy.UpdatedAt = DateTime.UtcNow;

            _db.PiggyBankEvents.Add(new PiggyBankEvent { PiggyBankId = piggy.Id, Action = action, Amount = request.Amount, Notes = request.Notes });
            await _db.SaveChangesAsync();

            await tx.CommitAsync();

            return MapPiggyDto(piggy);
        }

        private static PiggyBankDto MapPiggyDto(PiggyBank p)
        {
            var remaining = p.TargetAmount - p.CurrentAmount;
            var pct = p.TargetAmount > 0 ? Math.Round((p.CurrentAmount / p.TargetAmount) * 100, 2) : 0;

            decimal suggestedMonthly = 0;
            if (p.TargetDate.HasValue && p.TargetDate.Value > DateTime.UtcNow && remaining > 0)
            {
                var months = Math.Max(1, ((p.TargetDate.Value.Year - DateTime.UtcNow.Year) * 12) + p.TargetDate.Value.Month - DateTime.UtcNow.Month);
                suggestedMonthly = Math.Round(remaining / months, 0);
            }

            return new PiggyBankDto
            {
                Id = p.Id,
                Name = p.Name,
                AccountName = p.Account?.Name ?? "",
                TargetAmount = p.TargetAmount,
                CurrentAmount = p.CurrentAmount,
                RemainingAmount = Math.Max(0, remaining),
                PercentageCompleted = pct,
                TargetDate = p.TargetDate,
                SuggestedMonthlyDeposit = suggestedMonthly,
                UpdatedAt = p.UpdatedAt ?? p.CreatedAt
            };
        }
    }

    // --- MODULE 09: STATISTICS SERVICE ---
    public interface IStatisticsService
    {
        Task<FinancialSummaryDto> GetSummaryAsync(Guid userId, DateTime start, DateTime end, string currencyCode);
        Task<List<CashflowTrendDto>> GetCashflowTrendAsync(Guid userId, DateTime start, DateTime end);
        Task<List<CategoryBreakdownDto>> GetCategoryBreakdownAsync(Guid userId, DateTime start, DateTime end);
    }

    public class StatisticsService : IStatisticsService
    {
        private readonly IApplicationDbContext _db;

        public StatisticsService(IApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<FinancialSummaryDto> GetSummaryAsync(Guid userId, DateTime start, DateTime end, string currencyCode)
        {
            var journals = await _db.TransactionJournals
                .Include(j => j.Transactions).ThenInclude(t => t.Account).ThenInclude(a => a.AccountType)
                .Where(j => j.UserId == userId && j.CompletedAt >= start && j.CompletedAt <= end)
                .ToListAsync();

            decimal totalIncome = 0;
            decimal totalExpense = 0;

            foreach (var j in journals)
            {
                if (j.TransactionType == TransactionTypeEnum.Deposit)
                {
                    totalIncome += j.Transactions.Where(t => t.Amount > 0).Sum(t => t.Amount);
                }
                else if (j.TransactionType == TransactionTypeEnum.Withdrawal)
                {
                    totalExpense += j.Transactions.Where(t => t.Amount > 0).Sum(t => t.Amount);
                }
            }

            var assetType = await _db.AccountTypes.FirstOrDefaultAsync(at => at.Type == AccountTypeEnum.Asset);
            var netWorth = await _db.Accounts
                .Where(a => a.UserId == userId && a.DeletedAt == null && a.IncludeInNetWorth && (assetType == null || a.AccountTypeId == assetType.Id))
                .SelectMany(a => a.Transactions)
                .SumAsync(t => (decimal?)t.Amount) ?? 0;

            var breakdown = await GetCategoryBreakdownAsync(userId, start, end);

            return new FinancialSummaryDto
            {
                Currency = currencyCode,
                Period = new PeriodDto { StartDate = start, EndDate = end },
                Kpi = new KpiDto
                {
                    TotalIncome = totalIncome,
                    TotalExpense = totalExpense,
                    NetCashflow = totalIncome - totalExpense,
                    CurrentNetWorth = netWorth
                },
                CategoryBreakdown = breakdown
            };
        }

        public async Task<List<CashflowTrendDto>> GetCashflowTrendAsync(Guid userId, DateTime start, DateTime end)
        {
            var journals = await _db.TransactionJournals
                .Include(j => j.Transactions)
                .Where(j => j.UserId == userId && j.CompletedAt >= start && j.CompletedAt <= end)
                .ToListAsync();

            var grouped = journals.GroupBy(j => j.CompletedAt.ToString("yyyy-MM-dd")).OrderBy(g => g.Key);

            var list = new List<CashflowTrendDto>();
            foreach (var group in grouped)
            {
                decimal income = 0;
                decimal expense = 0;
                foreach (var j in group)
                {
                    if (j.TransactionType == TransactionTypeEnum.Deposit) income += j.Transactions.Where(t => t.Amount > 0).Sum(t => t.Amount);
                    else if (j.TransactionType == TransactionTypeEnum.Withdrawal) expense += j.Transactions.Where(t => t.Amount > 0).Sum(t => t.Amount);
                }
                list.Add(new CashflowTrendDto { Date = group.Key, Income = income, Expense = expense, Net = income - expense });
            }

            return list;
        }

        public async Task<List<CategoryBreakdownDto>> GetCategoryBreakdownAsync(Guid userId, DateTime start, DateTime end)
        {
            var journals = await _db.TransactionJournals
                .Include(j => j.Category)
                .Include(j => j.Transactions)
                .Where(j => j.UserId == userId && j.TransactionType == TransactionTypeEnum.Withdrawal && j.CompletedAt >= start && j.CompletedAt <= end && j.CategoryId.HasValue)
                .ToListAsync();

            var totalSpent = journals.SelectMany(j => j.Transactions).Where(t => t.Amount > 0).Sum(t => t.Amount);

            var grouped = journals.GroupBy(j => j.Category!).Select(g =>
            {
                var cat = g.Key;
                var spent = g.SelectMany(j => j.Transactions).Where(t => t.Amount > 0).Sum(t => t.Amount);
                var pct = totalSpent > 0 ? Math.Round((spent / totalSpent) * 100, 2) : 0;
                return new CategoryBreakdownDto
                {
                    CategoryId = cat.Id,
                    CategoryName = cat.Name,
                    Color = cat.Color,
                    Amount = spent,
                    Percentage = pct
                };
            }).OrderByDescending(c => c.Amount).ToList();

            return grouped;
        }
    }
}
