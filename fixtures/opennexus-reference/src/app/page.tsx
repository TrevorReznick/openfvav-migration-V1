import { StatsCard } from '../components/StatsCard';
import { SearchBar } from '../components/SearchBar';

export default function HomePage() {
  return (
    <div>
      <h1>OpenNexus Dashboard</h1>
      <SearchBar placeholder="Search repositories..." />
      <div className="stats-grid">
        <StatsCard title="Repositories" value="42" trend="+12%" />
        <StatsCard title="Migration Score" value="87%" trend="+5%" />
        <StatsCard title="Tokens Extracted" value="2,847" trend="+340" />
      </div>
    </div>
  );
}
