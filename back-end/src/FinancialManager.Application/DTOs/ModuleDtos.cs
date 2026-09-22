using System;
using System.Collections.Generic;

namespace FinancialManager.Application.DTOs
{
    // --- MODULE 01: AUTH & USERS ---
    public class RegisterRequest
    {
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;
        public string CurrencyCode { get; set; } = "VND";
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public bool RememberMe { get; set; } = false;
        public string? MfaCode { get; set; }
    }

    public class RefreshTokenRequest
    {
        public string RefreshToken { get; set; } = string.Empty;
    }

    public class ClearDataRequest
    {
        public string Password { get; set; } = string.Empty;
        /// <summary>"transactions": only transactions (balances back to 0); "all": everything, the account is reset to a fresh state</summary>
        public string Scope { get; set; } = "transactions";
    }

    public class ClearDataResult
    {
        public string Scope { get; set; } = string.Empty;
        public int Transactions { get; set; }
        public int Accounts { get; set; }
        public int Categories { get; set; }
        public int Tags { get; set; }
        public int Budgets { get; set; }
        public int Bills { get; set; }
        public int PiggyBanks { get; set; }
        public int Recurrences { get; set; }
    }

    public class AuthResponse
    {
        public string AccessToken { get; set; } = string.Empty;
        public string TokenType { get; set; } = "Bearer";
        public int ExpiresIn { get; set; } = 3600;
        public string RefreshToken { get; set; } = string.Empty;
        public UserProfileDto User { get; set; } = null!;
    }

    public class UserProfileDto
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string DefaultCurrency { get; set; } = "VND";
    }

    // --- MODULE 02: CURRENCIES ---
    public class CurrencyDto
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Symbol { get; set; } = string.Empty;
        public int DecimalPlaces { get; set; }
        public bool Enabled { get; set; }
    }

    public class CreateCurrencyRequest
    {
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Symbol { get; set; } = string.Empty;
        public int DecimalPlaces { get; set; } = 2;
        public bool Enabled { get; set; } = true;
    }

    public class ExchangeRateDto
    {
        public Guid Id { get; set; }
        public Guid FromCurrencyId { get; set; }
        public string FromCurrencyCode { get; set; } = string.Empty;
        public Guid ToCurrencyId { get; set; }
        public string ToCurrencyCode { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public decimal Rate { get; set; }
    }

    public class CreateExchangeRateRequest
    {
        public Guid FromCurrencyId { get; set; }
        public Guid ToCurrencyId { get; set; }
        public DateTime Date { get; set; }
        public decimal Rate { get; set; }
    }

    public class ConvertCurrencyResponse
    {
        public string FromCurrency { get; set; } = string.Empty;
        public string ToCurrency { get; set; } = string.Empty;
        public decimal OriginalAmount { get; set; }
        public decimal ExchangeRate { get; set; }
        public string RateDate { get; set; } = string.Empty;
        public decimal ConvertedAmount { get; set; }
    }

    // --- MODULE 03: ACCOUNTS & WALLETS ---
    public class AccountDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string AccountType { get; set; } = string.Empty; // Asset, Expense, Revenue...
        public CurrencyDto Currency { get; set; } = null!;
        public decimal CurrentBalance { get; set; }
        public bool Active { get; set; }
        public bool IncludeInNetWorth { get; set; }
        public Dictionary<string, string> Metadata { get; set; } = new();
        public DateTime CreatedAt { get; set; }
    }

    public class CreateAccountRequest
    {
        public string Name { get; set; } = string.Empty;
        public Guid AccountTypeId { get; set; }
        public Guid CurrencyId { get; set; }
        public decimal OpeningBalance { get; set; } = 0;
        public DateTime? OpeningBalanceDate { get; set; }
        public string? BankName { get; set; }
        public string? AccountNumber { get; set; }
        public bool IncludeInNetWorth { get; set; } = true;
        public string? Notes { get; set; }
    }

    public class UpdateAccountRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? BankName { get; set; }
        public string? AccountNumber { get; set; }
        public bool Active { get; set; } = true;
        public bool IncludeInNetWorth { get; set; } = true;
        public string? Notes { get; set; }
    }

    // --- MODULE 04: TRANSACTIONS ---
    public class TransactionJournalDto
    {
        public Guid Id { get; set; }
        public string TransactionType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string CurrencyCode { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public CategoryDto? Category { get; set; }
        public BudgetDto? Budget { get; set; }
        public AccountDto SourceAccount { get; set; } = null!;
        public AccountDto DestinationAccount { get; set; } = null!;
        public List<string> Tags { get; set; } = new();
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateTransactionRequest
    {
        public string TransactionType { get; set; } = "Withdrawal"; // Withdrawal, Deposit, Transfer
        public string Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string CurrencyCode { get; set; } = "VND";
        public DateTime Date { get; set; } = DateTime.UtcNow;
        public Guid SourceAccountId { get; set; }
        public Guid? DestinationAccountId { get; set; }
        public string? DestinationAccountName { get; set; }
        public Guid? CategoryId { get; set; }
        public Guid? BudgetId { get; set; }
        public List<string>? Tags { get; set; }
        public string? Notes { get; set; }
    }

    // --- MODULE 05: CATEGORIES & TAGS ---
    public class CategoryDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public Guid? ParentId { get; set; }
        public string Icon { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public string Type { get; set; } = "Expense";
        public List<CategoryDto> SubCategories { get; set; } = new();
    }

    public class CreateCategoryRequest
    {
        public string Name { get; set; } = string.Empty;
        public Guid? ParentId { get; set; }
        public string Icon { get; set; } = "folder";
        public string Color { get; set; } = "#333333";
        public string Type { get; set; } = "Expense";
    }

    public class UpdateCategoryRequest
    {
        public string Name { get; set; } = string.Empty;
        public Guid? ParentId { get; set; }
        public string Icon { get; set; } = "folder";
        public string Color { get; set; } = "#333333";
        public string Type { get; set; } = "Expense";
    }

    public class TagDto
    {
        public Guid Id { get; set; }
        public string Tag { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime? DateFrom { get; set; }
        public DateTime? DateTo { get; set; }
        public int TransactionCount { get; set; }
    }

    public class CreateTagRequest
    {
        public string Tag { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime? DateFrom { get; set; }
        public DateTime? DateTo { get; set; }
    }

    public class UpdateTagRequest
    {
        public string Tag { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime? DateFrom { get; set; }
        public DateTime? DateTo { get; set; }
    }

    // --- MODULE 06: BUDGETS ---
    public class BudgetDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public bool AutoRenewal { get; set; }
    }

    public class CreateBudgetRequest
    {
        public string Name { get; set; } = string.Empty;
        public List<Guid>? CategoryIds { get; set; }
        public decimal LimitAmount { get; set; }
        public string Period { get; set; } = "Monthly";
        public DateTime Start { get; set; }
        public DateTime End { get; set; }
    }

    public class BudgetStatusDto
    {
        public Guid BudgetId { get; set; }
        public string BudgetName { get; set; } = string.Empty;
        public string Period { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal LimitAmount { get; set; }
        public decimal SpentAmount { get; set; }
        public decimal RemainingAmount { get; set; }
        public decimal PercentageSpent { get; set; }
        public string Status { get; set; } = "Normal"; // Normal, Warning, Overspent
    }

    // --- MODULE 07: BILLS & RECURRENCES ---
    public class BillDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal AmountMin { get; set; }
        public decimal AmountMax { get; set; }
        public string RepeatFrequency { get; set; } = string.Empty;
        public DateTime NextDueDate { get; set; }
        public bool IsPaidThisPeriod { get; set; }
        public Guid? MatchedTransactionId { get; set; }
    }

    public class CreateBillRequest
    {
        public string Name { get; set; } = string.Empty;
        public decimal AmountMin { get; set; }
        public decimal AmountMax { get; set; }
        public string RepeatFrequency { get; set; } = "Monthly";
        public DateTime Date { get; set; }
        public bool Active { get; set; } = true;
    }

    public class RecurrenceDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string TransactionType { get; set; } = string.Empty;
        public string RepeatFrequency { get; set; } = string.Empty;
        public DateTime FirstDate { get; set; }
        public DateTime? NextDate { get; set; }
        public DateTime? RepeatUntil { get; set; }
        public decimal Amount { get; set; }
        public bool Active { get; set; }
    }

    public class CreateRecurrenceRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Type { get; set; } = "Deposit";
        public string RepeatFrequency { get; set; } = "Monthly";
        public DateTime FirstDate { get; set; }
        public DateTime? RepeatUntil { get; set; }
        public decimal Amount { get; set; }
        public Guid SourceAccountId { get; set; }
        public Guid DestinationAccountId { get; set; }
        public string? SourceAccountName { get; set; }
        public Guid? CategoryId { get; set; }
    }

    // --- MODULE 08: PIGGY BANKS ---
    public class PiggyBankDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string AccountName { get; set; } = string.Empty;
        public decimal TargetAmount { get; set; }
        public decimal CurrentAmount { get; set; }
        public decimal RemainingAmount { get; set; }
        public decimal PercentageCompleted { get; set; }
        public DateTime? TargetDate { get; set; }
        public decimal SuggestedMonthlyDeposit { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreatePiggyBankRequest
    {
        public string Name { get; set; } = string.Empty;
        public Guid AccountId { get; set; }
        public decimal TargetAmount { get; set; }
        public decimal CurrentAmount { get; set; } = 0;
        public DateTime? TargetDate { get; set; }
        public string? Notes { get; set; }
    }

    public class PiggyBankEventRequest
    {
        public string Action { get; set; } = "Deposit"; // Deposit, Withdraw
        public decimal Amount { get; set; }
        public string? Notes { get; set; }
    }

    // --- MODULE 09: STATISTICS ---
    public class FinancialSummaryDto
    {
        public string Currency { get; set; } = "VND";
        public PeriodDto Period { get; set; } = new();
        public KpiDto Kpi { get; set; } = new();
        public List<CategoryBreakdownDto> CategoryBreakdown { get; set; } = new();
    }

    public class PeriodDto
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
    }

    public class KpiDto
    {
        public decimal TotalIncome { get; set; }
        public decimal TotalExpense { get; set; }
        public decimal NetCashflow { get; set; }
        public decimal CurrentNetWorth { get; set; }
    }

    public class CashflowTrendDto
    {
        public string Date { get; set; } = string.Empty;
        public decimal Income { get; set; }
        public decimal Expense { get; set; }
        public decimal Net { get; set; }
    }

    public class CategoryBreakdownDto
    {
        public Guid CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public decimal Percentage { get; set; }
    }
}
