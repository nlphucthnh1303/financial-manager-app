import React, { useState, useEffect } from 'react';
import { 
  Cable, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Smartphone, 
  Database, 
  ArrowDownUp, 
  Clock, 
  AlertCircle,
  History,
  Layers
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { localDb } from '@/lib/localDb';
import { performCableSync } from '@/lib/sync-engine';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface DesktopSyncModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DesktopSyncModal: React.FC<DesktopSyncModalProps> = ({ open, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'history'>('sync');
  const [status, setStatus] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncStep, setSyncStep] = useState<number>(0);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const loadStatus = async () => {
    try {
      const res: any = await api.get('/sync/status').catch(() => null);
      const data = res?.data || (res?.success ? res : null);
      setStatus(data);

      const pending = await localDb.getPendingCount();
      setPendingCount(pending);

      const histRes: any = await api.get('/sync/history').catch(() => ({ data: [] }));
      setHistory(histRes?.data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!open) return;
    setSyncResult(null);
    setSyncStep(0);
    loadStatus();
  }, [open]);

  const handleStartSync = async () => {
    try {
      setSyncing(true);
      setSyncResult(null);
      setSyncStep(1); // Check connection

      // 1. Check & push transactions to Central DB
      setSyncStep(2);

      const result = await performCableSync({ silent: true });
      setSyncStep(3); // Pull latest snapshot

      if (result.success) {
        setSyncStep(4); // Complete
        setSyncResult(result.message);
        toast.success(result.message);
        await loadStatus();
        onSuccess?.();
      } else {
        toast.error(result.message);
        setSyncResult(`Lỗi: ${result.message}`);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Quá trình đồng bộ thất bại.');
    } finally {
      setSyncing(false);
    }
  };

  const isConnected = Boolean(status?.deviceConnected || (status && Object.keys(status).length > 0));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl w-full bg-[#ffffff] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#222222] p-6">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#171717]/5 dark:bg-[#ededed]/10 text-[#171717] dark:text-[#ededed]">
              <Cable className="w-3 h-3 text-[#0070f3]" />
              <span>Đồng bộ Cáp USB Vật lý (Local Cable Sync)</span>
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#10b981]' : 'bg-[#888888]'}`} />
              <span className={isConnected ? 'text-[#10b981] font-medium' : 'text-[#888888]'}>
                {isConnected ? 'Đã nhận cáp USB' : 'Chưa kết nối'}
              </span>
            </div>
          </div>
          <DialogTitle className="text-base font-semibold text-[#171717] dark:text-[#ededed] flex items-center gap-2 pt-1">
            <ArrowDownUp className="w-4 h-4 text-[#0070f3]" />
            <span>Đồng bộ Cơ sở dữ liệu Mobile ↔ Desktop</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-[#666666] dark:text-[#888888]">
            Đẩy toàn bộ giao dịch ghi nhận khi ra ngoài vào Database tổng trên máy tính và cập nhật số dư mới nhất xuống điện thoại.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Switcher */}
        <div className="flex gap-2 border-b border-[#e5e5e5] dark:border-[#222222] pt-2 pb-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className={`pb-2 px-1 inline-flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'sync'
                ? 'border-[#171717] dark:border-[#ededed] text-[#171717] dark:text-[#ededed]'
                : 'border-transparent text-[#888888]'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Đồng bộ thiết bị</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-2 px-1 inline-flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-[#171717] dark:border-[#ededed] text-[#171717] dark:text-[#ededed]'
                : 'border-transparent text-[#888888]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Lịch sử đồng bộ ({history.length})</span>
          </button>
        </div>

        {activeTab === 'sync' ? (
          <div className="space-y-4 py-2">
            {/* Device Info Card */}
            <div className="p-3.5 rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#222222] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-[#ffffff] dark:bg-[#1a1a1a] shadow-border flex items-center justify-center text-[#171717] dark:text-[#ededed]">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-[#171717] dark:text-[#ededed]">
                    {status?.deviceName || 'Samsung Galaxy A03'}
                  </div>
                  <div className="text-[11px] text-[#888888]">
                    Mã thiết bị: <span className="font-mono">{status?.deviceId || 'R9YT8050EGT'}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-semibold text-[#171717] dark:text-[#ededed]">
                  {pendingCount} giao dịch
                </div>
                <div className="text-[11px] text-[#f5a623]">Đang chờ nạp vào máy</div>
              </div>
            </div>

            {/* Sync Flow Checklist */}
            <div className="p-4 rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#222222] space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-[#888888] font-medium text-[11px] border-b border-[#e5e5e5] dark:border-[#222222] pb-1.5">
                <span>Quy trình đồng bộ hai chiều</span>
                <span>Trạng thái</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${syncStep >= 1 ? 'bg-[#10b981]' : 'bg-[#888888]'}`} />
                  <span>1. Kiểm tra kết nối cáp USB & Cổng dịch vụ</span>
                </div>
                <span className="text-[11px] text-[#888888]">
                  {syncStep >= 1 ? 'Hoàn tất' : 'Chờ thực hiện'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${syncStep >= 2 ? 'bg-[#10b981]' : 'bg-[#888888]'}`} />
                  <span>2. Nạp các giao dịch mới từ Mobile vào PostgreSQL Central DB</span>
                </div>
                <span className="text-[11px] text-[#888888]">
                  {syncStep >= 2 ? 'Hoàn tất' : 'Chờ thực hiện'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${syncStep >= 3 ? 'bg-[#10b981]' : 'bg-[#888888]'}`} />
                  <span>3. Trả về snapshot số dư & danh mục mới nhất xuống Mobile</span>
                </div>
                <span className="text-[11px] text-[#888888]">
                  {syncStep >= 3 ? 'Hoàn tất' : 'Chờ thực hiện'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${syncStep >= 4 ? 'bg-[#10b981]' : 'bg-[#888888]'}`} />
                  <span>4. Ghi nhận log lịch sử đồng bộ trên Central DB</span>
                </div>
                <span className="text-[11px] text-[#888888]">
                  {syncStep >= 4 ? 'Hoàn tất' : 'Chờ thực hiện'}
                </span>
              </div>
            </div>

            {/* Result Message */}
            {syncResult && (
              <div className="p-3.5 rounded-xl bg-[#10b981]/10 border border-[#10b981]/20 text-xs text-[#10b981] flex items-center gap-2.5 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{syncResult}</span>
              </div>
            )}

            {/* Action Footer */}
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                className="h-10 px-5 text-xs sm:text-sm font-medium rounded-lg border border-[#e5e5e5] dark:border-[#262626] hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a] text-[#666666] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-[#ededed] cursor-pointer"
              >
                Đóng
              </Button>
              <Button
                type="button"
                onClick={handleStartSync}
                disabled={syncing}
                className="h-10 px-6 text-xs sm:text-sm font-medium rounded-lg bg-[#171717] text-white hover:bg-[#333333] dark:bg-[#ededed] dark:text-black dark:hover:bg-[#ffffff] shadow-sm cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Đang đồng bộ qua cáp…' : 'Bắt đầu đồng bộ ngay'}</span>
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="text-xs text-[#888888]">
              Nhật ký toàn bộ các phiên đồng bộ dữ liệu giữa điện thoại và máy tính.
            </div>

            {history.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#888888] bg-[#fafafa] dark:bg-[#111111] rounded-xl border border-[#e5e5e5] dark:border-[#222222]">
                Chưa có lịch sử đồng bộ nào được ghi nhận.
              </div>
            ) : (
              <div className="border border-[#e5e5e5] dark:border-[#222222] rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#fafafa] dark:bg-[#111111] text-[#888888] border-b border-[#e5e5e5] dark:border-[#222222] text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3.5 font-medium">Thời gian</th>
                      <th className="py-2.5 px-3.5 font-medium">Thiết bị</th>
                      <th className="py-2.5 px-3.5 font-medium text-center">Giao dịch nạp</th>
                      <th className="py-2.5 px-3.5 font-medium text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e5e5] dark:divide-[#222222] text-[#171717] dark:text-[#ededed]">
                    {history.map((h: any) => (
                      <tr key={h.id} className="hover:bg-[#fafafa] dark:hover:bg-[#111111] transition-colors">
                        <td className="py-2.5 px-3.5 tabular-nums text-[11px]">
                          {formatDate(h.syncTime)} {new Date(h.syncTime).toLocaleTimeString('vi-VN')}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <span className="font-medium">{h.deviceName}</span>
                        </td>
                        <td className="py-2.5 px-3.5 text-center tabular-nums">
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold text-[11px]">
                            +{h.uploadedCount}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 text-right">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                            h.status === 'SUCCESS' ? 'text-[#10b981]' : 'text-[#ff5b4f]'
                          }`}>
                            {h.status === 'SUCCESS' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            {h.status === 'SUCCESS' ? 'Thành công' : 'Thất bại'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                className="h-10 px-5 text-xs sm:text-sm font-medium rounded-lg border border-[#e5e5e5] dark:border-[#262626] hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a] text-[#666666] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-[#ededed] cursor-pointer"
              >
                Đóng
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
