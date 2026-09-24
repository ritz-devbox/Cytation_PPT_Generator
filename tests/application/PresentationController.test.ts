import { describe, expect, it } from "vitest";
import { PresentationController } from "../../src/application/controllers/PresentationController";
import type { IFileReader } from "../../src/application/contracts/IFileReader";
import type { InputFile } from "../../src/domain/models/InputFile";
import { BuildSlideLayoutService } from "../../src/application/services/BuildSlideLayoutService";
import { ParseImageSelectionService } from "../../src/application/services/ParseImageSelectionService";
import { ValidateImageMatrixService } from "../../src/application/services/ValidateImageMatrixService";
import { inputFile } from "../helpers/files";

class FakeReader implements IFileReader<string> {
  public constructor(private readonly files: readonly InputFile[]) {}
  public async readFiles(): Promise<readonly InputFile[]> { return this.files; }
}

describe("PresentationController", () => {
  it("coordinates reading, parsing, and validation without generation logic", async () => {
    const controller = new PresentationController(
      new FakeReader([inputFile("0gy", "B2")]),
      new ParseImageSelectionService(),
      new ValidateImageMatrixService(),
      new BuildSlideLayoutService(),
      { execute: async () => ({ filename: "x.pptx", slideCount: 1, imageCount: 1, saveMethod: "download" }) },
    );

    const result = await controller.prepare(["source"]);

    expect(result.datasets).toEqual(["0gy"]);
    expect(result.images[0].coordinate).toEqual({ row: "B", column: 2 });
  });
});
