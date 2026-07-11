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

  for (const room of data.rooms) {
    if (room === null || typeof room !== "object") {
      throw new Error("rooms elements must be objects");
    }
    if (typeof room.name !== "string") {
      throw new Error("rooms[].name must be a string");
    }
  }

  if (typeof data.structural !== "object" || data.structural === null) {
    throw new Error("structural must be an object");
  }

  const structuralFields = ["foundations", "columns", "beams", "slabs", "walls"];
  for (const field of structuralFields) {
    if (!Array.isArray(data.structural[field])) {
      throw new Error(`structural.${field} must be an array`);
    }
    for (const el of data.structural[field]) {
      if (el === null || typeof el !== "object") {
        throw new Error(`structural.${field} elements must be objects`);
      }
    }
  }

  if (data.structural.gridLines !== undefined) {
    if (!Array.isArray(data.structural.gridLines)) {
      throw new Error("structural.gridLines must be an array");
    }
    for (const el of data.structural.gridLines) {
      if (el === null || typeof el !== "object") {
        throw new Error("structural.gridLines elements must be objects");
      }
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
    for (const el of data.openings[field]) {
      if (el === null || typeof el !== "object") {
        throw new Error(`openings.${field} elements must be objects`);
      }
    }
  }

  if (!Array.isArray(data.fixtures)) {
    throw new Error("fixtures must be an array");
  }

  for (const fixture of data.fixtures) {
    if (fixture === null || typeof fixture !== "object") {
      throw new Error("fixtures elements must be objects");
    }
    if (typeof fixture.name !== "string") {
      throw new Error("fixtures[].name must be a string");
    }
  }

  if (!Array.isArray(data.annotations)) {
    throw new Error("annotations must be an array");
  }

  for (const annotation of data.annotations) {
    if (annotation === null || typeof annotation !== "object") {
      throw new Error("annotations elements must be objects");
    }
    if (typeof annotation.text !== "string") {
      throw new Error("annotations[].text must be a string");
    }
  }

  if (!Array.isArray(data.schedules)) {
    throw new Error("schedules must be an array");
  }

  for (const schedule of data.schedules) {
    if (schedule === null || typeof schedule !== "object") {
      throw new Error("schedules elements must be objects");
    }
    if (typeof schedule.name !== "string") {
      throw new Error("schedules[].name must be a string");
    }
    if (!Array.isArray(schedule.data)) {
      throw new Error("schedules[].data must be an array");
    }
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
