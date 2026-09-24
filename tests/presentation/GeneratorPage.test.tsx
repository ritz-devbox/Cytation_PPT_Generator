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
  const layoutBuilder = new BuildSlideLayoutService();
  const generate = vi.fn(async () => ({
    filename: "cytation-images.pptx",
    slideCount: 1,
    imageCount: 8,
    saveMethod: "download" as const,
  }));
  return {
    prepare: vi.fn(async () => selection),
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

describe("GeneratorPage", () => {
  it("loads a folder, previews datasets, edits labels, and generates", async () => {
    const user = userEvent.setup();
    const controller = controllerFake();
    render(<GeneratorPage controller={controller} />);
    const file = new File(["image"], "Stitched_B2_1.jpg", { type: "image/jpeg" });

    fireEvent.change(screen.getByLabelText("Folder picker"), { target: { files: [file] } });

    expect(await screen.findByText("Selected datasets")).toBeInTheDocument();
    expect(screen.getByText("8 images")).toBeInTheDocument();
    expect(screen.getByText("Review the slide preview")).toBeInTheDocument();

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
});
