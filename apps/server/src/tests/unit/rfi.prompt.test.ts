import { describe, it, expect } from "vitest";
import { buildRfiPrompt } from "../../rfi/prompt";
import { Conflict } from "../../models/conflict.types";

describe("RfiPrompt unit tests", () => {
  it("should construct prompt containing drawing info and conflict details", () => {
    const conflicts: Conflict[] = [
      {
        id: "c1-uuid",
        category: "GEOMETRY",
        severity: "HIGH",
        title: "Door intersects Column",
        description: "Door D4 intersects column C2.",
        entityA: "Door D4",
        entityB: "Column C2",
        recommendation: "Shift door to clear column.",
      },
    ];

    const prompt = buildRfiPrompt("A-101", "ARCHITECTURAL", conflicts);

    expect(prompt).toContain("A-101");
    expect(prompt).toContain("ARCHITECTURAL");
    expect(prompt).toContain("Door intersects Column");
    expect(prompt).toContain("c1-uuid");
    expect(prompt).toContain("GeminiRfiRefinement");
  });
});
