import { useState } from "react";
import { presentationController } from "../../app/dependencies";
import type { PresentationController } from "../../application/controllers/PresentationController";
import type { BrowserFileSource } from "../../infrastructure/files/BrowserFileSource";
import { ErrorMessage } from "../components/ErrorMessage";
import { FileList } from "../components/FileList";
import { FileSelector } from "../components/FileSelector";
import { GenerateButton } from "../components/GenerateButton";
import { PresentationForm } from "../components/PresentationForm";
import { SlidePreview } from "../components/SlidePreview";
import { ValidationDialog } from "../components/ValidationDialog";
import { usePresentationGenerator } from "../hooks/usePresentationGenerator";

interface GeneratorPageProps {
  readonly controller?: PresentationController<BrowserFileSource>;
}

type GeneratorPageStep = "upload" | "preview";

// Edit this text to update the copyright notice shown at the bottom of both pages.
const COPYRIGHT_NOTICE = "© 2026 Cytation PowerPoint Generator";

export function GeneratorPage({ controller = presentationController }: GeneratorPageProps) {
  const generator = usePresentationGenerator(controller);
  const [validationDialogDismissed, setValidationDialogDismissed] = useState(false);
  const [currentStep, setCurrentStep] = useState<GeneratorPageStep>("upload");

  const loadSources: typeof generator.loadSources = async (sources) => {
    setCurrentStep("upload");
    setValidationDialogDismissed(false);
    await generator.loadSources(sources);
  };

  const removeDatasets: typeof generator.removeDatasets = async (datasetNames) => {
    setValidationDialogDismissed(false);
    await generator.removeDatasets(datasetNames);
  };

  const hasValidSelection = Boolean(generator.selection && !generator.hasBlockingIssues);
  const canContinue = hasValidSelection && generator.layout.slides.length > 0;
  const showPreviewPage = currentStep === "preview" && hasValidSelection;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-mark" aria-hidden="true"><span /></div>
        <div>
          <p className="brand-name">Cytation</p>
          <p>PowerPoint Generator</p>
        </div>
        <span className="privacy-badge">Oncology Tool</span>
      </header>

      <main>
        <nav className="step-navigation" aria-label="Generator progress">
          <ol>
            <li className={showPreviewPage ? "is-complete" : "is-current"}>
              <span>1</span>
              <div><strong>Load images</strong><small>Select and validate files</small></div>
            </li>
            <li className={showPreviewPage ? "is-current" : ""}>
              <span>2</span>
              <div><strong>Preview &amp; export</strong><small>Adjust the layout and generate</small></div>
            </li>
          </ol>
        </nav>

        {!showPreviewPage ? (
          <div className="page-view upload-page">
            <section className="hero">
              <p className="eyebrow">Image matrix to presentation</p>
              <h1>Load and validate your experiment images.</h1>
              <p>
                Select images or folders and verify the detected datasets before moving to the slide preview.
                Your files stay on this computer.
              </p>
            </section>

            <div className="upload-workspace">
              <FileSelector
                isLoading={generator.isLoading}
                hasSelection={Boolean(generator.selection) || generator.stagedWorkbookCount > 0}
                onSelect={loadSources}
              />
              {generator.stagedWorkbookCount > 0 && !generator.selection && (
                <div className="message info-message" role="status">
                  <span aria-hidden="true">✓</span>
                  <p>
                    <strong>{generator.selectedWorkbookNames.join(", ")}</strong>
                    <br />
                    {generator.stagedWorkbookCount === 1
                      ? "Excel workbook selected. Add JPG images or a folder to continue."
                      : `${generator.stagedWorkbookCount} Excel workbooks selected. Add JPG images or folders to continue.`}
                  </p>
                </div>
              )}
              {generator.error && <ErrorMessage message={generator.error} />}
              {generator.selection && (
                <>
                  <FileList
                    selection={generator.selection}
                    workbookNames={generator.selectedWorkbookNames}
                    isUpdating={generator.isLoading}
                    onRemoveDatasets={removeDatasets}
                  />
                  {!generator.hasBlockingIssues && (
                    <div className="continue-bar">
                      <div>
                        <strong>Images validated</strong>
                        <span>
                          {generator.selection.images.length} images across {generator.selection.datasets.length} folders
                        </span>
                      </div>
                      <button
                        className="button button-primary"
                        type="button"
                        disabled={!canContinue}
                        onClick={() => setCurrentStep("preview")}
                      >
                        Continue to preview
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="page-view preview-page">
            <section className="preview-page-heading">
              <div>
                <p className="eyebrow">Preview &amp; export</p>
                <h1>Review your image matrix.</h1>
                <p>Adjust row labels and layout settings, then generate the PowerPoint file.</p>
              </div>
              <button
                className="button button-secondary"
                type="button"
                onClick={() => setCurrentStep("upload")}
              >
                Back to file selection
              </button>
            </section>

            <div className="workspace">
              <div className="controls-column">
                {generator.error && <ErrorMessage message={generator.error} />}
                {generator.selection && (
                  <FileList
                    selection={generator.selection}
                    workbookNames={generator.selectedWorkbookNames}
                  />
                )}
                <PresentationForm
                  editableRows={generator.editableRows}
                  labels={generator.labels}
                  config={generator.config}
                  filename={generator.filename}
                  actualDiameter={generator.layout.actualDiameter}
                  onLabelChange={generator.updateLabel}
                  onConfigChange={generator.updateConfig}
                  onFilenameChange={generator.setFilename}
                />
              </div>

              <div className="preview-column">
                {generator.layout.slides.length > 0 ? (
                  <>
                    <SlidePreview layout={generator.layout} config={generator.config} />
                    <div className="generation-bar">
                      <div>
                        <strong>Ready to export</strong>
                        <span>
                          {generator.layout.slides.length} slides · {generator.selection?.images.length ?? 0} images
                        </span>
                      </div>
                      <GenerateButton
                        disabled={generator.layout.slides.length === 0}
                        isGenerating={generator.isGenerating}
                        onClick={generator.generate}
                      />
                    </div>
                    {generator.result && (
                      <div className="message success-message" role="status">
                        Saved {generator.result.filename} with {generator.result.slideCount} slides.
                      </div>
                    )}
                  </>
                ) : (
                  <section className="empty-preview">
                    <h2>Preview unavailable</h2>
                    <p>Review the layout settings or return to file selection and load the images again.</p>
                  </section>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <span>{COPYRIGHT_NOTICE}</span>
      </footer>

      {generator.selection && generator.hasBlockingIssues && !validationDialogDismissed && (
        <ValidationDialog
          issues={generator.selection.issues}
          onClose={() => setValidationDialogDismissed(true)}
        />
      )}
    </div>
  );
}
