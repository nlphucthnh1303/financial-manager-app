/**
 * Financial Manager - Local Database Engine (IndexedDB)
 * Hỗ trợ lưu trữ ngoại tuyến (Offline-First) cho ứng dụng Mobile & Web:
 * - Lưu trữ giao dịch ngoại tuyến khi ra ngoài không có kết nối máy tính
 * - Theo dõi trạng thái đồng bộ: isSynced, syncAction, updatedAt
 * - Snapshot danh mục & tài khoản cục bộ
 * - Ghi nhận nhật ký đồng bộ cáp USB (Local Sync Logs)
 */

export interface LocalTransaction {
  id: string; // UUID định danh client
  serverId?: string | null; // ID trên CSDL PostgreSQL máy tính
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
}

export interface LocalCategory {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  isLocalOnly?: boolean;
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

const DB_NAME = 'financial_manager_offline_v1';
const DB_VERSION = 1;

// Default starter accounts for offline use
const DEFAULT_ACCOUNTS: LocalAccount[] = [
  {
    id: 'local-acc-cash',
    name: 'Ví tiền mặt',
    accountType: 'Asset',
    currentBalance: 0,
    currencyCode: 'VND',
    accountRole: 'cashWalletAsset',
    active: true,
    isLocalOnly: true,
  },
  {
    id: 'local-acc-bank',
    name: 'Tài khoản Ngân hàng (Mặc định)',
    accountType: 'Asset',
    currentBalance: 0,
    currencyCode: 'VND',
    accountRole: 'defaultAsset',
    active: true,
    isLocalOnly: true,
  },
];

// Default starter categories for offline use
const DEFAULT_CATEGORIES: LocalCategory[] = [
  { id: 'local-cat-food', name: 'Ăn uống & Cà phê', color: '#ff5b4f', icon: 'Utensils', isLocalOnly: true },
  { id: 'local-cat-transport', name: 'Đi lại & Xăng xe', color: '#0070f3', icon: 'Car', isLocalOnly: true },
  { id: 'local-cat-shopping', name: 'Mua sắm & Sinh hoạt', color: '#7928ca', icon: 'ShoppingBag', isLocalOnly: true },
  { id: 'local-cat-bills', name: 'Hóa đơn & Tiện ích', color: '#f5a623', icon: 'Receipt', isLocalOnly: true },
  { id: 'local-cat-salary', name: 'Lương & Thưởng', color: '#00df8f', icon: 'DollarSign', isLocalOnly: true },
  { id: 'local-cat-investment', name: 'Đầu tư & Tiết kiệm', color: '#171717', icon: 'TrendingUp', isLocalOnly: true },
];

class LocalDatabaseManager {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB không được hỗ trợ trên môi trường này.'));
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

        // Store: sync_logs
        if (!db.objectStoreNames.contains('sync_logs')) {
          const logStore = db.createObjectStore('sync_logs', { keyPath: 'id' });
          logStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      req.onsuccess = async () => {
        const db = req.result;
        // Auto-seed defaults if needed
        await this.ensureSeedData(db);
        resolve(db);
      };

      req.onerror = () => {
        reject(req.error || new Error('Không thể mở IndexedDB.'));
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
        // Filter out soft-deleted
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

        // Sort descending by date
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
      const tx = db.transaction('transactions', 'readwrite');
      const store = tx.objectStore('transactions');
      const req = store.put(item);

      req.onsuccess = () => resolve(item);
      req.onerror = () => reject(req.error);
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
      const tx = db.transaction('transactions', 'readwrite');
      const store = tx.objectStore('transactions');
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const existing = getReq.result as LocalTransaction | undefined;
        if (!existing) {
          resolve(false);
          return;
        }

        // If never synced to server, just remove completely
        if (!existing.serverId) {
          const delReq = store.delete(id);
          delReq.onsuccess = () => resolve(true);
          delReq.onerror = () => reject(delReq.error);
        } else {
          // Soft delete to sync deletion to Desktop Central DB
          existing.syncAction = 'delete';
          existing.isSynced = false;
          existing.updatedAt = new Date().toISOString();
          const putReq = store.put(existing);
          putReq.onsuccess = () => resolve(true);
          putReq.onerror = () => reject(putReq.error);
        }
      };

      getReq.onerror = () => reject(getReq.error);
    });
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
  // ACCOUNTS & CATEGORIES CACHING
  // --------------------------------------------------------------------------

  public async getAccounts(): Promise<LocalAccount[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('accounts', 'readonly');
      const store = tx.objectStore('accounts');
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || DEFAULT_ACCOUNTS);
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

  public async getCategories(): Promise<LocalCategory[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('categories', 'readonly');
      const store = tx.objectStore('categories');
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || DEFAULT_CATEGORIES);
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
  // OFFLINE STATISTICS CALCULATOR
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
}

export const localDb = new LocalDatabaseManager();
