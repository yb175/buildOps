import { DraftRFI } from "../models/rfi.types";

/**
 * Validates a generated DraftRFI against the schema and guards against hallucinations.
 * Returns an array of validation error messages. If empty, the RFI is valid.
 */
export function validateDraftRfi(rfi: DraftRFI, allowedConflictIds: Set<string>): string[] {
  const errors: string[] = [];

  if (!rfi.id || typeof rfi.id !== "string") {
    errors.push("Missing or invalid RFI id");
  }

  if (!rfi.title || typeof rfi.title !== "string" || rfi.title.trim() === "") {
    errors.push("Missing or empty title");
  }

  const validPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  if (!rfi.priority || !validPriorities.includes(rfi.priority)) {
    errors.push(`Invalid or missing priority: ${rfi.priority}`);
  }

  if (!rfi.discipline || typeof rfi.discipline !== "string" || rfi.discipline.trim() === "") {
    errors.push("Missing or empty discipline");
  }

  if (!rfi.subject || typeof rfi.subject !== "string" || rfi.subject.trim() === "") {
    errors.push("Missing or empty subject");
  }

  if (!rfi.description || typeof rfi.description !== "string" || rfi.description.trim() === "") {
    errors.push("Missing or empty description");
  }

  if (!rfi.question || typeof rfi.question !== "string" || rfi.question.trim() === "") {
    errors.push("Missing or empty question");
  }

  if (!rfi.recommendation || typeof rfi.recommendation !== "string" || rfi.recommendation.trim() === "") {
    errors.push("Missing or empty recommendation");
  }

  if (!rfi.relatedConflicts || !Array.isArray(rfi.relatedConflicts) || rfi.relatedConflicts.length === 0) {
    errors.push("Missing relatedConflicts");
  } else {
    for (const conflictId of rfi.relatedConflicts) {
      if (!allowedConflictIds.has(conflictId)) {
        errors.push(`Hallucinated conflictId in relatedConflicts: ${conflictId}`);
      }
    }
  }

  return errors;
}
