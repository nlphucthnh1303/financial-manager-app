/**
 * Vietnamese Debt & Loan Book Store (Sổ Quản lý Vay Nợ & Mượn Tiền)
 * Supports:
 * - Cho vay (Người khác nợ mình)
 * - Đi vay (Mình nợ người khác)
 * - Trả nợ từng đợt
 * - Tạo tin nhắn nhắc nợ lịch sự kèm VietQR
 */

export interface DebtPayment {
  id: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface DebtItem {
  id: string;
  type: 'lend' | 'borrow'; // lend: Tôi cho vay (Người khác nợ tôi), borrow: Tôi đi vay (Tôi nợ người khác)
  personName: string;
  phone?: string;
  bankName?: string;
  bankAccount?: string;
  originalAmount: number;
  paidAmount: number;
  interestRate?: number; // %/year (optional)
  startDate: string;
  dueDate?: string;
  description: string;
  status: 'pending' | 'partially_paid' | 'completed';
  payments: DebtPayment[];
  createdAt: string;
}

const STORAGE_KEY = 'pfm_vietnamese_debts_v1';

const INITIAL_DEMO_DEBTS: DebtItem[] = [
  {
    id: 'debt-01',
    type: 'lend',
    personName: 'Nguyễn Văn Tuấn (Bạn ĐH)',
    phone: '0912345678',
    bankName: 'Techcombank',
    bankAccount: '19034567890123',
    originalAmount: 5000000,
    paidAmount: 2000000,
    startDate: '2026-08-15',
    dueDate: '2026-10-15',
    description: 'Mượn tiền sửa xe và đóng tiền trọ',
    status: 'partially_paid',
    payments: [
      { id: 'pay-01', amount: 2000000, date: '2026-09-05', notes: 'Chuyển khoản đợt 1 qua Momo' }
    ],
    createdAt: '2026-08-15T10:00:00Z'
  },
  {
    id: 'debt-02',
    type: 'borrow',
    personName: 'Anh Minh (Đồng nghiệp)',
    phone: '0987654321',
    bankName: 'MB Bank',
    bankAccount: '0888999999',
    originalAmount: 12000000,
    paidAmount: 12000000,
    startDate: '2026-07-01',
    dueDate: '2026-08-01',
    description: 'Vay đặt cọc tiền nhà chung cư mới',
    status: 'completed',
    payments: [
      { id: 'pay-02', amount: 12000000, date: '2026-07-30', notes: 'Tất toán sau khi nhận thưởng' }
    ],
    createdAt: '2026-07-01T08:00:00Z'
  },
  {
    id: 'debt-03',
    type: 'lend',
    personName: 'Trần Thị Mai (Em họ)',
    phone: '0903112233',
    bankName: 'Vietcombank',
    bankAccount: '0071000999888',
    originalAmount: 3000000,
    paidAmount: 0,
    startDate: '2026-09-10',
    dueDate: '2026-10-25',
    description: 'Mượn đóng học phí tiếng Anh TOEIC',
    status: 'pending',
    payments: [],
    createdAt: '2026-09-10T14:30:00Z'
  }
];

export function getDebts(): DebtItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_DEBTS));
      return INITIAL_DEMO_DEBTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_DEBTS;
  }
}

export function saveDebts(debts: DebtItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(debts));
}

export function addDebt(debt: Omit<DebtItem, 'id' | 'paidAmount' | 'status' | 'payments' | 'createdAt'>): DebtItem {
  const all = getDebts();
  const newItem: DebtItem = {
    ...debt,
    id: `debt-${Date.now()}`,
    paidAmount: 0,
    status: 'pending',
    payments: [],
    createdAt: new Date().toISOString()
  };
  const updated = [newItem, ...all];
  saveDebts(updated);
  return newItem;
}

export function addPaymentToDebt(debtId: string, payment: { amount: number; date: string; notes?: string }): DebtItem | null {
  const all = getDebts();
  const index = all.findIndex(d => d.id === debtId);
  if (index === -1) return null;

  const debt = all[index];
  const newPayment: DebtPayment = {
    id: `pay-${Date.now()}`,
    amount: payment.amount,
    date: payment.date,
    notes: payment.notes
  };

  const newPaidAmount = debt.paidAmount + payment.amount;
  let newStatus: DebtItem['status'] = 'partially_paid';
  if (newPaidAmount >= debt.originalAmount) {
    newStatus = 'completed';
  } else if (newPaidAmount <= 0) {
    newStatus = 'pending';
  }

  const updatedDebt: DebtItem = {
    ...debt,
    paidAmount: newPaidAmount,
    status: newStatus,
    payments: [newPayment, ...debt.payments]
  };

  all[index] = updatedDebt;
  saveDebts(all);
  return updatedDebt;
}

export function deleteDebt(id: string) {
  const all = getDebts();
  const filtered = all.filter(d => d.id !== id);
  saveDebts(filtered);
}

export function updateDebt(id: string, updates: Partial<DebtItem>): DebtItem | null {
  const all = getDebts();
  const index = all.findIndex(d => d.id === id);
  if (index === -1) return null;

  const updated: DebtItem = { ...all[index], ...updates };
  if (updated.paidAmount >= updated.originalAmount) updated.status = 'completed';
  else if (updated.paidAmount > 0) updated.status = 'partially_paid';
  else updated.status = 'pending';

  all[index] = updated;
  saveDebts(all);
  return updated;
}

/**
 * Generate polite Vietnamese debt reminder message with payment details
 */
export function generatePoliteReminderMessage(debt: DebtItem, myBankInfo?: { bankName: string; accountNumber: string; accountName: string }): string {
  const remaining = Math.max(0, debt.originalAmount - debt.paidAmount);
  const formattedRemaining = remaining.toLocaleString('vi-VN') + ' đ';

  let msg = `Chào ${debt.personName},\n`;
  msg += `Mình nhắn để nhắc nhẹ khoản vay (${debt.description || 'khoản vay cá nhân'}) ngày ${debt.startDate}.\n`;
  msg += `Hiện số tiền còn lại là: ${formattedRemaining}.\n`;
  if (debt.dueDate) {
    msg += `Hạn thanh toán dự kiến là: ${debt.dueDate}.\n`;
  }
  if (myBankInfo && myBankInfo.accountNumber) {
    msg += `\nKhi nào tiện bạn chuyển khoản giúp mình vào STK:\n`;
    msg += `👉 ${myBankInfo.bankName}: ${myBankInfo.accountNumber} - ${myBankInfo.accountName}\n`;
  }
  msg += `\nCảm ơn bạn nhiều nhé! 😊`;
  return msg;
}
