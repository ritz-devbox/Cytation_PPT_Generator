import type { ImageCoordinate } from "./ImageCoordinate";
import type { InputFile } from "./InputFile";

export interface ParsedImage {
  readonly datasetName: string;
  readonly coordinate: ImageCoordinate;
  readonly file: InputFile;
  readonly annotation?: string;
}
