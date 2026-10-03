using System;
using System.Collections.Generic;
using FinancialManager.Domain.Common;
using FinancialManager.Domain.Enums;

namespace FinancialManager.Domain.Entities
{
    public class User : BaseEntity
    {
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string DefaultCurrency { get; set; } = "VND";
        public string Status { get; set; } = "active"; // active, inactive
        public string? MfaSecret { get; set; }

        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
        public ICollection<PersonalAccessToken> PersonalAccessTokens { get; set; } = new List<PersonalAccessToken>();
        public ICollection<Account> Accounts { get; set; } = new List<Account>();
    }

    public class Role : BaseEntity
    {
        public string Name { get; set; } = string.Empty; // Admin, StandardUser
        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    }

    public class UserRole
    {
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
        public Guid RoleId { get; set; }
        public Role Role { get; set; } = null!;
    }

    public class PersonalAccessToken : BaseEntity
    {
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
        public string TokenHash { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public bool Revoked { get; set; } = false;
    }

    public class Currency : BaseEntity
    {
        public string Code { get; set; } = string.Empty; // ISO 4217: VND, USD, EUR
        public string Name { get; set; } = string.Empty;
        public string Symbol { get; set; } = string.Empty;
        public int DecimalPlaces { get; set; } = 2;
        public bool Enabled { get; set; } = true;
        public Guid? UserId { get; set; } // Null for system currency, user ID for custom currency
    }

    public class CurrencyExchangeRate : BaseEntity
    {
        public Guid FromCurrencyId { get; set; }
        public Currency FromCurrency { get; set; } = null!;
        public Guid ToCurrencyId { get; set; }
        public Currency ToCurrency { get; set; } = null!;
        public DateTime Date { get; set; }
        public decimal Rate { get; set; }
    }

    public class AccountType : BaseEntity
    {
        public AccountTypeEnum Type { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public class Account : BaseEntity
    {
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
        public Guid AccountTypeId { get; set; }
        public AccountType AccountType { get; set; } = null!;
        public Guid CurrencyId { get; set; }
        public Currency Currency { get; set; } = null!;

        public string Name { get; set; } = string.Empty;
        public bool Active { get; set; } = true;
        public bool IncludeInNetWorth { get; set; } = true;
        public string? Notes { get; set; }
        /// <summary>Soft delete: the account is hidden but its transaction history is kept</summary>
        public DateTime? DeletedAt { get; set; }

        public ICollection<AccountMeta> AccountMetas { get; set; } = new List<AccountMeta>();
        public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    }

    public class AccountMeta : BaseEntity
    {
        public Guid AccountId { get; set; }
        public Account Account { get; set; } = null!;
        public string Name { get; set; } = string.Empty; // bank_name, account_number, iban
        public string Value { get; set; } = string.Empty;
    }

    public class Category : BaseEntity
    {
        public Guid UserId { get; set; }
        public Guid? ParentId { get; set; }
        public Category? Parent { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Icon { get; set; } = "folder";
        public string Color { get; set; } = "#000000";
        public string Type { get; set; } = "Expense"; // Expense, Revenue

        public ICollection<Category> SubCategories { get; set; } = new List<Category>();
        public ICollection<TransactionJournal> TransactionJournals { get; set; } = new List<TransactionJournal>();
    }

    public class Tag : BaseEntity
    {
        public Guid UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime? DateFrom { get; set; }
        public DateTime? DateTo { get; set; }

        public ICollection<Taggable> Taggables { get; set; } = new List<Taggable>();
    }

    public class Taggable : BaseEntity
    {
        public Guid TagId { get; set; }
        public Tag Tag { get; set; } = null!;
        public Guid TransactionJournalId { get; set; }
        public TransactionJournal TransactionJournal { get; set; } = null!;
    }

    public class TransactionJournal : BaseEntity
    {
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
        public TransactionTypeEnum TransactionType { get; set; }
        public string Description { get; set; } = string.Empty;
        public DateTime CompletedAt { get; set; }
        public Guid CurrencyId { get; set; }
        public Currency Currency { get; set; } = null!;
        public string? Notes { get; set; }

        public Guid? CategoryId { get; set; }
        public Category? Category { get; set; }

        public Guid? BudgetId { get; set; }
        public Budget? Budget { get; set; }

        public Guid? BillId { get; set; }
        public Bill? Bill { get; set; }

        public Guid? RecurrenceId { get; set; }
        public Recurrence? Recurrence { get; set; }

        public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
        public ICollection<JournalMeta> JournalMetas { get; set; } = new List<JournalMeta>();
        public ICollection<Taggable> Taggables { get; set; } = new List<Taggable>();
    }

    public class Transaction : BaseEntity
    {
        public Guid TransactionJournalId { get; set; }
        public TransactionJournal TransactionJournal { get; set; } = null!;
        public Guid AccountId { get; set; }
        public Account Account { get; set; } = null!;
        public decimal Amount { get; set; } // Debit is negative (-), Credit is positive (+)
        public string? Description { get; set; }
        public bool Reconciled { get; set; } = false;
    }

    public class JournalMeta : BaseEntity
    {
        public Guid TransactionJournalId { get; set; }
        public TransactionJournal TransactionJournal { get; set; } = null!;
        public string Name { get; set; } = string.Empty; // latitude, longitude, location_name
        public string Value { get; set; } = string.Empty;
    }

    public class Budget : BaseEntity
    {
        public Guid UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public bool AutoRenewal { get; set; } = true;

        public ICollection<BudgetLimit> BudgetLimits { get; set; } = new List<BudgetLimit>();
        public ICollection<TransactionJournal> TransactionJournals { get; set; } = new List<TransactionJournal>();
    }

    public class BudgetLimit : BaseEntity
    {
        public Guid BudgetId { get; set; }
        public Budget Budget { get; set; } = null!;
        public decimal Amount { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Period { get; set; } = "Monthly"; // Daily, Weekly, Monthly, Yearly, Custom
    }

    public class Bill : BaseEntity
    {
        public Guid UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal AmountMin { get; set; }
        public decimal AmountMax { get; set; }
        public string RepeatFrequency { get; set; } = "Monthly";
        public DateTime Date { get; set; }
        public bool Active { get; set; } = true;

        public ICollection<TransactionJournal> TransactionJournals { get; set; } = new List<TransactionJournal>();
    }

    public class Recurrence : BaseEntity
    {
        public Guid UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public TransactionTypeEnum TransactionType { get; set; }
        public string RepeatFrequency { get; set; } = "Monthly"; // Daily, Weekly, Monthly, Yearly
        public DateTime FirstDate { get; set; }
        public DateTime? NextDate { get; set; }
        public DateTime? RepeatUntil { get; set; }
        public decimal Amount { get; set; }

        public Guid SourceAccountId { get; set; }
        public Account SourceAccount { get; set; } = null!;
        public Guid DestinationAccountId { get; set; }
        public Account DestinationAccount { get; set; } = null!;

        public Guid? CategoryId { get; set; }
        public Category? Category { get; set; }

        public bool Active { get; set; } = true;
    }

    public class PiggyBank : BaseEntity
    {
        public Guid AccountId { get; set; }
        public Account Account { get; set; } = null!;
        public string Name { get; set; } = string.Empty;
        public decimal TargetAmount { get; set; }
        public decimal CurrentAmount { get; set; } = 0;
        public DateTime? TargetDate { get; set; }
        public string? Notes { get; set; }

        public ICollection<PiggyBankEvent> PiggyBankEvents { get; set; } = new List<PiggyBankEvent>();
    }

    public class PiggyBankEvent : BaseEntity
    {
        public Guid PiggyBankId { get; set; }
        public PiggyBank PiggyBank { get; set; } = null!;
        public Guid? TransactionJournalId { get; set; }
        public TransactionJournal? TransactionJournal { get; set; }

        public PiggyEventActionEnum Action { get; set; } // Deposit, Withdraw
        public decimal Amount { get; set; }
        public string? Notes { get; set; }
    }

    public class SyncHistory : BaseEntity
    {
        public Guid UserId { get; set; }
        public string DeviceId { get; set; } = string.Empty;
        public string DeviceName { get; set; } = string.Empty;
        public DateTime SyncTime { get; set; } = DateTime.UtcNow;
        public int UploadedCount { get; set; }
        public int DownloadedCount { get; set; }
        public string Status { get; set; } = "SUCCESS"; // SUCCESS, FAILED
        public string? ErrorMessage { get; set; }
        public long DurationMs { get; set; }
    }
}
