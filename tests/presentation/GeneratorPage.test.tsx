import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { PresentationController } from "../../src/application/controllers/PresentationController";
import { BuildSlideLayoutService } from "../../src/application/services/BuildSlideLayoutService";
import { ParseImageSelectionService } from "../../src/application/services/ParseImageSelectionService";
import { ValidateImageMatrixService } from "../../src/application/services/ValidateImageMatrixService";
import type { PresentationConfig } from "../../src/domain/models/PresentationConfig";
import type { PreparedImageSelection } from "../../src/domain/models/PreparedImageSelection";
import type { SlideLayoutResult } from "../../src/domain/models/SlideDefinition";
import type { BrowserFileSource } from "../../src/infrastructure/files/BrowserFileSource";
import { GeneratorPage } from "../../src/presentation/pages/GeneratorPage";
import { inputFile } from "../helpers/files";

function preparedSelection(): PreparedImageSelection {
  return new ValidateImageMatrixService().execute(
    new ParseImageSelectionService().execute([
      inputFile("0gy", "B2"),
      inputFile("0gy", "B3"),
      inputFile("2gy", "B2"),
      inputFile("2gy", "B3"),
      inputFile("0gy", "C2"),
      inputFile("0gy", "C3"),
      inputFile("2gy", "C2"),
      inputFile("2gy", "C3"),
    ]),
  );
}

function controllerFake() {
  const selection = preparedSelection();
  const validator = new ValidateImageMatrixService();
  const layoutBuilder = new BuildSlideLayoutService();
  const generate = vi.fn(async () => ({
    filename: "cytation-images.pptx",
    slideCount: 1,
    imageCount: 8,
    saveMethod: "download" as const,
  }));
  return {
    prepare: vi.fn(async (sources: readonly BrowserFileSource[]) => {
      const requestedDatasets = new Set(
        sources
          .map((source) => source.relativePath.replaceAll("\\", "/").split("/").at(-2))
          .filter((datasetName): datasetName is string => selection.datasets.includes(datasetName ?? "")),
      );
      if (requestedDatasets.size === 0) {
        return selection;
      }
      return validator.execute({
        images: selection.images.filter((image) => requestedDatasets.has(image.datasetName)),
        issues: [],
      });
    }),
    buildPreview: vi.fn(
      (current: PreparedImageSelection, config: PresentationConfig, labels: Readonly<Record<string, string>>): SlideLayoutResult =>
        layoutBuilder.execute({ selection: current, config, labels }),
    ),
    getEditableRows: vi.fn(
      (current: PreparedImageSelection, orientation: PresentationConfig["orientation"]) =>
        layoutBuilder.getEditableRows(current, orientation),
    ),
    generate,
  } as unknown as PresentationController<BrowserFileSource> & { generate: typeof generate };
}

function folderFile(datasetName: string): File {
  const file = new File(["image"], "Stitched_B2_1.jpg", { type: "image/jpeg" });
  Object.defineProperty(file, "webkitRelativePath", {
    configurable: true,
    value: `${datasetName}/${file.name}`,
  });
  return file;
}

describe("GeneratorPage", () => {
  it("stages an Excel workbook selected before the images", async () => {
    const controller = controllerFake();
    render(<GeneratorPage controller={controller} />);
    const workbook = new File(["workbook"], "counts.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const image = new File(["image"], "Stitched_B2_1.jpg", { type: "image/jpeg" });
    const filePicker = screen.getByLabelText("File picker");

    fireEvent.change(filePicker, { target: { files: [workbook] } });

    expect(
      await screen.findByText("Excel workbook selected. Add JPG images or a folder to continue."),
    ).toBeInTheDocument();
    expect(screen.getByText("counts.xlsx")).toBeInTheDocument();
    expect(screen.queryByText("The image matrix is incomplete")).not.toBeInTheDocument();
    expect(controller.prepare).not.toHaveBeenCalled();

    fireEvent.change(filePicker, { target: { files: [image] } });

    await waitFor(() => expect(controller.prepare).toHaveBeenCalledOnce());
    expect(controller.prepare).toHaveBeenCalledWith([
      expect.objectContaining({ file: workbook }),
      expect.objectContaining({ file: image }),
    ]);
    expect(await screen.findByText("Selected folders")).toBeInTheDocument();
    expect(screen.getByText("1 workbook")).toBeInTheDocument();
    expect(screen.getByText("counts.xlsx")).toBeInTheDocument();
  });

  it("loads and validates files before opening the preview and generating", async () => {
    const user = userEvent.setup();
    const controller = controllerFake();
    render(<GeneratorPage controller={controller} />);
    const file = new File(["image"], "Stitched_B2_1.jpg", { type: "image/jpeg" });

    expect(screen.getByText("Load and validate your experiment images.")).toBeInTheDocument();
    expect(screen.getByText("© 2026 Cytation PowerPoint Generator")).toBeInTheDocument();
    expect(screen.queryByText("Files are processed locally in your browser.")).not.toBeInTheDocument();
    expect(screen.queryByText("Review the slide preview")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("File picker"), { target: { files: [file] } });

    expect(await screen.findByText("Selected folders")).toBeInTheDocument();
    expect(screen.getByText("8 images")).toBeInTheDocument();
    expect(screen.queryByText("Review the slide preview")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Continue to preview" }));

    expect(screen.getByText("Review the slide preview")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to file selection" })).toBeInTheDocument();

    const rowsPerSlide = screen.getByLabelText("Rows per slide");
    expect(rowsPerSlide).toHaveValue(3);
    await user.clear(rowsPerSlide);
    await user.type(rowsPerSlide, "1");
    expect(await screen.findByText("4 slides")).toBeInTheDocument();

    const heading = screen.getByLabelText("First-slide heading");
    await user.type(heading, "Experiment counts");
    expect(await screen.findByText("Experiment counts")).toBeInTheDocument();

    expect(screen.getByText("B · 0gy")).toBeInTheDocument();
    expect(screen.getByText("C · 0gy")).toBeInTheDocument();
    const label = screen.getAllByDisplayValue("0gy")[0];
    await user.clear(label);
    await user.type(label, "Control");
    expect(await screen.findAllByText("Control")).not.toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Generate PowerPoint" }));
    await waitFor(() => expect(controller.generate).toHaveBeenCalledOnce());
    expect(await screen.findByText(/Saved cytation-images\.pptx/)).toBeInTheDocument();
  });

  it("returns to file selection without discarding the validated files", async () => {
    const user = userEvent.setup();
    const controller = controllerFake();
    render(<GeneratorPage controller={controller} />);
    const file = new File(["image"], "Stitched_B2_1.jpg", { type: "image/jpeg" });

    fireEvent.change(screen.getByLabelText("Folder picker"), { target: { files: [file] } });
    await user.click(await screen.findByRole("button", { name: "Continue to preview" }));
    await user.click(screen.getByRole("button", { name: "Back to file selection" }));

    expect(screen.getByLabelText("Folder picker")).toBeInTheDocument();
    expect(screen.getByLabelText("File picker")).toBeInTheDocument();
    expect(screen.getByText("Selected folders")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue to preview" })).toBeEnabled();
  });

  it("appends folders and removes only the folders selected by the user", async () => {
    const user = userEvent.setup();
    const controller = controllerFake();
    render(<GeneratorPage controller={controller} />);
    const folderPicker = screen.getByLabelText("Folder picker");

    fireEvent.change(folderPicker, { target: { files: [folderFile("0gy")] } });
    expect(await screen.findByText("Selected folders")).toBeInTheDocument();
    expect(screen.getByText("0gy")).toBeInTheDocument();
    expect(screen.queryByText("2gy")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add folder" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add files" })).toBeInTheDocument();

    fireEvent.change(folderPicker, { target: { files: [folderFile("2gy")] } });
    expect(await screen.findByText("2gy")).toBeInTheDocument();
    expect(screen.getByText("8 images")).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "Select 0gy for removal" }));
    await user.click(screen.getByRole("button", { name: "Remove selected" }));

    await waitFor(() => expect(screen.queryByText("0gy")).not.toBeInTheDocument());
    expect(screen.getByText("2gy")).toBeInTheDocument();
    expect(screen.getByText("4 images")).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "Select 2gy for removal" }));
    await user.click(screen.getByRole("button", { name: "Remove selected" }));

    await waitFor(() => expect(screen.queryByText("Selected folders")).not.toBeInTheDocument());
    expect(screen.getByText("Choose images or folders")).toBeInTheDocument();
  });
});
