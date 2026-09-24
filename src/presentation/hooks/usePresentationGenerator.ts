import { useCallback, useMemo, useRef, useState } from "react";
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
import { datasetNameFromPath } from "../../domain/models/InputFile";
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

function sourceKey(source: BrowserFileSource): string {
  return source.relativePath.replaceAll("\\", "/").toLocaleLowerCase();
}

function isImageSource(source: BrowserFileSource): boolean {
  return /\.(?:jpe?g)$/i.test(source.file.name);
}

function isWorkbookSource(source: BrowserFileSource): boolean {
  return /\.xlsx$/i.test(source.file.name);
}

function workbookNamesFrom(sources: readonly BrowserFileSource[]): readonly string[] {
  return sources.filter(isWorkbookSource).map((source) => source.file.name);
}

function mergeSources(
  current: readonly BrowserFileSource[],
  additions: readonly BrowserFileSource[],
): readonly BrowserFileSource[] {
  const merged = new Map(current.map((source) => [sourceKey(source), source]));
  additions.forEach((source) => merged.set(sourceKey(source), source));
  return [...merged.values()];
}

export function usePresentationGenerator(
  controller: PresentationController<BrowserFileSource>,
) {
  const loadedSources = useRef<readonly BrowserFileSource[]>([]);
  const [selection, setSelection] = useState<PreparedImageSelection | null>(null);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [config, setConfig] = useState<PresentationConfig>(DEFAULT_PRESENTATION_CONFIG);
  const [filename, setFilename] = useState("cytation-images.pptx");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [stagedWorkbookCount, setStagedWorkbookCount] = useState(0);
  const [selectedWorkbookNames, setSelectedWorkbookNames] = useState<readonly string[]>([]);
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

  const prepareSources = useCallback(
    async (sources: readonly BrowserFileSource[]): Promise<PreparedImageSelection | null> => {
      if (sources.length === 0) {
        loadedSources.current = [];
        setSelection(null);
        setLabels({});
        setStagedWorkbookCount(0);
        setSelectedWorkbookNames([]);
        setError(null);
        setResult(null);
        return null;
      }

      const workbookCount = sources.filter(isWorkbookSource).length;
      if (!sources.some(isImageSource) && workbookCount > 0) {
        loadedSources.current = sources;
        setSelection(null);
        setLabels({});
        setStagedWorkbookCount(workbookCount);
        setSelectedWorkbookNames(workbookNamesFrom(sources));
        setError(null);
        setResult(null);
        return null;
      }

      setIsLoading(true);
      setStagedWorkbookCount(0);
      setError(null);
      setResult(null);
      try {
        const prepared = await controller.prepare(sources);
        loadedSources.current = sources;
        setSelection(prepared);
        setSelectedWorkbookNames(workbookNamesFrom(sources));
        return prepared;
      } catch (loadError) {
        setError(messageFrom(loadError));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [controller],
  );

  const loadSources = useCallback(
    async (sources: readonly BrowserFileSource[]) => {
      await prepareSources(mergeSources(loadedSources.current, sources));
    },
    [prepareSources],
  );

  const removeDatasets = useCallback(
    async (datasetNames: readonly string[]) => {
      const datasetsToRemove = new Set(datasetNames);
      const remainingSources = loadedSources.current.filter(
        (source) => !datasetsToRemove.has(datasetNameFromPath(source.relativePath)),
      );
      if (remainingSources.length === loadedSources.current.length) {
        return;
      }

      const prepared = await prepareSources(
        remainingSources.some(isImageSource) ? remainingSources : [],
      );
      if (prepared) {
        const remainingDatasets = new Set(prepared.datasets);
        setLabels((current) =>
          Object.fromEntries(
            Object.entries(current).filter(([key]) =>
              [...remainingDatasets].some((datasetName) => key.endsWith(`:${datasetName}`)),
            ),
          ),
        );
      }
    },
    [prepareSources],
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
    stagedWorkbookCount,
    selectedWorkbookNames,
    error: error ?? previewState.error,
    result,
    layout: previewState.layout,
    editableRows,
    hasBlockingIssues: selection ? hasBlockingIssues(selection) : false,
    loadSources,
    removeDatasets,
    updateConfig,
    updateLabel,
    setFilename,
    generate,
  };
}
