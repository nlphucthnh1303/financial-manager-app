import React, { useState } from 'react';
import { Bell, AlertTriangle, CheckCircle2, Info, Trash2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface NotificationProps {
  open: boolean;
  onClose: () => void;
}

export const NotificationPopoverModal: React.FC<NotificationProps> = ({ open, onClose }) => {
  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; time: string; type: string; unread: boolean }[]>([]);

  const markAllAsRead = () => {
    setNotifications(list => list.map(n => ({ ...n, unread: false })));
    toast.success('Đã đánh dấu đọc tất cả thông báo.');
  };

  const clearAll = () => {
    setNotifications([]);
    toast.success('Đã xóa tất cả thông báo.');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border border-[#e5e5e5] dark:border-[#222222] bg-[#ffffff] dark:bg-[#0a0a0a] shadow-2xl">
        <div className="p-4 pr-12 border-b border-[#f0f0f0] dark:border-[#1f1f1f] bg-[#fafafa]/60 dark:bg-[#111111]/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0070f3]/10 text-[#0070f3] flex items-center justify-center shrink-0">
              <Bell className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm font-semibold text-[#171717] dark:text-[#ededed]">Thông báo hệ thống</h3>
          </div>
          <button 
            type="button" 
            onClick={markAllAsRead} 
            className="text-xs font-medium text-[#666666] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-[#ededed] transition-colors cursor-pointer underline underline-offset-2 shrink-0"
          >
            Đánh dấu đã đọc
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-3.5 space-y-2">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#888888]">Không có thông báo mới nào.</div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`p-3 rounded-xl border text-xs transition flex items-start gap-3 ${n.unread ? 'bg-[#fafafa] dark:bg-[#141414] border-[#e5e5e5] dark:border-[#262626]' : 'border-transparent opacity-75'}`}>
                {n.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /> : n.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> : <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#171717] dark:text-[#ededed] block">{n.title}</span>
                    <span className="text-[10px] text-[#888888] shrink-0 tabular-nums">{n.time}</span>
                  </div>
                  <p className="text-xs text-[#666666] dark:text-[#a1a1a1] mt-0.5 leading-snug">{n.message}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3.5 border-t border-[#f0f0f0] dark:border-[#1f1f1f] flex justify-between items-center bg-[#fafafa]/50 dark:bg-[#111111]/50">
          <span className="text-xs text-[#888888]">{notifications.filter(n => n.unread).length} thông báo chưa đọc</span>
          <Button variant="ghost" size="sm" onClick={clearAll} className="h-8 px-3 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg cursor-pointer">
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Xóa tất cả
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
