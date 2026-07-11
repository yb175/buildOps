import { describe, it, expect } from "vitest";
import { validateDraftRfi } from "../../rfi/validator";
import { DraftRFI } from "../../models/rfi.types";

describe("RfiValidator unit tests", () => {
  const validRfi: DraftRFI = {
    id: "rfi-uuid",
    title: "RFI for Door intersects Column",
    priority: "HIGH",
    discipline: "ARCHITECTURAL",
    subject: "Door D4 and Column C2 Conflict",
    description: "Door D4 intersects column C2.",
    question: "Should door position or column location be revised?",
    recommendation: "Review layouts.",
    relatedConflicts: ["c1-uuid"],
  };

  it("should pass validation for a valid RFI", () => {
    const allowed = new Set(["c1-uuid"]);
    const errors = validateDraftRfi(validRfi, allowed);
    expect(errors).toHaveLength(0);
  });

  it("should fail validation if required fields are missing or empty", () => {
    const invalidRfi: DraftRFI = {
      ...validRfi,
      title: "",
      question: "   ",
      priority: "INVALID" as any,
    };
    const allowed = new Set(["c1-uuid"]);
    const errors = validateDraftRfi(invalidRfi, allowed);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.join(", ")).toContain("title");
    expect(errors.join(", ")).toContain("question");
    expect(errors.join(", ")).toContain("priority");
  });

  it("should fail validation if relatedConflicts references a hallucinated conflict id", () => {
    const invalidRfi: DraftRFI = {
      ...validRfi,
      relatedConflicts: ["c1-uuid", "hallucinated-id"],
    };
    const allowed = new Set(["c1-uuid"]);
    const errors = validateDraftRfi(invalidRfi, allowed);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain("Hallucinated conflictId");
  });
});
