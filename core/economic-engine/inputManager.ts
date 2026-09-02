// MINE AI V0.1 — Economic Engine: Input Manager
// Stage 8: defines what user-supplied inputs are required to calculate
// economic impact, and checks whether they've been provided. Per the
// locked rule, MINE AI must NEVER invent a financial value — if something
// is missing, it says exactly what's missing rather than guessing.

export const REQUIRED_ECONOMIC_INPUTS = ["valuePerUnit"] as const;

export interface InputCheckResult {
  isComplete: boolean;
  missingInputs: string[];
}

export function checkRequiredInputs(
  providedInputs: Record<string, number>
): InputCheckResult {
  const missingInputs = REQUIRED_ECONOMIC_INPUTS.filter(
    (key) => providedInputs[key] === undefined || providedInputs[key] === null
  );

  return {
    isComplete: missingInputs.length === 0,
    missingInputs,
  };
}
