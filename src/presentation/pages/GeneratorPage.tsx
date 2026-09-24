import { useState } from "react";
import { presentationController } from "../../app/dependencies";
import { ErrorMessage } from "../components/ErrorMessage";
import { FileList } from "../components/FileList";
import { FileSelector } from "../components/FileSelector";
import { GenerateButton } from "../components/GenerateButton";
import { PresentationForm } from "../components/PresentationForm";
import { SlidePreview } from "../components/SlidePreview";
import { ValidationDialog } from "../components/ValidationDialog";
import { usePresentationGenerator } from "../hooks/usePresentationGenerator";
import type { PresentationController } from "../../application/controllers/PresentationController";
import type { BrowserFileSource } from "../../infrastructure/files/BrowserFileSource";

interface GeneratorPageProps {
  readonly controller?: PresentationController<BrowserFileSource>;
}

export function GeneratorPage({ controller = presentationController }: GeneratorPageProps) {
  const generator = usePresentationGenerator(controller);
  const [validationDialogDismissed, setValidationDialogDismissed] = useState(false);

  const loadSources: typeof generator.loadSources = async (sources) => {
    setValidationDialogDismissed(false);
    await generator.loadSources(sources);
  };

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
        <section className="hero">
          <p className="eyebrow">Image matrix to presentation</p>
          <h1>Turn experiment images into organized slides.</h1>
          <p>
            Select images or folders, verify the detected ordering, and export a PowerPoint presentation without
            uploading your files.
          </p>
        </section>

        <div className="workspace">
          <div className="controls-column">
            <FileSelector isLoading={generator.isLoading} onSelect={loadSources} />
            {generator.error && <ErrorMessage message={generator.error} />}
            {generator.selection && !generator.hasBlockingIssues && (
              <>
                <FileList selection={generator.selection} />
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
              </>
            )}
          </div>

          <div className="preview-column">
            {generator.selection && !generator.hasBlockingIssues ? (
              <>
                <SlidePreview layout={generator.layout} config={generator.config} />
                <div className="generation-bar">
                  <div>
                    <strong>Ready to export</strong>
                    <span>
                      {generator.layout.slides.length} slides · {generator.selection.images.length} images
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
                <div className="empty-preview-art" aria-hidden="true">
                  <span /><span /><span /><span /><span /><span />
                </div>
                <h2>Your slide preview will appear here</h2>
                <p>Select a complete image folder to validate its coordinates and build the preview.</p>
              </section>
            )}
          </div>
        </div>
      </main>

      {generator.selection && generator.hasBlockingIssues && !validationDialogDismissed && (
        <ValidationDialog
          issues={generator.selection.issues}
          onClose={() => setValidationDialogDismissed(true)}
        />
      )}
    </div>
  );
}
