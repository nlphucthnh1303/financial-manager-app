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
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-[#ffffff] dark:bg-[#0a0a0a] shadow-dropdown border-0">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#fafafa] dark:bg-[#111111] shadow-border text-[#10b981] flex items-center justify-center">
              <HeartPulse className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-[#171717] dark:text-[#ededed]">Báo cáo sức khỏe tài chính</DialogTitle>
              <DialogDescription className="text-xs text-[#888888]">
                Đánh giá tổng quan dòng tiền, quỹ an toàn, tỷ lệ nợ và kỷ luật ngân sách.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Main Score Card */}
          <div className="p-5 rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-[#888888] uppercase tracking-wider">Điểm sức khỏe tổng thể</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-semibold tabular-nums tracking-tight" style={{ color }}>
                    {score}
                  </span>
                  <span className="text-xs text-[#888888]">/ 100 điểm</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded shadow-border text-[11px] font-medium mt-2 bg-[#fafafa] dark:bg-[#111111] text-[#171717] dark:text-[#ededed]">
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

            <p className="text-xs text-[#666666] dark:text-[#888888] mt-4 leading-relaxed border-t border-zinc-100 dark:border-zinc-900 pt-3">
              {summary}
            </p>
          </div>

          {/* Key 4 Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-md shadow-border bg-[#fafafa] dark:bg-[#111111]">
              <span className="text-[10px] text-[#888888] block">TỶ LỆ TIẾT KIỆM</span>
              <span className="text-sm font-semibold text-[#171717] dark:text-[#ededed] tabular-nums mt-0.5 block">
                {metrics.savingsRate.toFixed(1)}%
              </span>
              <span className="text-[10px] text-[#888888]">Chuẩn: &gt;20%</span>
            </div>

            <div className="p-2.5 rounded-md shadow-border bg-[#fafafa] dark:bg-[#111111]">
              <span className="text-[10px] text-[#888888] block">QUỸ DỰ PHÒNG</span>
              <span className="text-sm font-semibold text-[#171717] dark:text-[#ededed] tabular-nums mt-0.5 block">
                {metrics.emergencyFundMonths.toFixed(1)} tháng
              </span>
              <span className="text-[10px] text-[#888888]">Chuẩn: 3–6 tháng</span>
            </div>

            <div className="p-2.5 rounded-md shadow-border bg-[#fafafa] dark:bg-[#111111]">
              <span className="text-[10px] text-[#888888] block">TỶ LỆ NỢ / THU</span>
              <span className="text-sm font-semibold text-[#171717] dark:text-[#ededed] tabular-nums mt-0.5 block">
                {metrics.debtRatio.toFixed(1)}%
              </span>
              <span className="text-[10px] text-[#888888]">Chuẩn: &lt;30%</span>
            </div>

            <div className="p-2.5 rounded-md shadow-border bg-[#fafafa] dark:bg-[#111111]">
              <span className="text-[10px] text-[#888888] block">TUÂN THỦ HẠN MỨC</span>
              <span className="text-sm font-semibold text-[#171717] dark:text-[#ededed] tabular-nums mt-0.5 block">
                {metrics.budgetAdherence.toFixed(0)}%
              </span>
              <span className="text-[10px] text-[#888888]">Chuẩn: 100%</span>
            </div>
          </div>

          {/* Actionable Insights List */}
          <div>
            <h3 className="text-xs font-semibold text-[#171717] dark:text-[#ededed] uppercase tracking-wider mb-2">
              Khuyến nghị cá nhân hóa:
            </h3>
            <div className="space-y-2">
              {insights.map((ins, i) => (
                <div
                  key={i}
                  className="p-3 rounded-md shadow-border bg-[#fafafa] dark:bg-[#111111] text-xs flex items-start gap-2.5 transition-colors"
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

        <DialogFooter>
          <Button type="button" onClick={onClose} size="sm" className="w-full text-xs bg-[#171717] dark:bg-[#ededed] text-white dark:text-black">
            Đã hiểu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
