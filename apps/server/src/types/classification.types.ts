export interface DocumentClassification {
  isConstructionDrawing: boolean;
  confidence: number;
  documentType:
    | "ARCHITECTURAL_DRAWING"
    | "STRUCTURAL_DRAWING"
    | "INTERIOR_DRAWING"
    | "MEP_DRAWING"
    | "RESUME"
    | "INVOICE"
    | "BANK_STATEMENT"
    | "REPORT"
    | "UNKNOWN";
  reason: string;
}
