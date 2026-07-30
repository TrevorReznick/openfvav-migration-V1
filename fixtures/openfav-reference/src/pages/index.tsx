import React, { useEffect, useState } from 'react';
import Card from '../components/Card';

interface DashboardStats {
  users: number;
  projects: number;
  uptime: string;
}

export default function IndexPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => res.json())
      .then(setStats);
  }, []);

  return (
    <div className="page">
      <h1>Dashboard</h1>
      <div className="stats-grid">
        <Card title="Users" subtitle={stats ? String(stats.users) : '...'} />
        <Card title="Projects" subtitle={stats ? String(stats.projects) : '...'} />
        <Card title="Uptime" subtitle={stats ? stats.uptime : '...'} />
      </div>
    </div>
  );
}
