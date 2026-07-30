import { StatsCard } from '../../components/StatsCard';
import { SearchBar } from '../../components/SearchBar';

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard Details</h1>
      <SearchBar placeholder="Filter by name..." />
      <div className="detail-grid">
        <StatsCard title="Active Migrations" value="12" trend="stable" />
        <StatsCard title="Completed" value="30" trend="+2%" />
        <StatsCard title="Total Time Saved" value="450h" trend="+45h" />
      </div>
    </div>
  );
}
