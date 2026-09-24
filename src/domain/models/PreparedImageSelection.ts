import type { ParsedImage } from "./ParsedImage";
import type { ValidationIssue } from "./ValidationIssue";

export interface PreparedImageSelection {
  readonly images: readonly ParsedImage[];
  readonly datasets: readonly string[];
  readonly coordinateRows: readonly string[];
  readonly coordinateColumns: readonly number[];
  readonly issues: readonly ValidationIssue[];
}

export function hasBlockingIssues(selection: PreparedImageSelection): boolean {
  return selection.issues.some((issue) => issue.severity === "error");
}
