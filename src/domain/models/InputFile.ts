export interface InputFile {
  readonly id: string;
  readonly name: string;
  readonly relativePath: string;
  readonly mimeType: string;
  readonly size: number;
  readonly content: string | null;
}

export function datasetNameFromPath(relativePath: string): string {
  const parts = relativePath.replaceAll("\\", "/").split("/").filter(Boolean);
  return parts.length > 1 ? parts.at(-2) ?? "Images" : "Images";
}
