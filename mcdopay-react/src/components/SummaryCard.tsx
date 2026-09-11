import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface SummaryCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  meta?: string;
  accent?: 'default' | 'accent';
  action?: ReactNode;
}

export function SummaryCard({ icon: Icon, label, value, meta, accent = 'default', action }: SummaryCardProps) {
  return (
    <div className="card card--tight summary-card">
      <div className="summary-card__top">
        <div className={`summary-card__icon${accent === 'accent' ? ' summary-card__icon--accent' : ''}`}>
          <Icon size={18} />
        </div>
        {action}
      </div>
      <div className="summary-card__value tabular">{value}</div>
      <div className="summary-card__label">{label}</div>
      {meta && <div className="summary-card__meta">{meta}</div>}
    </div>
  );
}
