import { Conflict, RuleContext, ConflictRule } from "../../models/conflict.types";
import { RULE_REGISTRY } from "./registry";

export class ConflictEngine {
  private rules: ConflictRule[];

  constructor(rules: ConflictRule[] = RULE_REGISTRY) {
    this.rules = rules;
  }

  /**
   * Executes all registered rules against the context, merges findings,
   * de-duplicates identical conflicts, and sorts them by severity.
   */
  async analyze(context: RuleContext): Promise<Conflict[]> {
    const rawConflicts: Conflict[] = [];

    // Run all rules concurrently (or sequentially, since they are CPU-bound and simple)
    for (const rule of this.rules) {
      try {
        const results = await rule.execute(context);
        rawConflicts.push(...results);
      } catch (err) {
        console.error(`[ConflictEngine] Error running rule "${rule.name}":`, err);
      }
    }

    // De-duplicate conflicts
    const seen = new Set<string>();
    const deduplicated: Conflict[] = [];

    for (const conflict of rawConflicts) {
      const key = `${conflict.category}|${conflict.title}|${conflict.entityA}|${conflict.entityB || ""}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(conflict);
      }
    }

    // Sort by severity (CRITICAL > HIGH > MEDIUM > LOW)
    const severityOrder = {
      CRITICAL: 0,
      HIGH: 1,
      MEDIUM: 2,
      LOW: 3,
    };

    deduplicated.sort((a, b) => {
      const pA = severityOrder[a.severity] ?? 4;
      const pB = severityOrder[b.severity] ?? 4;
      return pA - pB;
    });

    return deduplicated;
  }
}
