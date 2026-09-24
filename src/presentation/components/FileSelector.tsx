import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  browserFileSource,
  type BrowserFileSource,
} from "../../infrastructure/files/BrowserFileSource";
import { collectDroppedFiles } from "../../infrastructure/files/collectDroppedFiles";

interface FileSelectorProps {
  readonly isLoading: boolean;
  readonly onSelect: (sources: readonly BrowserFileSource[]) => Promise<void>;
}

export function FileSelector({ isLoading, onSelect }: FileSelectorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const sources = Array.from(event.target.files ?? []).map((file) => browserFileSource(file));
    event.target.value = "";
    if (sources.length > 0) {
      await onSelect(sources);
    }
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const sources = await collectDroppedFiles(event.dataTransfer);
    if (sources.length > 0) {
      await onSelect(sources);
    }
  };

  return (
    <section className="panel file-selector" aria-labelledby="select-files-title">
      <div>
        <p className="eyebrow">Step 1</p>
        <h2 id="select-files-title">Choose your image folder</h2>
        <p className="supporting-text">
          Files stay on this computer. Folder names become the default row labels.
        </p>
      </div>
      <div
        className={`drop-zone${isDragging ? " is-dragging" : ""}`}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <span className="drop-icon" aria-hidden="true">+</span>
        <strong>{isLoading ? "Reading images…" : "Drop a folder or JPG images here"}</strong>
        <span>or</span>
        <button
          className="button button-secondary"
          type="button"
          disabled={isLoading}
          onClick={() => inputRef.current?.click()}
        >
          Select folder
        </button>
        <input
          ref={inputRef}
          className="visually-hidden"
          aria-label="Folder picker"
          type="file"
          accept=".jpg,.jpeg,image/jpeg"
          multiple
          onChange={handleChange}
          {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
        />
      </div>
    </section>
  );
}
