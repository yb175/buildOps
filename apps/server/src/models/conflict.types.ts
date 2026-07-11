import { ParsedDrawing } from "../types/parsed-drawing.types";

export type ConflictCategory = "SEMANTIC" | "GEOMETRY" | "DISCIPLINE";
export type ConflictSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Conflict {
  id: string;
  category: ConflictCategory;
  severity: ConflictSeverity;
  title: string;
  description: string;
  entityA: string;
  entityB?: string;
  recommendation: string;
}

export interface RuleContext {
  drawing: ParsedDrawing;
  drawingId: string;
  allDrawings?: { drawing: ParsedDrawing; id: string; discipline?: string | null }[];
}

export interface ConflictRule {
  name: string;
  category: ConflictCategory;
  execute(context: RuleContext): Promise<Conflict[]> | Conflict[];
}
