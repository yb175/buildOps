export interface Project {
  name: string;
  lastUpdated: string;
  status: string;
  issuesCount: number;
  rfiCount: number;
  manualTimeSaved: string;
}

export interface Drawing {
  id: string;
  fileName: string;
  discipline: string;
  status: string;
  createdAt: string;
  conflictsCount: number;
  rfisCount: number;
  projectName: string;
}

export interface Conflict {
  id: string;
  drawingId: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  entityA: string;
  entityB: string | null;
  recommendation: string;
  createdAt: string;
}

export interface Rfi {
  id: string;
  drawingId: string;
  conflictId: string;
  title: string;
  priority: string;
  discipline: string;
  subject: string;
  description: string;
  question: string;
  recommendation: string;
  status: string;
  createdAt: string;
}

export interface ProjectDetails {
  name: string;
  drawings: Drawing[];
  rfis: Rfi[];
}
