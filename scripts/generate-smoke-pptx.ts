import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { BuildSlideLayoutService } from "../src/application/services/BuildSlideLayoutService";
import { ParseImageSelectionService } from "../src/application/services/ParseImageSelectionService";
import { ValidateImageMatrixService } from "../src/application/services/ValidateImageMatrixService";
import { DEFAULT_PRESENTATION_CONFIG } from "../src/domain/models/PresentationConfig";
import type { InputFile } from "../src/domain/models/InputFile";
import { PptxGenJsPresentationGenerator } from "../src/infrastructure/presentation/PptxGenJsPresentationGenerator";
import { CircularImageBuilder } from "../src/infrastructure/presentation/builders/CircularImageBuilder";
import { ImageMatrixSlideBuilder } from "../src/infrastructure/presentation/builders/ImageMatrixSlideBuilder";

const inputRoot = path.resolve("InputData");
const outputPath = path.resolve("smoke-output.pptx");

async function loadSampleFiles(): Promise<readonly InputFile[]> {
  const datasets = (await readdir(inputRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory());
  const files: InputFile[] = [];

  for (const dataset of datasets) {
    const datasetPath = path.join(inputRoot, dataset.name);
    const names = (await readdir(datasetPath)).filter((name) => /\.jpe?g$/i.test(name));
    for (const name of names) {
      const bytes = await readFile(path.join(datasetPath, name));
      const relativePath = `InputData/${dataset.name}/${name}`;
      files.push({
        id: relativePath,
        name,
        relativePath,
        mimeType: "image/jpeg",
        size: bytes.byteLength,
        content: `data:image/jpeg;base64,${bytes.toString("base64")}`,
      });
    }
  }
  return files;
}

const parsed = new ParseImageSelectionService().execute(await loadSampleFiles());
const selection = new ValidateImageMatrixService().execute(parsed);
const errors = selection.issues.filter((issue) => issue.severity === "error");
if (errors.length > 0) {
  throw new Error(`Smoke input failed validation with ${errors.length} errors.`);
}

const layout = new BuildSlideLayoutService().execute({
  selection,
  config: DEFAULT_PRESENTATION_CONFIG,
  labels: Object.fromEntries(selection.datasets.map((dataset) => [dataset, dataset])),
});
const generator = new PptxGenJsPresentationGenerator(
  new ImageMatrixSlideBuilder(new CircularImageBuilder()),
);
const presentation = await generator.generate(layout.slides, DEFAULT_PRESENTATION_CONFIG);
await writeFile(outputPath, presentation.bytes);

console.info(
  `Generated ${path.basename(outputPath)} with ${layout.slides.length} slides and ${selection.images.length} images.`,
);
