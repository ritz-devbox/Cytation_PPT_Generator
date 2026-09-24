export type ValidationSeverity = "warning" | "error";

export interface ValidationIssue {
  readonly code:
    | "empty-selection"
    | "unsupported-file"
    | "invalid-coordinate"
    | "duplicate-coordinate"
    | "missing-coordinate"
    | "unreadable-file"
    | "missing-count-workbook"
    | "invalid-count-workbook"
    | "missing-count-block"
    | "missing-count-coordinate";
  readonly severity: ValidationSeverity;
  readonly message: string;
  readonly datasetName?: string;
  readonly coordinate?: string;
  readonly filename?: string;
}
