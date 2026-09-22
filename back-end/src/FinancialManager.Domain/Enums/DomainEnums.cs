namespace FinancialManager.Domain.Enums
{
    public enum AccountTypeEnum
    {
        Asset = 1,
        Expense = 2,
        Revenue = 3,
        InitialBalance = 4,
        Reconciliation = 5,
        Loan = 6,
        Debt = 7
    }

    public enum TransactionTypeEnum
    {
        Withdrawal = 1,
        Deposit = 2,
        Transfer = 3,
        OpeningBalance = 4,
        Reconciliation = 5
    }

    public enum RecurrenceFrequencyEnum
    {
        Daily = 1,
        Weekly = 2,
        Monthly = 3,
        Quarterly = 4,
        Yearly = 5
    }

    public enum PiggyEventActionEnum
    {
        Deposit = 1,
        Withdraw = 2
    }
}
