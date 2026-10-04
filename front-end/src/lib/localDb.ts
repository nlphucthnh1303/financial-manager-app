/**
 * Financial Manager - Local Database Engine (IndexedDB v2.0)
 * Hỗ trợ lưu trữ ngoại tuyến (Offline-First) toàn diện:
 * - Giao dịch (Transactions CRUD & Balance Auto-Recalculation)
 * - Tài khoản & Thẻ ngân hàng (Accounts CRUD)
 * - Danh mục & Thẻ tag (Categories & Tags CRUD)
 * - Ngân sách (Budgets CRUD)
 * - Heo đất tiết kiệm (Piggy Banks CRUD & Events)
 * - Lịch sử đồng bộ cáp USB (Sync Logs)
 */

export interface LocalTransaction {
  id: string; // UUID / client ID
  serverId?: string | null; // ID trên CSDL PostgreSQL
  transactionType: 'Withdrawal' | 'Deposit' | 'Transfer';
  amount: number;
  currencyCode: string;
  description: string;
  date: string; // ISO 8601 string
  sourceAccountId: string;
  sourceAccountName?: string;
  destinationAccountId?: string | null;
  destinationAccountName?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  budgetId?: string | null;
  notes?: string | null;
  isSynced: boolean; // false nếu tạo offline, true nếu đã đồng bộ lên PC
  syncAction?: 'create' | 'update' | 'delete' | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocalAccount {
  id: string;
  name: string;
  accountType: 'Asset' | 'Expense' | 'Revenue';
  currentBalance: number;
  currencyCode: string;
  accountRole?: string;
  active: boolean;
  isLocalOnly?: boolean;
  includeInNetWorth?: boolean;
  metadata?: {
    bank_name?: string;
    account_number?: string;
    bank_code?: string;
    color?: string;
    icon?: string;
  };
}

export interface LocalCategory {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  parentId?: string | null;
  type?: 'Expense' | 'Revenue';
  isLocalOnly?: boolean;
}

export interface LocalTag {
  id: string;
  tag: string;
  description?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  transactionCount?: number;
}

export interface LocalBudget {
  id: string;
  name: string;
  amount: number;
  spent?: number;
  period: 'Monthly' | 'Weekly' | 'Custom';
  categoryId?: string | null;
  categoryName?: string | null;
  active: boolean;
}

export interface LocalBill {
  id: string;
  name: string;
  amountMin: number;
  amountMax: number;
  repeatFrequency: string;
  date: string;
  nextDueDate?: string;
  active: boolean;
  isPaidThisPeriod?: boolean;
}

export interface LocalCurrency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  enabled: boolean;
}

export interface LocalPiggyBank {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string | null;
  accountId?: string | null;
  notes?: string | null;
}

export interface LocalSyncLog {
  id: string;
  timestamp: string;
  uploadedCount: number;
  downloadedCount: number;
  status: 'SUCCESS' | 'FAILED';
  message: string;
  deviceId?: string;
}

const DB_NAME = 'financial_manager_offline_v2';
const DB_VERSION = 3;

// Starter accounts for fresh offline use
const DEFAULT_ACCOUNTS: LocalAccount[] = [
  {
    id: 'local-acc-cash',
    name: 'Ví tiền mặt',
    accountType: 'Asset',
    currentBalance: 0,
    currencyCode: 'VND',
    accountRole: 'cashWalletAsset',
    active: true,
    includeInNetWorth: true,
    isLocalOnly: true,
    metadata: { bank_name: 'Tiền mặt', icon: 'Wallet', color: '#059669' }
  },
  {
    id: 'local-acc-vcb',
    name: 'Vietcombank Digibank',
    accountType: 'Asset',
    currentBalance: 0,
    currencyCode: 'VND',
    accountRole: 'defaultAsset',
    active: true,
    includeInNetWorth: true,
    isLocalOnly: true,
    metadata: { bank_name: 'Vietcombank', bank_code: 'VCB', icon: 'Landmark', color: '#005a3c' }
  },
  {
    id: 'local-acc-momo',
    name: 'Ví điện tử MoMo',
    accountType: 'Asset',
    currentBalance: 0,
    currencyCode: 'VND',
    accountRole: 'defaultAsset',
    active: true,
    includeInNetWorth: true,
    isLocalOnly: true,
    metadata: { bank_name: 'Ví MoMo', bank_code: 'MOMO', icon: 'Smartphone', color: '#a50064' }
  }
];

// Starter categories for fresh offline use
const DEFAULT_CATEGORIES: LocalCategory[] = [
  { id: 'local-cat-food', name: 'Ăn uống & Cà phê', color: '#ff5b4f', icon: 'Utensils', type: 'Expense', isLocalOnly: true },
  { id: 'local-cat-transport', name: 'Đi lại & Xăng xe', color: '#0070f3', icon: 'Car', type: 'Expense', isLocalOnly: true },
  { id: 'local-cat-shopping', name: 'Mua sắm & Sinh hoạt', color: '#7928ca', icon: 'ShoppingBag', type: 'Expense', isLocalOnly: true },
  { id: 'local-cat-housing', name: 'Nhà cửa & Hóa đơn', color: '#f5a623', icon: 'Home', type: 'Expense', isLocalOnly: true },
  { id: 'local-cat-salary', name: 'Lương & Thưởng', color: '#10b981', icon: 'DollarSign', type: 'Revenue', isLocalOnly: true },
  { id: 'local-cat-investment', name: 'Đầu tư & Tiết kiệm', color: '#00df8f', icon: 'TrendingUp', type: 'Revenue', isLocalOnly: true },
];

export const DEFAULT_CURRENCIES: LocalCurrency[] = [
  { id: 'curr-vnd', code: 'VND', name: 'Việt Nam Đồng', symbol: '₫', decimalPlaces: 0, enabled: true },
  { id: 'curr-usd', code: 'USD', name: 'Đô la Mỹ', symbol: '$', decimalPlaces: 2, enabled: true },
  { id: 'curr-eur', code: 'EUR', name: 'Đồng Euro', symbol: '€', decimalPlaces: 2, enabled: true },
  { id: 'curr-jpy', code: 'JPY', name: 'Yên Nhật', symbol: '¥', decimalPlaces: 0, enabled: true },
  { id: 'curr-gbp', code: 'GBP', name: 'Bảng Anh', symbol: '£', decimalPlaces: 2, enabled: true },
  { id: 'curr-krw', code: 'KRW', name: 'Won Hàn Quốc', symbol: '₩', decimalPlaces: 0, enabled: true },
  { id: 'curr-cny', code: 'CNY', name: 'Nhân dân tệ', symbol: '¥', decimalPlaces: 2, enabled: true }
];

class LocalDatabaseManager {
  private dbPromise: Promise<IDBDatabase> | null = null;

  public async openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB không được hỗ trợ trên thiết bị này.'));
        return;
      }

      const req = window.indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;

        // Store: transactions
        if (!db.objectStoreNames.contains('transactions')) {
          const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
          txStore.createIndex('isSynced', 'isSynced', { unique: false });
          txStore.createIndex('date', 'date', { unique: false });
          txStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Store: accounts
        if (!db.objectStoreNames.contains('accounts')) {
          db.createObjectStore('accounts', { keyPath: 'id' });
        }

        // Store: categories
        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'id' });
        }

        // Store: tags
        if (!db.objectStoreNames.contains('tags')) {
          db.createObjectStore('tags', { keyPath: 'id' });
        }

        // Store: budgets
        if (!db.objectStoreNames.contains('budgets')) {
          db.createObjectStore('budgets', { keyPath: 'id' });
        }

        // Store: bills
        if (!db.objectStoreNames.contains('bills')) {
          db.createObjectStore('bills', { keyPath: 'id' });
        }

        // Store: piggy_banks
        if (!db.objectStoreNames.contains('piggy_banks')) {
          db.createObjectStore('piggy_banks', { keyPath: 'id' });
        }

        // Store: sync_logs
        if (!db.objectStoreNames.contains('sync_logs')) {
          const logStore = db.createObjectStore('sync_logs', { keyPath: 'id' });
          logStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      req.onsuccess = async () => {
        const db = req.result;
        await this.ensureSeedData(db);
        resolve(db);
      };

      req.onerror = () => {
        reject(req.error || new Error('Không thể khởi tạo IndexedDB.'));
      };
    });

    return this.dbPromise;
  }

  private async ensureSeedData(db: IDBDatabase): Promise<void> {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(['accounts', 'categories'], 'readwrite');
        const accStore = tx.objectStore('accounts');
        const countReq = accStore.count();
        countReq.onsuccess = () => {
          if (countReq.result === 0) {
            DEFAULT_ACCOUNTS.forEach((a) => accStore.put(a));
          }
        };

        const catStore = tx.objectStore('categories');
        const catCountReq = catStore.count();
        catCountReq.onsuccess = () => {
          if (catCountReq.result === 0) {
            DEFAULT_CATEGORIES.forEach((c) => catStore.put(c));
          }
        };

        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  // --------------------------------------------------------------------------
  // TRANSACTIONS CRUD
  // --------------------------------------------------------------------------

  public async getTransactions(options?: {
    startDate?: string;
    endDate?: string;
    type?: string;
  }): Promise<LocalTransaction[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('transactions', 'readonly');
      const store = tx.objectStore('transactions');
      const req = store.getAll();

      req.onsuccess = () => {
        let list: LocalTransaction[] = req.result || [];
        list = list.filter((t) => t.syncAction !== 'delete');

        if (options?.type && options.type !== 'all') {
          list = list.filter((t) => t.transactionType.toLowerCase() === options.type!.toLowerCase());
        }

        if (options?.startDate) {
          const s = new Date(options.startDate).getTime();
          list = list.filter((t) => new Date(t.date).getTime() >= s);
        }

        if (options?.endDate) {
          const e = new Date(options.endDate).getTime();
          list = list.filter((t) => new Date(t.date).getTime() <= e);
        }

        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        resolve(list);
      };

      req.onerror = () => reject(req.error);
    });
  }

  public async addTransaction(txData: Omit<LocalTransaction, 'id' | 'isSynced' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<LocalTransaction> {
    const db = await this.openDB();
    const now = new Date().toISOString();
    const item: LocalTransaction = {
      ...txData,
      id: txData.id || `loc-tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      isSynced: false,
      syncAction: 'create',
      createdAt: now,
      updatedAt: now,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(['transactions', 'accounts'], 'readwrite');
      const store = tx.objectStore('transactions');
      const accStore = tx.objectStore('accounts');

      store.put(item);

      // Adjust Account Balance
      if (item.sourceAccountId) {
        const getSrc = accStore.get(item.sourceAccountId);
        getSrc.onsuccess = () => {
          const srcAcc = getSrc.result as LocalAccount | undefined;
          if (srcAcc) {
            if (item.transactionType === 'Withdrawal' || item.transactionType === 'Transfer') {
              srcAcc.currentBalance = (srcAcc.currentBalance || 0) - item.amount;
            } else if (item.transactionType === 'Deposit') {
              srcAcc.currentBalance = (srcAcc.currentBalance || 0) + item.amount;
            }
            accStore.put(srcAcc);
          }
        };
      }

      if (item.transactionType === 'Transfer' && item.destinationAccountId) {
        const getDest = accStore.get(item.destinationAccountId);
        getDest.onsuccess = () => {
          const destAcc = getDest.result as LocalAccount | undefined;
          if (destAcc) {
            destAcc.currentBalance = (destAcc.currentBalance || 0) + item.amount;
            accStore.put(destAcc);
          }
        };
      }

      tx.oncomplete = () => resolve(item);
      tx.onerror = () => reject(tx.error);
    });
  }

  public async updateTransaction(id: string, updates: Partial<LocalTransaction>): Promise<LocalTransaction | null> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('transactions', 'readwrite');
      const store = tx.objectStore('transactions');
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const existing = getReq.result as LocalTransaction | undefined;
        if (!existing) {
          resolve(null);
          return;
        }

        const now = new Date().toISOString();
        const updated: LocalTransaction = {
          ...existing,
          ...updates,
          id: existing.id,
          isSynced: false,
          syncAction: existing.syncAction === 'create' ? 'create' : 'update',
          updatedAt: now,
        };

        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve(updated);
        putReq.onerror = () => reject(putReq.error);
      };

      getReq.onerror = () => reject(getReq.error);
    });
  }

  public async deleteTransaction(id: string): Promise<boolean> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['transactions', 'accounts'], 'readwrite');
      const store = tx.objectStore('transactions');
      const accStore = tx.objectStore('accounts');
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const existing = getReq.result as LocalTransaction | undefined;
        if (!existing) {
          resolve(false);
          return;
        }

        // Reverse Account Balance Adjustment
        if (existing.sourceAccountId) {
          const getSrc = accStore.get(existing.sourceAccountId);
          getSrc.onsuccess = () => {
            const srcAcc = getSrc.result as LocalAccount | undefined;
            if (srcAcc) {
              if (existing.transactionType === 'Withdrawal' || existing.transactionType === 'Transfer') {
                srcAcc.currentBalance = (srcAcc.currentBalance || 0) + existing.amount;
              } else if (existing.transactionType === 'Deposit') {
                srcAcc.currentBalance = (srcAcc.currentBalance || 0) - existing.amount;
              }
              accStore.put(srcAcc);
            }
          };
        }

        if (existing.transactionType === 'Transfer' && existing.destinationAccountId) {
          const getDest = accStore.get(existing.destinationAccountId);
          getDest.onsuccess = () => {
            const destAcc = getDest.result as LocalAccount | undefined;
            if (destAcc) {
              destAcc.currentBalance = (destAcc.currentBalance || 0) - existing.amount;
              accStore.put(destAcc);
            }
          };
        }

        if (!existing.serverId) {
          store.delete(id);
        } else {
          existing.syncAction = 'delete';
          existing.isSynced = false;
          existing.updatedAt = new Date().toISOString();
          store.put(existing);
        }
      };

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  // --------------------------------------------------------------------------
  // ACCOUNTS CRUD
  // --------------------------------------------------------------------------

  public async getAccounts(): Promise<LocalAccount[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('accounts', 'readonly');
      const store = tx.objectStore('accounts');
      const req = store.getAll();

      req.onsuccess = () => {
        const list = req.result || [];
        resolve(list.length > 0 ? list : DEFAULT_ACCOUNTS);
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async saveAccounts(accounts: LocalAccount[]): Promise<void> {
    if (!accounts || accounts.length === 0) return;
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('accounts', 'readwrite');
      const store = tx.objectStore('accounts');
      accounts.forEach((a) => store.put(a));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  public async addAccount(acc: Partial<LocalAccount>): Promise<LocalAccount> {
    const db = await this.openDB();
    const item: LocalAccount = {
      id: acc.id || `loc-acc-${Date.now()}`,
      name: acc.name || 'Tài khoản mới',
      accountType: acc.accountType || 'Asset',
      currentBalance: acc.currentBalance || 0,
      currencyCode: acc.currencyCode || 'VND',
      active: acc.active !== false,
      includeInNetWorth: acc.includeInNetWorth !== false,
      isLocalOnly: true,
      metadata: acc.metadata || {}
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('accounts', 'readwrite');
      const store = tx.objectStore('accounts');
      const req = store.put(item);
      req.onsuccess = () => resolve(item);
      req.onerror = () => reject(req.error);
    });
  }

  public async updateAccount(id: string, updates: Partial<LocalAccount>): Promise<LocalAccount | null> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('accounts', 'readwrite');
      const store = tx.objectStore('accounts');
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const existing = getReq.result as LocalAccount | undefined;
        if (!existing) {
          resolve(null);
          return;
        }
        const updated = { ...existing, ...updates, id };
        store.put(updated);
        resolve(updated);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  public async deleteAccount(id: string): Promise<boolean> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('accounts', 'readwrite');
      const store = tx.objectStore('accounts');
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  // --------------------------------------------------------------------------
  // CATEGORIES & TAGS CRUD
  // --------------------------------------------------------------------------

  public async getCategories(): Promise<LocalCategory[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('categories', 'readonly');
      const store = tx.objectStore('categories');
      const req = store.getAll();

      req.onsuccess = () => {
        const list = req.result || [];
        resolve(list.length > 0 ? list : DEFAULT_CATEGORIES);
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async saveCategories(categories: LocalCategory[]): Promise<void> {
    if (!categories || categories.length === 0) return;
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('categories', 'readwrite');
      const store = tx.objectStore('categories');
      categories.forEach((c) => store.put(c));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  public async addCategory(cat: Partial<LocalCategory>): Promise<LocalCategory> {
    const db = await this.openDB();
    const item: LocalCategory = {
      id: cat.id || `loc-cat-${Date.now()}`,
      name: cat.name || 'Danh mục mới',
      color: cat.color || '#171717',
      icon: cat.icon || 'Utensils',
      parentId: cat.parentId || null,
      type: cat.type || 'Expense',
      isLocalOnly: true
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('categories', 'readwrite');
      const store = tx.objectStore('categories');
      const req = store.put(item);
      req.onsuccess = () => resolve(item);
      req.onerror = () => reject(req.error);
    });
  }

  public async updateCategory(id: string, updates: Partial<LocalCategory>): Promise<LocalCategory | null> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('categories', 'readwrite');
      const store = tx.objectStore('categories');
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const existing = getReq.result as LocalCategory | undefined;
        if (!existing) {
          resolve(null);
          return;
        }
        const updated = { ...existing, ...updates, id };
        store.put(updated);
        resolve(updated);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  public async deleteCategory(id: string): Promise<boolean> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('categories', 'readwrite');
      const store = tx.objectStore('categories');
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  public async getTags(): Promise<LocalTag[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('tags', 'readonly');
      const store = tx.objectStore('tags');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  public async addTag(tag: Partial<LocalTag>): Promise<LocalTag> {
    const db = await this.openDB();
    const item: LocalTag = {
      id: tag.id || `loc-tag-${Date.now()}`,
      tag: tag.tag || 'tag',
      description: tag.description || null,
      dateFrom: tag.dateFrom || null,
      dateTo: tag.dateTo || null,
      transactionCount: 0
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('tags', 'readwrite');
      const store = tx.objectStore('tags');
      store.put(item);
      tx.oncomplete = () => resolve(item);
      tx.onerror = () => reject(tx.error);
    });
  }

  public async deleteTag(id: string): Promise<boolean> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('tags', 'readwrite');
      const store = tx.objectStore('tags');
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  // --------------------------------------------------------------------------
  // BUDGETS & BILLS CRUD & OFFLINE ENGINE
  // --------------------------------------------------------------------------

  public async getBudgets(): Promise<LocalBudget[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('budgets', 'readonly');
      const store = tx.objectStore('budgets');
      const req = store.getAll();
      req.onsuccess = () => {
        const list = req.result || [];
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async saveBudgets(budgets: LocalBudget[]): Promise<void> {
    if (!budgets || budgets.length === 0) return;
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('budgets', 'readwrite');
      const store = tx.objectStore('budgets');
      budgets.forEach((b) => store.put(b));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  public async addBudget(budget: Partial<LocalBudget>): Promise<LocalBudget> {
    const db = await this.openDB();
    const item: LocalBudget = {
      id: budget.id || `loc-bg-${Date.now()}`,
      name: budget.name || 'Ngân sách',
      amount: budget.amount || 0,
      period: budget.period || 'Monthly',
      categoryId: budget.categoryId || null,
      categoryName: budget.categoryName || null,
      active: true,
      spent: 0
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('budgets', 'readwrite');
      const store = tx.objectStore('budgets');
      store.put(item);
      tx.oncomplete = () => resolve(item);
      tx.onerror = () => reject(tx.error);
    });
  }

  public async deleteBudget(id: string): Promise<boolean> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('budgets', 'readwrite');
      const store = tx.objectStore('budgets');
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  public async getBudgetStatuses(startDate?: string, endDate?: string): Promise<any[]> {
    const [budgets, txs] = await Promise.all([
      this.getBudgets(),
      this.getTransactions({ startDate, endDate, type: 'Withdrawal' })
    ]);

    return budgets.map((b) => {
      let spent = 0;
      if (b.categoryId) {
        spent = txs
          .filter((t) => t.categoryId === b.categoryId && t.transactionType === 'Withdrawal')
          .reduce((sum, t) => sum + t.amount, 0);
      } else {
        spent = txs
          .filter((t) => t.budgetId === b.id && t.transactionType === 'Withdrawal')
          .reduce((sum, t) => sum + t.amount, 0);
      }

      const limit = b.amount || 1;
      const pct = (spent / limit) * 100;
      let status = 'WithinLimit';
      if (pct >= 100) status = 'Overspent';
      else if (pct >= 80) status = 'Warning';

      return {
        budgetId: b.id,
        budgetName: b.name,
        limitAmount: b.amount,
        spentAmount: spent,
        remainingAmount: b.amount - spent,
        percentageSpent: pct,
        status,
        startDate: startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
        endDate: endDate || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
      };
    });
  }

  // --------------------------------------------------------------------------
  // BILLS CRUD
  // --------------------------------------------------------------------------

  public async getBills(): Promise<LocalBill[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('bills', 'readonly');
      const store = tx.objectStore('bills');
      const req = store.getAll();
      req.onsuccess = () => {
        const list: LocalBill[] = req.result || [];
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async saveBills(bills: LocalBill[]): Promise<void> {
    if (!bills || bills.length === 0) return;
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('bills', 'readwrite');
      const store = tx.objectStore('bills');
      bills.forEach((b) => store.put(b));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  public async addBill(bill: Partial<LocalBill>): Promise<LocalBill> {
    const db = await this.openDB();
    const item: LocalBill = {
      id: bill.id || `loc-bill-${Date.now()}`,
      name: bill.name || 'Hóa đơn mới',
      amountMin: bill.amountMin || 0,
      amountMax: bill.amountMax || bill.amountMin || 0,
      repeatFrequency: bill.repeatFrequency || 'Monthly',
      date: bill.date || new Date().toISOString().slice(0, 10),
      nextDueDate: bill.date || new Date().toISOString().slice(0, 10),
      active: bill.active !== false,
      isPaidThisPeriod: false
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('bills', 'readwrite');
      const store = tx.objectStore('bills');
      store.put(item);
      tx.oncomplete = () => resolve(item);
      tx.onerror = () => reject(tx.error);
    });
  }

  public async deleteBill(id: string): Promise<boolean> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('bills', 'readwrite');
      const store = tx.objectStore('bills');
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  // --------------------------------------------------------------------------
  // PIGGY BANKS CRUD
  // --------------------------------------------------------------------------

  public async getPiggyBanks(): Promise<LocalPiggyBank[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('piggy_banks', 'readonly');
      const store = tx.objectStore('piggy_banks');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  public async addPiggyBank(piggy: Partial<LocalPiggyBank>): Promise<LocalPiggyBank> {
    const db = await this.openDB();
    const item: LocalPiggyBank = {
      id: piggy.id || `loc-pg-${Date.now()}`,
      name: piggy.name || 'Mục tiêu tiết kiệm',
      targetAmount: piggy.targetAmount || 0,
      currentAmount: piggy.currentAmount || 0,
      targetDate: piggy.targetDate || null,
      accountId: piggy.accountId || null,
      notes: piggy.notes || null
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('piggy_banks', 'readwrite');
      const store = tx.objectStore('piggy_banks');
      store.put(item);
      tx.oncomplete = () => resolve(item);
      tx.onerror = () => reject(tx.error);
    });
  }

  public async updatePiggyAmount(id: string, delta: number): Promise<LocalPiggyBank | null> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('piggy_banks', 'readwrite');
      const store = tx.objectStore('piggy_banks');
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const item = getReq.result as LocalPiggyBank | undefined;
        if (!item) {
          resolve(null);
          return;
        }
        item.currentAmount = Math.max(0, (item.currentAmount || 0) + delta);
        store.put(item);
        resolve(item);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  public async deletePiggyBank(id: string): Promise<boolean> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('piggy_banks', 'readwrite');
      const store = tx.objectStore('piggy_banks');
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  // --------------------------------------------------------------------------
  // CURRENCIES
  // --------------------------------------------------------------------------

  public async getCurrencies(): Promise<LocalCurrency[]> {
    return DEFAULT_CURRENCIES;
  }

  // --------------------------------------------------------------------------
  // SYNC QUEUE MANAGEMENT
  // --------------------------------------------------------------------------

  public async getPendingSyncTransactions(): Promise<LocalTransaction[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('transactions', 'readonly');
      const store = tx.objectStore('transactions');
      const req = store.getAll();

      req.onsuccess = () => {
        const list: LocalTransaction[] = req.result || [];
        const pending = list.filter((t) => t.isSynced === false);
        resolve(pending);
      };

      req.onerror = () => reject(req.error);
    });
  }

  public async getPendingCount(): Promise<number> {
    const pending = await this.getPendingSyncTransactions();
    return pending.length;
  }

  public async markTransactionsAsSynced(
    results: { clientId: string; serverId: string; status: 'synced' | 'deleted' }[]
  ): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('transactions', 'readwrite');
      const store = tx.objectStore('transactions');

      for (const res of results) {
        if (res.status === 'deleted') {
          store.delete(res.clientId);
        } else {
          const getReq = store.get(res.clientId);
          getReq.onsuccess = () => {
            const item = getReq.result as LocalTransaction | undefined;
            if (item) {
              item.isSynced = true;
              item.serverId = res.serverId;
              item.syncAction = null;
              store.put(item);
            }
          };
        }
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --------------------------------------------------------------------------
  // SYNC LOGS
  // --------------------------------------------------------------------------

  public async addSyncLog(log: Omit<LocalSyncLog, 'id' | 'timestamp'>): Promise<LocalSyncLog> {
    const db = await this.openDB();
    const item: LocalSyncLog = {
      ...log,
      id: `sync-log-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_logs', 'readwrite');
      const store = tx.objectStore('sync_logs');
      const req = store.put(item);
      req.onsuccess = () => resolve(item);
      req.onerror = () => reject(req.error);
    });
  }

  public async getSyncLogs(): Promise<LocalSyncLog[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_logs', 'readonly');
      const store = tx.objectStore('sync_logs');
      const req = store.getAll();
      req.onsuccess = () => {
        const list: LocalSyncLog[] = req.result || [];
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  }

  // --------------------------------------------------------------------------
  // OFFLINE STATISTICS & TREND CALCULATOR
  // --------------------------------------------------------------------------

  public async computeOfflineStats(startDate?: string, endDate?: string): Promise<{
    income: number;
    expense: number;
    net: number;
    savingsRate: number;
    count: number;
  }> {
    const list = await this.getTransactions({ startDate, endDate });
    let income = 0;
    let expense = 0;

    for (const t of list) {
      if (t.transactionType === 'Deposit') {
        income += t.amount;
      } else if (t.transactionType === 'Withdrawal') {
        expense += t.amount;
      }
    }

    const net = income - expense;
    const savingsRate = income > 0 ? Math.max(0, Math.round(((income - expense) / income) * 100)) : 0;

    return {
      income,
      expense,
      net,
      savingsRate,
      count: list.length,
    };
  }

  public async computeCategoryBreakdown(startDate?: string, endDate?: string): Promise<{
    categoryId: string;
    categoryName: string;
    amount: number;
    percentage: number;
    color: string;
  }[]> {
    const [txs, cats] = await Promise.all([
      this.getTransactions({ startDate, endDate, type: 'Withdrawal' }),
      this.getCategories()
    ]);

    const catMap = new Map<string, { name: string; color: string; amount: number }>();
    let totalExpense = 0;

    for (const t of txs) {
      if (t.transactionType !== 'Withdrawal') continue;
      const catId = t.categoryId || 'uncategorized';
      const catObj = cats.find((c) => c.id === catId);
      const name = t.categoryName || catObj?.name || 'Chưa phân loại';
      const color = catObj?.color || '#888888';

      const existing = catMap.get(catId) || { name, color, amount: 0 };
      existing.amount += t.amount;
      catMap.set(catId, existing);
      totalExpense += t.amount;
    }

    const result: any[] = [];
    catMap.forEach((val, id) => {
      result.push({
        categoryId: id,
        categoryName: val.name,
        amount: val.amount,
        percentage: totalExpense > 0 ? (val.amount / totalExpense) * 100 : 0,
        color: val.color
      });
    });

    return result.sort((a, b) => b.amount - a.amount);
  }

  public async computeCashflowTrend(startDate?: string, endDate?: string): Promise<{
    date: string;
    income: number;
    expense: number;
    net: number;
  }[]> {
    const list = await this.getTransactions({ startDate, endDate });
    const dayMap = new Map<string, { income: number; expense: number }>();

    for (const t of list) {
      const d = t.date ? t.date.slice(0, 10) : new Date().toISOString().slice(0, 10);
      const dayData = dayMap.get(d) || { income: 0, expense: 0 };
      if (t.transactionType === 'Deposit') {
        dayData.income += t.amount;
      } else if (t.transactionType === 'Withdrawal') {
        dayData.expense += t.amount;
      }
      dayMap.set(d, dayData);
    }

    const sortedDays = Array.from(dayMap.keys()).sort();
    return sortedDays.map((date) => {
      const data = dayMap.get(date)!;
      return {
        date: date.slice(5), // MM-DD
        income: data.income,
        expense: data.expense,
        net: data.income - data.expense
      };
    });
  }
}

export const localDb = new LocalDatabaseManager();
