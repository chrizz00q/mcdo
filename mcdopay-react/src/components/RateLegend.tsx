import { RATE_LEGEND } from '../utils/rates';
import { formatCurrency } from '../utils/calculations';

interface RateLegendProps {
  hourlyRate: number;
}

const DOT_BY_KEY: Record<string, string> = {
  normal: 'normal',
  night: 'night',
  holiday: 'holiday',
  double: 'double',
};

export function RateLegend({ hourlyRate }: RateLegendProps) {
  return (
    <div className="card card--tight">
      <div className="section-heading">
        <h2>Rate legend</h2>
        <span className="section-heading__hint">per hour</span>
      </div>
      <div>
        {RATE_LEGEND.map((rate) => (
          <div className="legend-row" key={rate.key}>
            <div className="legend-row__label">
              <span className={`status-dot status-dot--${DOT_BY_KEY[rate.key]}`} aria-hidden="true" />
              <span>
                {rate.label}
                <small>{rate.description}</small>
              </span>
            </div>
            <div className="legend-row__value tabular">
              {formatCurrency(hourlyRate * rate.multiplier)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
