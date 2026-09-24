export interface InputFile {
  readonly id: string;
  readonly name: string;
  readonly relativePath: string;
  readonly mimeType: string;
  readonly size: number;
  readonly content: string | null;
}
