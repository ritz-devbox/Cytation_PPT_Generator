import { describe, expect, it } from "vitest";
import type { IFileSaver } from "../../src/application/contracts/IFileSaver";
import type { ILogger } from "../../src/application/contracts/ILogger";
import type { IPresentationGenerator } from "../../src/application/contracts/IPresentationGenerator";
import { GeneratePresentationService } from "../../src/application/services/GeneratePresentationService";
import { DEFAULT_PRESENTATION_CONFIG } from "../../src/domain/models/PresentationConfig";
import type { GeneratedPresentationFile } from "../../src/domain/models/PresentationResult";
import type { SlideDefinition } from "../../src/domain/models/SlideDefinition";

class FakeGenerator implements IPresentationGenerator {
  public calls = 0;
  public async generate(): Promise<GeneratedPresentationFile> {
    this.calls += 1;
    return { bytes: new Uint8Array([1, 2, 3]), mimeType: "test/pptx" };
  }
}

class FakeSaver implements IFileSaver {
  public savedFilename: string | null = null;
  public async save(_file: GeneratedPresentationFile, filename: string): Promise<"picker"> {
    this.savedFilename = filename;
    return "picker";
  }
}

class FakeLogger implements ILogger {
  public info(): void {}
  public error(): void {}
}

const slide: SlideDefinition = {
  number: 1,
  rows: [{
    key: "B:0gy",
    datasetName: "0gy",
    label: "0gy",
    labelX: 0,
    labelY: 0,
    labelWidth: 1,
    height: 1,
    cells: [],
  }],
};

describe("GeneratePresentationService", () => {
  it("generates and saves a normalized PowerPoint filename", async () => {
    const generator = new FakeGenerator();
    const saver = new FakeSaver();
    const service = new GeneratePresentationService(generator, saver, new FakeLogger());

    const result = await service.execute({
      slides: [slide],
      config: DEFAULT_PRESENTATION_CONFIG,
      filename: "Experiment 01",
    });

    expect(generator.calls).toBe(1);
    expect(saver.savedFilename).toBe("Experiment 01.pptx");
    expect(result).toMatchObject({ filename: "Experiment 01.pptx", slideCount: 1, saveMethod: "picker" });
  });

  it("rejects generation when there are no slides", async () => {
    const service = new GeneratePresentationService(new FakeGenerator(), new FakeSaver(), new FakeLogger());

    await expect(
      service.execute({ slides: [], config: DEFAULT_PRESENTATION_CONFIG, filename: "empty" }),
    ).rejects.toThrow("There are no validated images");
  });
});
