import { useCallback, useMemo, useState } from "react";
import type { PresentationController } from "../../application/controllers/PresentationController";
import { ApplicationError } from "../../domain/errors/ApplicationError";
import {
  DEFAULT_PRESENTATION_CONFIG,
  type PresentationConfig,
} from "../../domain/models/PresentationConfig";
import {
  hasBlockingIssues,
  type PreparedImageSelection,
} from "../../domain/models/PreparedImageSelection";
import type { PresentationResult } from "../../domain/models/PresentationResult";
import type { SlideLayoutResult } from "../../domain/models/SlideDefinition";
import type { BrowserFileSource } from "../../infrastructure/files/BrowserFileSource";

interface PreviewState {
  readonly layout: SlideLayoutResult;
  readonly error: string | null;
}

const emptyLayout: SlideLayoutResult = {
  slides: [],
  actualDiameter: 0,
  imagesPerRow: 0,
  rowsPerSlide: 0,
};

function messageFrom(error: unknown): string {
  if (error instanceof ApplicationError || error instanceof Error) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

export function usePresentationGenerator(
  controller: PresentationController<BrowserFileSource>,
) {
  const [selection, setSelection] = useState<PreparedImageSelection | null>(null);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [config, setConfig] = useState<PresentationConfig>(DEFAULT_PRESENTATION_CONFIG);
  const [filename, setFilename] = useState("cytation-images.pptx");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PresentationResult | null>(null);

  const previewState = useMemo<PreviewState>(() => {
    if (!selection || hasBlockingIssues(selection)) {
      return { layout: emptyLayout, error: null };
    }
    try {
      return { layout: controller.buildPreview(selection, config, labels), error: null };
    } catch (previewError) {
      return { layout: emptyLayout, error: messageFrom(previewError) };
    }
  }, [config, controller, labels, selection]);

  const editableRows = useMemo(
    () => (selection ? controller.getEditableRows(selection, config.orientation) : []),
    [config.orientation, controller, selection],
  );

  const loadSources = useCallback(
    async (sources: readonly BrowserFileSource[]) => {
      setIsLoading(true);
      setError(null);
      setResult(null);
      try {
        const prepared = await controller.prepare(sources);
        setSelection(prepared);
        setLabels({});
      } catch (loadError) {
        setSelection(null);
        setError(messageFrom(loadError));
      } finally {
        setIsLoading(false);
      }
    },
    [controller],
  );

  const updateConfig = useCallback(
    <K extends keyof PresentationConfig>(key: K, value: PresentationConfig[K]) => {
      setConfig((current) => ({ ...current, [key]: value }));
      setResult(null);
    },
    [],
  );

  const updateLabel = useCallback((datasetName: string, label: string) => {
    setLabels((current) => ({ ...current, [datasetName]: label }));
    setResult(null);
  }, []);

  const generate = useCallback(async () => {
    if (!selection || hasBlockingIssues(selection) || previewState.layout.slides.length === 0) {
      setError("Select and validate an image folder before generating the PowerPoint file.");
      return;
    }
    setIsGenerating(true);
    setError(null);
    setResult(null);
    try {
      setResult(await controller.generate(previewState.layout.slides, config, filename));
    } catch (generationError) {
      setError(messageFrom(generationError));
    } finally {
      setIsGenerating(false);
    }
  }, [config, controller, filename, previewState.layout.slides, selection]);

  return {
    selection,
    labels,
    config,
    filename,
    isLoading,
    isGenerating,
    error: error ?? previewState.error,
    result,
    layout: previewState.layout,
    editableRows,
    hasBlockingIssues: selection ? hasBlockingIssues(selection) : false,
    loadSources,
    updateConfig,
    updateLabel,
    setFilename,
    generate,
  };
}
