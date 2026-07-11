import crypto from "crypto";
import { randomUUID } from "crypto";
import { Conflict as DBConflict } from "@prisma/client";
import { Conflict as CoreConflict } from "../models/conflict.types";
import { DraftRFI, GeminiRfiRefinement } from "../models/rfi.types";

/**
 * Computes a SHA-256 hash deterministically based on conflict content.
 */
export function computeConflictsHash(conflicts: (DBConflict | CoreConflict)[]): string {
  if (conflicts.length === 0) return "";

  // Sort conflicts by content-based key to ensure determinism
  const sorted = [...conflicts].sort((a, b) => {
    const keyA = `${a.category}|${a.severity}|${a.title}|${a.entityA}|${a.entityB || ""}`;
    const keyB = `${b.category}|${b.severity}|${b.title}|${b.entityA}|${b.entityB || ""}`;
    return keyA.localeCompare(keyB);
  });

  const hashInput = sorted
    .map((c) => `${c.category}|${c.severity}|${c.title}|${c.entityA}|${c.entityB || ""}`)
    .join("\n");

  return crypto.createHash("sha256").update(hashInput).digest("hex");
}

/**
 * Maps Conflict severity to RFI priority.
 */
export function mapSeverityToPriority(severity: string): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  switch (severity.toUpperCase()) {
    case "LOW":
      return "LOW";
    case "MEDIUM":
      return "MEDIUM";
    case "HIGH":
      return "HIGH";
    case "CRITICAL":
      return "CRITICAL";
    default:
      return "MEDIUM";
  }
}

/**
 * Generates an RFI skeleton for a conflict, populated with deterministic fields.
 */
export function createRfiSkeleton(
  conflict: DBConflict | CoreConflict,
  discipline: string
): Omit<DraftRFI, "description" | "question" | "recommendation"> {
  const entityBStr = conflict.entityB ? ` and ${conflict.entityB}` : "";
  const subject = `${conflict.entityA}${entityBStr} Conflict`;

  return {
    id: randomUUID(),
    title: `RFI for: ${conflict.title}`,
    priority: mapSeverityToPriority(conflict.severity),
    discipline: discipline || "UNKNOWN",
    subject,
    relatedConflicts: [conflict.id],
  };
}

/**
 * Generates fallback refinement values for a conflict in case Gemini fails.
 */
export function generateFallbackRefinement(conflict: DBConflict | CoreConflict): GeminiRfiRefinement {
  const entityBStr = conflict.entityB ? ` and ${conflict.entityB}` : "";
  return {
    conflictId: conflict.id,
    description: `A conflict of ${conflict.severity} severity was detected between ${conflict.entityA}${entityBStr}. Detail: ${conflict.description}`,
    question: `Please verify and confirm the design intent and correct installation parameters to resolve the conflict between ${conflict.entityA}${entityBStr}.`,
    recommendation: conflict.recommendation || `Coordinate design details for ${conflict.entityA}${entityBStr} and revise drawings as necessary prior to execution.`,
  };
}

/**
 * Merges RFI skeletons with Gemini refinements or fallbacks.
 */
export function mergeRfiRefinements(
  skeletons: { skeleton: Omit<DraftRFI, "description" | "question" | "recommendation">; conflictId: string }[],
  refinements: GeminiRfiRefinement[],
  conflicts: (DBConflict | CoreConflict)[]
): DraftRFI[] {
  const refinementsMap = new Map<string, GeminiRfiRefinement>();
  for (const ref of refinements) {
    refinementsMap.set(ref.conflictId, ref);
  }

  return skeletons.map(({ skeleton, conflictId }) => {
    const conflict = conflicts.find((c) => c.id === conflictId)!;
    const ref = refinementsMap.get(conflictId) || generateFallbackRefinement(conflict);
    
    return {
      ...skeleton,
      description: ref.description || generateFallbackRefinement(conflict).description,
      question: ref.question || generateFallbackRefinement(conflict).question,
      recommendation: ref.recommendation || generateFallbackRefinement(conflict).recommendation,
    };
  });
}
