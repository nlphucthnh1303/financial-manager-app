/**
 * Physical USB Cable Sync Engine (Mobile ↔ Desktop Central DB)
 * Điều phối đồng bộ 2 chiều qua kết nối cáp USB:
 * 1. Đẩy các giao dịch mới ghi nhận ngoại tuyến lên Central PostgreSQL DB
 * 2. Cập nhật snapshot số dư ví và danh mục mới nhất từ Central DB về Mobile
 * 3. Ghi log lịch sử đồng bộ trên cả thiết bị và máy tính
 */

import { api } from '@/lib/api';
import { localDb, type LocalTransaction } from '@/lib/localDb';
import { toast } from 'sonner';

export interface CableSyncResult {
  success: boolean;
  uploadedCount: number;
  downloadedCount: number;
  message: string;
  error?: string;
}

export async function performCableSync(options?: {
  silent?: boolean;
}): Promise<CableSyncResult> {
  try {
    // 1. Check if Desktop Central API is reachable
    const statusRes: any = await api.get('/sync/status').catch(() => null);
    if (!statusRes) {
      const msg = 'Không thể kết nối với máy tính qua cáp USB. Vui lòng kiểm tra dây cáp và máy chủ Desktop.';
      if (!options?.silent) toast.error(msg);
      return { success: false, uploadedCount: 0, downloadedCount: 0, message: msg };
    }

    // 2. Gather un-synced offline transactions from Local DB
    const pendingTransactions = await localDb.getPendingSyncTransactions();

    const pushPayload = {
      deviceId: statusRes.data?.deviceId || 'android-usb-device',
      deviceName: statusRes.data?.deviceName || 'Samsung Galaxy A03',
      transactions: pendingTransactions.map((t: LocalTransaction) => ({
        clientId: t.id,
        transactionType: t.transactionType,
        amount: t.amount,
        currencyCode: t.currencyCode || 'VND',
        description: t.description,
        date: t.date,
        sourceAccountName: t.sourceAccountName || 'Ví tiền mặt',
        destinationAccountName: t.destinationAccountName,
        categoryName: t.categoryName,
        notes: t.notes,
        syncAction: t.syncAction || 'create',
        serverId: t.serverId || null,
      })),
    };

    // 3. Push to Desktop Central DB
    let uploadedCount = 0;
    if (pendingTransactions.length > 0) {
      const pushRes: any = await api.post('/sync/push', pushPayload);
      const mapping = pushRes?.data?.mapping || [];

      // Mark as synced in local DB
      await localDb.markTransactionsAsSynced(mapping);
      uploadedCount = pushRes?.data?.importedCount || 0;
    }

    // 4. Pull latest snapshot from Desktop Central DB to ensure consistency
    const pullRes: any = await api.get('/sync/pull').catch(() => null);
    let downloadedCount = 0;

    if (pullRes?.data) {
      const serverAccounts = pullRes.data.accounts || [];
      const serverCategories = pullRes.data.categories || [];

      if (serverAccounts.length > 0) {
        await localDb.saveAccounts(
          serverAccounts.map((a: any) => ({
            id: a.id,
            name: a.name,
            accountType: a.accountType || 'Asset',
            currentBalance: a.currentBalance || 0,
            currencyCode: a.currencyCode || 'VND',
            active: true,
          }))
        );
        downloadedCount += serverAccounts.length;
      }

      if (serverCategories.length > 0) {
        await localDb.saveCategories(
          serverCategories.map((c: any) => ({
            id: c.id,
            name: c.name,
            color: c.color,
            icon: c.icon,
          }))
        );
      }
    }

    // 5. Log sync in Local DB
    const successMsg = `Đồng bộ thành công! Đã nạp ${uploadedCount} giao dịch lên máy tính, cập nhật dữ liệu mới nhất.`;
    await localDb.addSyncLog({
      uploadedCount,
      downloadedCount,
      status: 'SUCCESS',
      message: successMsg,
      deviceId: statusRes.data?.deviceId,
    });

    if (!options?.silent) {
      toast.success(successMsg);
    }

    return {
      success: true,
      uploadedCount,
      downloadedCount,
      message: successMsg,
    };
  } catch (err: any) {
    const errorMsg = err?.message || 'Lỗi trong quá trình đồng bộ cáp USB.';
    await localDb.addSyncLog({
      uploadedCount: 0,
      downloadedCount: 0,
      status: 'FAILED',
      message: errorMsg,
    });

    if (!options?.silent) {
      toast.error(errorMsg);
    }

    return {
      success: false,
      uploadedCount: 0,
      downloadedCount: 0,
      message: errorMsg,
      error: errorMsg,
    };
  }
}
