export type ValidationSeverity = "warning" | "error";

export interface ValidationIssue {
  readonly code:
    | "empty-selection"
    | "unsupported-file"
    | "invalid-coordinate"
    | "duplicate-coordinate"
    | "missing-coordinate"
    | "unreadable-file";
  readonly severity: ValidationSeverity;
  readonly message: string;
  readonly datasetName?: string;
  readonly coordinate?: string;
  readonly filename?: string;
}
