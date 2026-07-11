import { ParsedDrawing } from "../types/parsed-drawing.types";

/**
 * Validates that the input data strictly conforms to BuildOps ParsedDrawing Schema v1.
 * Throws an descriptive error if validation fails.
 */
export function validateParsedDrawing(data: any): ParsedDrawing {
  if (typeof data !== "object" || data === null) {
    throw new Error("Data must be a non-null object");
  }

  if (data.schemaVersion !== "1.0") {
    throw new Error("Invalid schemaVersion: must be '1.0'");
  }

  if (typeof data.metadata !== "object" || data.metadata === null) {
    throw new Error("metadata must be an object");
  }

  if (!Array.isArray(data.rooms)) {
    throw new Error("rooms must be an array");
  }

  if (typeof data.structural !== "object" || data.structural === null) {
    throw new Error("structural must be an object");
  }

  const structuralFields = ["foundations", "columns", "beams", "slabs", "walls"];
  for (const field of structuralFields) {
    if (!Array.isArray(data.structural[field])) {
      throw new Error(`structural.${field} must be an array`);
    }
  }

  if (typeof data.openings !== "object" || data.openings === null) {
    throw new Error("openings must be an object");
  }

  const openingsFields = ["doors", "windows"];
  for (const field of openingsFields) {
    if (!Array.isArray(data.openings[field])) {
      throw new Error(`openings.${field} must be an array`);
    }
  }

  if (!Array.isArray(data.fixtures)) {
    throw new Error("fixtures must be an array");
  }

  if (!Array.isArray(data.annotations)) {
    throw new Error("annotations must be an array");
  }

  if (!Array.isArray(data.schedules)) {
    throw new Error("schedules must be an array");
  }

  if (!Array.isArray(data.notes)) {
    throw new Error("notes must be an array");
  }

  for (const note of data.notes) {
    if (typeof note !== "string") {
      throw new Error("notes elements must be strings");
    }
  }

  return data as ParsedDrawing;
}
