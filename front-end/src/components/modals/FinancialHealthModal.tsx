import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { type FinancialHealthEvaluation } from '@/lib/financial-frameworks';
import { HeartPulse, ShieldCheck, AlertTriangle, Info, XCircle, TrendingUp, Wallet } from 'lucide-react';

interface FinancialHealthModalProps {
  open: boolean;
  onClose: () => void;
  evaluation: FinancialHealthEvaluation | null;
}

export const FinancialHealthModal: React.FC<FinancialHealthModalProps> = ({ open, onClose, evaluation }) => {
  if (!evaluation) return null;

  const { score, rating, color, summary, insights, metrics } = evaluation;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Báo cáo Sức khỏe Tài chính Cá nhân</DialogTitle>
              <DialogDescription className="text-xs">
                Đánh giá tổng quan dòng tiền, quỹ an toàn, tỷ lệ nợ và kỷ luật ngân sách.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Main Score Hero */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950 text-white shadow-lg relative overflow-hidden">
            <div className="absolute right-[-20px] top-[-20px] w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">Điểm sức khỏe tổng thể</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-extrabold tabular-nums tracking-tight" style={{ color }}>
                    {score}
                  </span>
                  <span className="text-sm text-zinc-400">/ 100 điểm</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold mt-2" style={{ backgroundColor: `${color}25`, color }}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Xếp loại: {rating}</span>
                </div>
              </div>

              {/* Circular Gauge */}
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-zinc-700"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    stroke={color}
                    strokeWidth="3.5"
                    strokeDasharray={`${score}, 100`}
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-sm font-bold">{score}%</span>
              </div>
            </div>

            <p className="text-xs text-zinc-300 mt-4 leading-relaxed border-t border-zinc-700/60 pt-3">
              {summary}
            </p>
          </div>

          {/* Key 4 Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-850/60">
              <span className="text-[10px] text-zinc-500 font-medium block">TỶ LỆ TIẾT KIỆM</span>
              <span className="text-base font-bold text-zinc-900 dark:text-white tabular-nums mt-0.5 block">
                {metrics.savingsRate.toFixed(1)}%
              </span>
              <span className="text-[10px] text-zinc-400">Chuẩn: &gt;20%</span>
            </div>

            <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-850/60">
              <span className="text-[10px] text-zinc-500 font-medium block">QUỸ DỰ PHÒNG</span>
              <span className="text-base font-bold text-zinc-900 dark:text-white tabular-nums mt-0.5 block">
                {metrics.emergencyFundMonths.toFixed(1)} tháng
              </span>
              <span className="text-[10px] text-zinc-400">Chuẩn: 3-6 tháng</span>
            </div>

            <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-850/60">
              <span className="text-[10px] text-zinc-500 font-medium block">TỶ LỆ NỢ / THU</span>
              <span className="text-base font-bold text-zinc-900 dark:text-white tabular-nums mt-0.5 block">
                {metrics.debtRatio.toFixed(1)}%
              </span>
              <span className="text-[10px] text-zinc-400">Chuẩn: &lt;30%</span>
            </div>

            <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-850/60">
              <span className="text-[10px] text-zinc-500 font-medium block">TUÂN THỦ HẠN MỨC</span>
              <span className="text-base font-bold text-zinc-900 dark:text-white tabular-nums mt-0.5 block">
                {metrics.budgetAdherence.toFixed(0)}%
              </span>
              <span className="text-[10px] text-zinc-400">Chuẩn: 100%</span>
            </div>
          </div>

          {/* Actionable Insights List */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider mb-2.5">
              Khuyến nghị & Lời khuyên cá nhân hóa:
            </h3>
            <div className="space-y-2">
              {insights.map((ins, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition ${
                    ins.type === 'success'
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200'
                      : ins.type === 'danger'
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60 text-rose-950 dark:text-rose-200'
                      : ins.type === 'warning'
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60 text-amber-950 dark:text-amber-200'
                      : 'bg-sky-50/50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-800/60 text-sky-950 dark:text-sky-200'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {ins.type === 'success' && <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                    {ins.type === 'danger' && <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                    {ins.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                    {ins.type === 'info' && <Info className="w-4 h-4 text-sky-600 dark:text-sky-400" />}
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-zinc-900 dark:text-white">{ins.title}</h4>
                    <p className="text-zinc-600 dark:text-zinc-300 text-[11px] mt-0.5 leading-relaxed">{ins.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={onClose} size="sm" className="w-full text-xs bg-zinc-900 dark:bg-white text-white dark:text-zinc-900">
            Đã hiểu, tiếp tục quản lý tài chính
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
