export interface StatsCardProps {
  title: string;
  value: string;
  trend?: string;
}

export function StatsCard({ title, value, trend }: StatsCardProps) {
  return (
    <div className="stats-card">
      <h4 className="stats-card__title">{title}</h4>
      <p className="stats-card__value">{value}</p>
      {trend && (
        <span className={`stats-card__trend ${trend.startsWith('+') ? 'positive' : 'negative'}`}>
          {trend}
        </span>
      )}
    </div>
  );
}
