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
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
        <div className="p-4 pr-12 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Thông báo hệ thống</h3>
          </div>
          <button 
            type="button" 
            onClick={markAllAsRead} 
            className="text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition underline underline-offset-2 shrink-0"
          >
            Đánh dấu đã đọc
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-3 space-y-2">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">Không có thông báo nào.</div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`p-3 rounded-lg border text-xs transition flex items-start gap-3 ${n.unread ? 'bg-zinc-50 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700' : 'border-zinc-100 dark:border-zinc-800 opacity-75'}`}>
                {n.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /> : n.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> : <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-zinc-900 dark:text-white block">{n.title}</span>
                    <span className="text-[10px] text-zinc-400 shrink-0">{n.time}</span>
                  </div>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5 leading-snug">{n.message}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
          <span className="text-[11px] text-zinc-400">{notifications.filter(n => n.unread).length} thông báo mới</span>
          <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs text-rose-600 dark:text-rose-400 h-7 px-2">
            <Trash2 className="w-3 h-3 mr-1" /> Xóa tất cả
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
