export interface Metadata {
  drawingNumber?: string;
  title?: string;
  project?: string;
  revision?: string;
  scale?: string;
  date?: string;
}

export interface Room {
  id?: string;
  name: string;
  number?: string;
  areaSquareFeet?: number;
  dimensions?: string;
}

export interface StructuralElements {
  foundations: any[];
  columns: any[];
  beams: any[];
  slabs: any[];
  walls: any[];
}

export interface OpeningElements {
  doors: any[];
  windows: any[];
}

export interface Fixture {
  id?: string;
  name: string;
  type?: string;
  location?: string;
}

export interface Annotation {
  id?: string;
  text: string;
  location?: string;
}

export interface Schedule {
  id?: string;
  name: string;
  type?: string;
  data: Record<string, any>[];
}

export interface ParsedDrawing {
  schemaVersion: "1.0";
  metadata: Metadata;
  rooms: Room[];
  structural: StructuralElements;
  openings: OpeningElements;
  fixtures: Fixture[];
  annotations: Annotation[];
  schedules: Schedule[];
  notes: string[];
}
