// The workbook reader can return primitive cells, dates, or custom schema values.
// Annotation parsing intentionally accepts only strings and numbers.
export type SpreadsheetCell = unknown;
export type SpreadsheetRows = readonly (readonly SpreadsheetCell[])[];

export interface CountWorkbookData {
  readonly filename: string;
  readonly rows: SpreadsheetRows;
  readonly readError?: string;
}
