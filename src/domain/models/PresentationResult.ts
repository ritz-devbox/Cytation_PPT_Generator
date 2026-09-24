export interface PresentationResult {
  readonly filename: string;
  readonly slideCount: number;
  readonly imageCount: number;
  readonly saveMethod: "picker" | "download";
}

export interface GeneratedPresentationFile {
  readonly bytes: Uint8Array;
  readonly mimeType: string;
}
