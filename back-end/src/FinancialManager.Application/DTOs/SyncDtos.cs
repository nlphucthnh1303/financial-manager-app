using System;
using System.Collections.Generic;

namespace FinancialManager.Application.DTOs
{
    public class SyncStatusDto
    {
        public bool DeviceConnected { get; set; }
        public string? DeviceId { get; set; }
        public string? DeviceName { get; set; }
        public DateTime? LastSyncTime { get; set; }
        public int TotalSyncedCount { get; set; }
    }

    public class SyncPushRequest
    {
        public string DeviceId { get; set; } = string.Empty;
        public string DeviceName { get; set; } = string.Empty;
        public List<SyncTransactionItem> Transactions { get; set; } = new();
    }

    public class SyncTransactionItem
    {
        public string ClientId { get; set; } = string.Empty;
        public string TransactionType { get; set; } = "Withdrawal"; // Withdrawal, Deposit, Transfer
        public decimal Amount { get; set; }
        public string CurrencyCode { get; set; } = "VND";
        public string Description { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string SourceAccountName { get; set; } = string.Empty;
        public string? DestinationAccountName { get; set; }
        public string? CategoryName { get; set; }
        public string? Notes { get; set; }
        public string? SyncAction { get; set; } // create, update, delete
        public Guid? ServerId { get; set; }
    }

    public class SyncMappingItem
    {
        public string ClientId { get; set; } = string.Empty;
        public Guid ServerId { get; set; }
        public string Status { get; set; } = "synced"; // synced, deleted, error
        public string? Error { get; set; }
    }

    public class SyncPushResult
    {
        public bool Success { get; set; }
        public int ImportedCount { get; set; }
        public List<SyncMappingItem> Mapping { get; set; } = new();
        public string Message { get; set; } = string.Empty;
    }

    public class SyncPullResult
    {
        public List<AccountDto> Accounts { get; set; } = new();
        public List<CategoryDto> Categories { get; set; } = new();
        public List<TransactionJournalDto> RecentTransactions { get; set; } = new();
        public DateTime ServerTime { get; set; } = DateTime.UtcNow;
    }

    public class SyncHistoryDto
    {
        public Guid Id { get; set; }
        public string DeviceId { get; set; } = string.Empty;
        public string DeviceName { get; set; } = string.Empty;
        public DateTime SyncTime { get; set; }
        public int UploadedCount { get; set; }
        public int DownloadedCount { get; set; }
        public string Status { get; set; } = "SUCCESS";
        public string? ErrorMessage { get; set; }
        public long DurationMs { get; set; }
    }
}
