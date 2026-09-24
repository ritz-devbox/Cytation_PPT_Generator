import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  browserFileSource,
  type BrowserFileSource,
} from "../../infrastructure/files/BrowserFileSource";
import { collectDroppedFiles } from "../../infrastructure/files/collectDroppedFiles";

interface FileSelectorProps {
  readonly isLoading: boolean;
  readonly hasSelection?: boolean;
  readonly onSelect: (sources: readonly BrowserFileSource[]) => Promise<void>;
}

export function FileSelector({ isLoading, hasSelection = false, onSelect }: FileSelectorProps) {
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
        <p className="eyebrow">Upload</p>
        <h2 id="select-files-title">
          {hasSelection ? "Add more images or folders" : "Choose images or folders"}
        </h2>
        <p className="supporting-text">
          {hasSelection
            ? "Add individual files or complete folders. Files stay on this computer."
            : "Select individual JPG/XLSX files to inspect them in the file browser, or select a complete folder to preserve its name as the default row label."}
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
        <strong>
          {isLoading
            ? "Reading files…"
            : hasSelection
              ? "Drop another folder, JPG images, or XLSX file here"
              : "Drop folders, JPG images, and an XLSX file here"}
        </strong>
        <span>or</span>
        <div className="file-picker-actions">
          <button
            className="button button-primary"
            type="button"
            disabled={isLoading}
            onClick={() => fileInputRef.current?.click()}
          >
            {hasSelection ? "Add files" : "Select files"}
          </button>
          <button
            className="button button-secondary"
            type="button"
            disabled={isLoading}
            onClick={() => folderInputRef.current?.click()}
          >
            {hasSelection ? "Add folder" : "Select folder"}
          </button>
        </div>
        <input
          ref={fileInputRef}
          className="visually-hidden"
          aria-label="File picker"
          type="file"
          accept=".jpg,.jpeg,.xlsx,image/jpeg,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          multiple
          onChange={handleChange}
        />
        <input
          ref={folderInputRef}
          className="visually-hidden"
          aria-label="Folder picker"
          type="file"
          accept=".jpg,.jpeg,.xlsx,image/jpeg,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          multiple
          onChange={handleChange}
          {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
        />
      </div>
    </section>
  );
}
