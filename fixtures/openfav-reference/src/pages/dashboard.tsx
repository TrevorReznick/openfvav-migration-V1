import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';

interface Project {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetch('/api/projects')
      .then((res) => res.json())
      .then(setProjects);
  }, []);

  return (
    <div className="page">
      <h1>Projects</h1>
      <Button label="New Project" variant="primary" />
      <div className="project-list">
        {projects.map((project) => (
          <Card key={project.id} title={project.name} subtitle={project.status} />
        ))}
      </div>
    </div>
  );
}
