import { ValidationError } from "../../domain/errors/ValidationError";
import { coordinateKey } from "../../domain/models/ImageCoordinate";
import type { ParsedImage } from "../../domain/models/ParsedImage";
import type { PreparedImageSelection } from "../../domain/models/PreparedImageSelection";
import type { PresentationConfig } from "../../domain/models/PresentationConfig";
import type {
  PositionedSlideRow,
  SlideDefinition,
  SlideLayoutResult,
} from "../../domain/models/SlideDefinition";

export interface BuildSlideLayoutRequest {
  readonly selection: PreparedImageSelection;
  readonly config: PresentationConfig;
  readonly labels: Readonly<Record<string, string>>;
}

export interface EditableRowLabel {
  readonly key: string;
  readonly datasetName: string;
  readonly coordinateGroup: string;
}

interface LogicalRow {
  readonly key: string;
  readonly datasetName: string;
  readonly images: readonly ParsedImage[];
}

export class BuildSlideLayoutService {
  public getEditableRows(
    selection: PreparedImageSelection,
    orientation: PresentationConfig["orientation"],
  ): readonly EditableRowLabel[] {
    const coordinateGroups =
      orientation === "horizontal"
        ? selection.coordinateRows
        : selection.coordinateColumns.map(String);
    return coordinateGroups.flatMap((coordinateGroup) =>
      selection.datasets.map((datasetName) => ({
        key: `${coordinateGroup}:${datasetName}`,
        datasetName,
        coordinateGroup,
      })),
    );
  }

  public execute(request: BuildSlideLayoutRequest): SlideLayoutResult {
    const { selection, config, labels } = request;
    this.validateConfig(config);

    const logicalRows = this.createLogicalRows(selection, config);
    if (logicalRows.length === 0) {
      return { slides: [], actualDiameter: 0, imagesPerRow: 0, rowsPerSlide: 0 };
    }

    const imagesPerRow = Math.max(...logicalRows.map((row) => row.images.length));
    const availableWidth =
      config.slideWidth - config.marginLeft - config.marginRight - config.labelWidth;
    const diameterThatFits =
      (availableWidth - config.horizontalGap * Math.max(0, imagesPerRow - 1)) / imagesPerRow;
    const actualDiameter = Math.min(config.preferredDiameter, diameterThatFits);
    if (actualDiameter <= 0) {
      throw new ValidationError("The slide is too narrow for the selected images and spacing.");
    }

    const availableHeight = config.slideHeight - config.marginTop - config.marginBottom;
    const rowsPerSlide = Math.max(
      1,
      Math.floor((availableHeight + config.verticalGap) / (actualDiameter + config.verticalGap)),
    );
    const slides: SlideDefinition[] = [];

    for (let start = 0; start < logicalRows.length; start += rowsPerSlide) {
      const slideRows = logicalRows.slice(start, start + rowsPerSlide).map((row, rowIndex) =>
        this.positionRow(row, rowIndex, actualDiameter, config, labels),
      );
      slides.push({ number: slides.length + 1, rows: slideRows });
    }

    return { slides, actualDiameter, imagesPerRow, rowsPerSlide };
  }

  private createLogicalRows(
    selection: PreparedImageSelection,
    config: PresentationConfig,
  ): readonly LogicalRow[] {
    const byDatasetAndCoordinate = new Map<string, ParsedImage>();
    for (const image of selection.images) {
      byDatasetAndCoordinate.set(`${image.datasetName}:${coordinateKey(image.coordinate)}`, image);
    }

    const rows: LogicalRow[] = [];
    if (config.orientation === "horizontal") {
      for (const coordinateRow of selection.coordinateRows) {
        for (const datasetName of selection.datasets) {
          const images = selection.coordinateColumns
            .map((column) => byDatasetAndCoordinate.get(`${datasetName}:${coordinateRow}${column}`))
            .filter((image): image is ParsedImage => Boolean(image));
          rows.push({ key: `${coordinateRow}:${datasetName}`, datasetName, images });
        }
      }
    } else {
      for (const coordinateColumn of selection.coordinateColumns) {
        for (const datasetName of selection.datasets) {
          const images = selection.coordinateRows
            .map((row) => byDatasetAndCoordinate.get(`${datasetName}:${row}${coordinateColumn}`))
            .filter((image): image is ParsedImage => Boolean(image));
          rows.push({ key: `${coordinateColumn}:${datasetName}`, datasetName, images });
        }
      }
    }
    return rows;
  }

  private positionRow(
    row: LogicalRow,
    rowIndex: number,
    diameter: number,
    config: PresentationConfig,
    labels: Readonly<Record<string, string>>,
  ): PositionedSlideRow {
    const y = config.marginTop + rowIndex * (diameter + config.verticalGap);
    const firstImageX = config.marginLeft + config.labelWidth;
    return {
      key: row.key,
      datasetName: row.datasetName,
      label: labels[row.key]?.trim() || row.datasetName,
      labelX: config.marginLeft,
      labelY: y,
      labelWidth: Math.max(0.1, config.labelWidth - config.horizontalGap),
      height: diameter,
      cells: row.images.map((image, columnIndex) => ({
        image,
        x: firstImageX + columnIndex * (diameter + config.horizontalGap),
        y,
        width: diameter,
        height: diameter,
        annotation: image.annotation,
      })),
    };
  }

  private validateConfig(config: PresentationConfig): void {
    const positiveValues = [
      config.slideWidth,
      config.slideHeight,
      config.preferredDiameter,
      config.labelWidth,
      config.labelFontSize,
    ];
    if (positiveValues.some((value) => !Number.isFinite(value) || value <= 0)) {
      throw new ValidationError("Slide dimensions, image size, and label size must be positive numbers.");
    }
    if (config.horizontalGap < 0 || config.verticalGap < 0) {
      throw new ValidationError("Image spacing cannot be negative.");
    }
  }
}
