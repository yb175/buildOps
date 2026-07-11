export interface Metadata {
  drawingNumber?: string | null;
  title?: string | null;
  project?: string | null;
  revision?: string | null;
  scale?: string | null;
  date?: string | null;
  discipline?: string | null;
}

export interface Room {
  id?: string | null;
  name: string;
  number?: string | null;
  areaSquareFeet?: number | null;
  dimensions?: string | null;
}

export interface GridLine {
  label: string;
  direction: "HORIZONTAL" | "VERTICAL" | "UNKNOWN" | string;
}

export interface StructuralElements {
  foundations: any[];
  columns: any[];
  beams: any[];
  slabs: any[];
  walls: any[];
  gridLines: GridLine[];
}

export interface OpeningElements {
  doors: any[];
  windows: any[];
}

export interface Fixture {
  id?: string | null;
  name: string;
  type?: string | null;
  location?: string | null;
}

export interface Annotation {
  id?: string | null;
  text: string;
  location?: string | null;
}

export interface Schedule {
  id?: string | null;
  name: string;
  type?: string | null;
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
