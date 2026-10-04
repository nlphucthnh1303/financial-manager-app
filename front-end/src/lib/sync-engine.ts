/**
 * Physical USB Cable Sync Engine (Mobile ↔ Desktop Central DB)
 * Điều phối đồng bộ 2 chiều qua kết nối cáp USB:
 * 1. Đẩy các giao dịch mới ghi nhận ngoại tuyến lên Central PostgreSQL DB
 * 2. Cập nhật snapshot số dư ví và danh mục mới nhất từ Central DB về Mobile
 * 3. Ghi log lịch sử đồng bộ trên cả thiết bị và máy tính
 */

import axios from 'axios';
import { localDb, type LocalTransaction } from '@/lib/localDb';
import { toast } from 'sonner';

export interface CableSyncResult {
  success: boolean;
  uploadedCount: number;
  downloadedCount: number;
  message: string;
  error?: string;
}

const CANDIDATE_ENDPOINTS = [
  'http://localhost:5266/api/v1',
  'http://localhost:8080/api/v1',
  'http://127.0.0.1:5266/api/v1',
  'http://127.0.0.1:8080/api/v1',
];

async function getReachableSyncClient() {
  const token = localStorage.getItem('accessToken');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token && token !== 'offline-local-token') {
    headers['Authorization'] = `Bearer ${token}`;
  }

  for (const baseUrl of CANDIDATE_ENDPOINTS) {
    try {
      const client = axios.create({ baseURL: baseUrl, headers, timeout: 2500 });
      const res = await client.get('/sync/status');
      if (res.status === 200) {
        return { client, statusData: res.data?.data };
      }
    } catch {
      // try next
    }
  }
  return null;
}

export async function performCableSync(options?: {
  silent?: boolean;
}): Promise<CableSyncResult> {
  try {
    // 1. Check if Desktop Central API is reachable
    const connection = await getReachableSyncClient();
    if (!connection) {
      const msg = 'Không thể kết nối với máy tính qua cổng đồng bộ USB. Vui lòng đảm bảo đã cắm cáp USB và máy chủ Backend đang bật.';
      if (!options?.silent) toast.error(msg);
      return { success: false, uploadedCount: 0, downloadedCount: 0, message: msg };
    }

    const { client, statusData } = connection;

    // 2. Gather un-synced offline transactions from Local DB
    const pendingTransactions = await localDb.getPendingSyncTransactions();

    const pushPayload = {
      deviceId: statusData?.deviceId || 'android-usb-device',
      deviceName: statusData?.deviceName || 'Thiết bị Android',
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
      const pushRes: any = await client.post('/sync/push', pushPayload);
      const resData = pushRes?.data?.data || pushRes?.data;
      const mapping = resData?.mapping || [];

      // Mark as synced in local DB
      await localDb.markTransactionsAsSynced(mapping);
      uploadedCount = resData?.importedCount || pendingTransactions.length;
    }

    // 4. Pull latest snapshot from Desktop Central DB to ensure consistency
    const pullRes: any = await client.get('/sync/pull').catch(() => null);
    const pullData = pullRes?.data?.data || pullRes?.data;
    let downloadedCount = 0;

    if (pullData) {
      const serverAccounts = pullData.accounts || [];
      const serverCategories = pullData.categories || [];

      if (serverAccounts.length > 0) {
        await localDb.saveAccounts(
          serverAccounts.map((a: any) => ({
            id: a.id,
            name: a.name,
            accountType: a.accountType || 'Asset',
            currentBalance: a.currentBalance || 0,
            currencyCode: a.currency?.code || a.currencyCode || 'VND',
            active: true,
            includeInNetWorth: a.includeInNetWorth !== false,
            metadata: a.metadata || {}
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
            type: c.type,
            parentId: c.parentId
          }))
        );
      }
    }

    // 5. Log sync in Local DB
    const successMsg = `Đồng bộ thành công! Đã nạp ${uploadedCount} giao dịch lên máy tính, cập nhật ${downloadedCount} tài khoản.`;
    await localDb.addSyncLog({
      uploadedCount,
      downloadedCount,
      status: 'SUCCESS',
      message: successMsg,
      deviceId: statusData?.deviceId,
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
