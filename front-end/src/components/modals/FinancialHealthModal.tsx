import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { type FinancialHealthEvaluation } from '@/lib/financial-frameworks';
import { HeartPulse, ShieldCheck, AlertTriangle, Info, XCircle } from 'lucide-react';

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
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-[#ffffff] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#222222] shadow-2xl rounded-2xl p-5 sm:p-6">
        <DialogHeader className="space-y-1.5 pb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <HeartPulse className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-semibold text-[#171717] dark:text-[#ededed]">Báo cáo sức khỏe tài chính</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-[#666666] dark:text-[#a1a1a1]">
                Đánh giá tổng quan dòng tiền, quỹ an toàn, tỷ lệ nợ và kỷ luật ngân sách.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Main Score Card */}
          <div className="p-5 rounded-xl border border-[#e5e5e5] dark:border-[#222222] bg-[#fafafa] dark:bg-[#111111]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-[#888888] uppercase tracking-wider">Điểm sức khỏe tổng thể</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-semibold tabular-nums tracking-tight" style={{ color }}>
                    {score}
                  </span>
                  <span className="text-xs text-[#888888]">/ 100 điểm</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#e5e5e5] dark:border-[#262626] text-xs font-medium mt-2.5 bg-[#ffffff] dark:bg-[#161616] text-[#171717] dark:text-[#ededed]">
                  <ShieldCheck className="w-3.5 h-3.5" style={{ color }} />
                  <span>Xếp loại: {rating}</span>
                </div>
              </div>

              {/* Circular Gauge */}
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-zinc-200 dark:text-zinc-800"
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
                <span className="absolute text-xs font-semibold tabular-nums">{score}%</span>
              </div>
            </div>

            <p className="text-xs text-[#666666] dark:text-[#a1a1a1] mt-4 leading-relaxed border-t border-[#e5e5e5] dark:border-[#222222] pt-3">
              {summary}
            </p>
          </div>

          {/* Key 4 Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl border border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#111111]">
              <span className="text-[10px] text-[#888888] font-medium uppercase block">TỶ LỆ TIẾT KIỆM</span>
              <span className="text-sm font-semibold text-[#171717] dark:text-[#ededed] tabular-nums mt-1 block">
                {metrics.savingsRate.toFixed(1)}%
              </span>
              <span className="text-[10px] text-[#888888]">Chuẩn: &gt;20%</span>
            </div>

            <div className="p-3 rounded-xl border border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#111111]">
              <span className="text-[10px] text-[#888888] font-medium uppercase block">QUỸ DỰ PHÒNG</span>
              <span className="text-sm font-semibold text-[#171717] dark:text-[#ededed] tabular-nums mt-1 block">
                {metrics.emergencyFundMonths.toFixed(1)} tháng
              </span>
              <span className="text-[10px] text-[#888888]">Chuẩn: 3–6 tháng</span>
            </div>

            <div className="p-3 rounded-xl border border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#111111]">
              <span className="text-[10px] text-[#888888] font-medium uppercase block">TỶ LỆ NỢ / THU</span>
              <span className="text-sm font-semibold text-[#171717] dark:text-[#ededed] tabular-nums mt-1 block">
                {metrics.debtRatio.toFixed(1)}%
              </span>
              <span className="text-[10px] text-[#888888]">Chuẩn: &lt;30%</span>
            </div>

            <div className="p-3 rounded-xl border border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#111111]">
              <span className="text-[10px] text-[#888888] font-medium uppercase block">TUÂN THỦ HẠN MỨC</span>
              <span className="text-sm font-semibold text-[#171717] dark:text-[#ededed] tabular-nums mt-1 block">
                {metrics.budgetAdherence.toFixed(0)}%
              </span>
              <span className="text-[10px] text-[#888888]">Chuẩn: 100%</span>
            </div>
          </div>

          {/* Actionable Insights List */}
          <div>
            <h3 className="text-xs font-semibold text-[#171717] dark:text-[#ededed] uppercase tracking-wider mb-2.5">
              Khuyến nghị cá nhân hóa:
            </h3>
            <div className="space-y-2">
              {insights.map((ins, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl border border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#111111] text-xs flex items-start gap-3 transition-colors"
                >
                  <div className="shrink-0 mt-0.5">
                    {ins.type === 'success' && <ShieldCheck className="w-4 h-4 text-[#10b981]" />}
                    {ins.type === 'danger' && <XCircle className="w-4 h-4 text-[#ff5b4f]" />}
                    {ins.type === 'warning' && <AlertTriangle className="w-4 h-4 text-[#f59e0b]" />}
                    {ins.type === 'info' && <Info className="w-4 h-4 text-[#0070f3]" />}
                  </div>
                  <div>
                    <h4 className="font-medium text-xs text-[#171717] dark:text-[#ededed]">{ins.title}</h4>
                    <p className="text-[#666666] dark:text-[#888888] text-[11px] mt-0.5 leading-relaxed">{ins.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4 mt-2 border-t border-[#f0f0f0] dark:border-[#1f1f1f]">
          <Button
            type="button"
            onClick={onClose}
            className="w-full h-10 px-5 text-xs sm:text-sm font-medium rounded-lg bg-[#171717] dark:bg-[#ededed] text-white dark:text-black hover:bg-[#333333] dark:hover:bg-white shadow-sm cursor-pointer"
          >
            Đã hiểu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
