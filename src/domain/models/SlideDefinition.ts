import type { ParsedImage } from "./ParsedImage";

export interface PositionedSlideCell {
  readonly image: ParsedImage;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly annotation?: string;
}

export interface PositionedSlideRow {
  readonly key: string;
  readonly datasetName: string;
  readonly label: string;
  readonly labelX: number;
  readonly labelY: number;
  readonly labelWidth: number;
  readonly height: number;
  readonly cells: readonly PositionedSlideCell[];
}

export interface SlideDefinition {
  readonly number: number;
  readonly rows: readonly PositionedSlideRow[];
}

export interface SlideLayoutResult {
  readonly slides: readonly SlideDefinition[];
  readonly actualDiameter: number;
  readonly imagesPerRow: number;
  readonly rowsPerSlide: number;
}
