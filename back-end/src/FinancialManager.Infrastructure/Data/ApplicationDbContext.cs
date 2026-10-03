using System;
using System.Threading;
using System.Threading.Tasks;
using FinancialManager.Application.Interfaces;
using FinancialManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace FinancialManager.Infrastructure.Data
{
    public class ApplicationDbContext : DbContext, IApplicationDbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<Role> Roles => Set<Role>();
        public DbSet<UserRole> UserRoles => Set<UserRole>();
        public DbSet<PersonalAccessToken> PersonalAccessTokens => Set<PersonalAccessToken>();
        public DbSet<Currency> Currencies => Set<Currency>();
        public DbSet<CurrencyExchangeRate> CurrencyExchangeRates => Set<CurrencyExchangeRate>();
        public DbSet<AccountType> AccountTypes => Set<AccountType>();
        public DbSet<Account> Accounts => Set<Account>();
        public DbSet<AccountMeta> AccountMetas => Set<AccountMeta>();
        public DbSet<Category> Categories => Set<Category>();
        public DbSet<Tag> Tags => Set<Tag>();
        public DbSet<Taggable> Taggables => Set<Taggable>();
        public DbSet<TransactionJournal> TransactionJournals => Set<TransactionJournal>();
        public DbSet<Transaction> Transactions => Set<Transaction>();
        public DbSet<JournalMeta> JournalMetas => Set<JournalMeta>();
        public DbSet<Budget> Budgets => Set<Budget>();
        public DbSet<BudgetLimit> BudgetLimits => Set<BudgetLimit>();
        public DbSet<Bill> Bills => Set<Bill>();
        public DbSet<Recurrence> Recurrences => Set<Recurrence>();
        public DbSet<PiggyBank> PiggyBanks => Set<PiggyBank>();
        public DbSet<PiggyBankEvent> PiggyBankEvents => Set<PiggyBankEvent>();
        public DbSet<SyncHistory> SyncHistories => Set<SyncHistory>();

        public async Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default)
        {
            if (Database.ProviderName == "Microsoft.EntityFrameworkCore.InMemory")
            {
                return new NullDbContextTransaction();
            }
            return await Database.BeginTransactionAsync(cancellationToken);
        }

        // Npgsql only accepts UTC for timestamptz; dates from the client (e.g. "2026-07-10") arrive as Unspecified
        protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
        {
            configurationBuilder.Properties<DateTime>().HaveConversion<UtcDateTimeConverter>();
            configurationBuilder.Properties<DateTime?>().HaveConversion<UtcDateTimeConverter>();
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // UserRole Composite Key
            modelBuilder.Entity<UserRole>()
                .HasKey(ur => new { ur.UserId, ur.RoleId });

            // Currency Exchange Rates precision
            modelBuilder.Entity<CurrencyExchangeRate>()
                .Property(r => r.Rate)
                .HasPrecision(18, 6);

            // Transaction precision
            modelBuilder.Entity<Transaction>()
                .Property(t => t.Amount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<BudgetLimit>()
                .Property(b => b.Amount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Bill>()
                .Property(b => b.AmountMin)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Bill>()
                .Property(b => b.AmountMax)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Recurrence>()
                .Property(r => r.Amount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<PiggyBank>()
                .Property(p => p.TargetAmount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<PiggyBank>()
                .Property(p => p.CurrentAmount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<PiggyBankEvent>()
                .Property(p => p.Amount)
                .HasPrecision(18, 2);

            // Self-referencing Category Parent-Child
            modelBuilder.Entity<Category>()
                .HasOne(c => c.Parent)
                .WithMany(c => c.SubCategories)
                .HasForeignKey(c => c.ParentId)
                .OnDelete(DeleteBehavior.Restrict);

            // Account & AccountType
            modelBuilder.Entity<Account>()
                .HasOne(a => a.AccountType)
                .WithMany()
                .HasForeignKey(a => a.AccountTypeId);

            // TransactionJournal & Transactions
            modelBuilder.Entity<Transaction>()
                .HasOne(t => t.TransactionJournal)
                .WithMany(j => j.Transactions)
                .HasForeignKey(t => t.TransactionJournalId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Transaction>()
                .HasOne(t => t.Account)
                .WithMany(a => a.Transactions)
                .HasForeignKey(t => t.AccountId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }

    public class UtcDateTimeConverter : ValueConverter<DateTime, DateTime>
    {
        public UtcDateTimeConverter() : base(
            v => v.Kind == DateTimeKind.Utc ? v : v.Kind == DateTimeKind.Local ? v.ToUniversalTime() : DateTime.SpecifyKind(v, DateTimeKind.Utc),
            v => DateTime.SpecifyKind(v, DateTimeKind.Utc))
        { }
    }

    public class NullDbContextTransaction : IDbContextTransaction
    {
        public Guid TransactionId => Guid.NewGuid();
        public void Commit() { }
        public Task CommitAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
        public void Rollback() { }
        public Task RollbackAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
        public void Dispose() { }
        public ValueTask DisposeAsync() => ValueTask.CompletedTask;
    }
}
