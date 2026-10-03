using System.Threading;
using System.Threading.Tasks;
using FinancialManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace FinancialManager.Application.Interfaces
{
    public interface IApplicationDbContext
    {
        DbSet<User> Users { get; }
        DbSet<Role> Roles { get; }
        DbSet<UserRole> UserRoles { get; }
        DbSet<PersonalAccessToken> PersonalAccessTokens { get; }
        DbSet<Currency> Currencies { get; }
        DbSet<CurrencyExchangeRate> CurrencyExchangeRates { get; }
        DbSet<AccountType> AccountTypes { get; }
        DbSet<Account> Accounts { get; }
        DbSet<AccountMeta> AccountMetas { get; }
        DbSet<Category> Categories { get; }
        DbSet<Tag> Tags { get; }
        DbSet<Taggable> Taggables { get; }
        DbSet<TransactionJournal> TransactionJournals { get; }
        DbSet<Transaction> Transactions { get; }
        DbSet<JournalMeta> JournalMetas { get; }
        DbSet<Budget> Budgets { get; }
        DbSet<BudgetLimit> BudgetLimits { get; }
        DbSet<Bill> Bills { get; }
        DbSet<Recurrence> Recurrences { get; }
        DbSet<PiggyBank> PiggyBanks { get; }
        DbSet<PiggyBankEvent> PiggyBankEvents { get; }
        DbSet<SyncHistory> SyncHistories { get; }

        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
        Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default);
    }
}
