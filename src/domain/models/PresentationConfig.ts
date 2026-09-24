export type MatrixOrientation = "horizontal" | "vertical";

export interface PresentationConfig {
  readonly orientation: MatrixOrientation;
  readonly firstSlideHeading: string;
  readonly slideWidth: number;
  readonly slideHeight: number;
  readonly preferredDiameter: number;
  readonly maxRowsPerSlide: number;
  readonly horizontalGap: number;
  readonly verticalGap: number;
  readonly marginTop: number;
  readonly marginRight: number;
  readonly marginBottom: number;
  readonly marginLeft: number;
  readonly labelWidth: number;
  readonly labelFontSize: number;
}

export const DEFAULT_PRESENTATION_CONFIG: PresentationConfig = {
  orientation: "horizontal",
  firstSlideHeading: "",
  slideWidth: 10,
  slideHeight: 7.5,
  preferredDiameter: 2.1,
  maxRowsPerSlide: 3,
  horizontalGap: 0.08,
  verticalGap: 0.18,
  marginTop: 0.35,
  marginRight: 0.35,
  marginBottom: 0.35,
  marginLeft: 0.35,
  labelWidth: 0.75,
  labelFontSize: 14,
};
