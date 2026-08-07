declare module "@sukoyaka-dopeness/e2r-validator" {
  export interface Diagnostic {
    severity: "error" | "warning";
    code: string;
    path: string;
    relatedIds?: string[];
  }

  export interface ValidationResult {
    valid: boolean;
    diagnostics: Diagnostic[];
  }

  export function validateDataset(value: unknown): ValidationResult;
}
