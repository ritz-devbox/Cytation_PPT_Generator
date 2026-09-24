import { useState } from "react";
import type { PreparedImageSelection } from "../../domain/models/PreparedImageSelection";

interface FileListProps {
  readonly selection: PreparedImageSelection;
  readonly workbookNames?: readonly string[];
  readonly isUpdating?: boolean;
  readonly onRemoveDatasets?: (datasetNames: readonly string[]) => Promise<void>;
}

export function FileList({
  selection,
  workbookNames = [],
  isUpdating = false,
  onRemoveDatasets,
}: FileListProps) {
  const [selectedDatasets, setSelectedDatasets] = useState<ReadonlySet<string>>(new Set());
  const availableDatasets = new Set(selection.datasets);
  const activeSelectedDatasets = new Set(
    [...selectedDatasets].filter((datasetName) => availableDatasets.has(datasetName)),
  );
  const warnings = selection.issues.filter((issue) => issue.severity === "warning");

  const toggleDataset = (datasetName: string) => {
    setSelectedDatasets((current) => {
      const next = new Set(current);
      if (next.has(datasetName)) {
        next.delete(datasetName);
      } else {
        next.add(datasetName);
      }
      return next;
    });
  };

  const removeSelected = async () => {
    if (!onRemoveDatasets || activeSelectedDatasets.size === 0) {
      return;
    }
    await onRemoveDatasets([...activeSelectedDatasets]);
    setSelectedDatasets(new Set());
  };

  return (
    <section className="panel compact-panel" aria-labelledby="selected-files-title">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Validated input</p>
          <h2 id="selected-files-title">Selected folders</h2>
        </div>
        <div className="input-statuses">
          <span className="status-chip success">{selection.images.length} images</span>
          {workbookNames.length > 0 && (
            <span className="status-chip workbook">
              {workbookNames.length} workbook{workbookNames.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>
      {workbookNames.length > 0 && (
        <div className="workbook-list" aria-label="Selected Excel workbooks">
          <strong>Excel {workbookNames.length === 1 ? "workbook" : "workbooks"}</strong>
          <ul>
            {workbookNames.map((workbookName) => (
              <li key={workbookName}>{workbookName}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="dataset-list">
        {selection.datasets.map((datasetName, datasetIndex) => {
          const images = selection.images.filter((image) => image.datasetName === datasetName);
          return (
            <div
              className={`dataset-entry${onRemoveDatasets ? " is-selectable" : ""}`}
              key={datasetName}
            >
              {onRemoveDatasets && (
                <label className="dataset-selector">
                  <input
                    type="checkbox"
                    aria-label={`Select ${datasetName} for removal`}
                    checked={activeSelectedDatasets.has(datasetName)}
                    disabled={isUpdating}
                    onChange={() => toggleDataset(datasetName)}
                  />
                </label>
              )}
              <details open>
                <summary>
                  <span className="dataset-order">
                    <span aria-hidden="true">{datasetIndex + 1}</span>
                    <span>{datasetName}</span>
                  </span>
                  <span>{images.length} JPGs</span>
                </summary>
                <ul className="filename-list">
                  {images.map((image) => (
                    <li key={image.file.id}>{image.file.name}</li>
                  ))}
                </ul>
              </details>
            </div>
          );
        })}
      </div>
      {selection.datasets.length > 0 && (
        <p className="count-order-note">
          Folder 1 uses count block 1, folder 2 uses block 2, and so on.
        </p>
      )}
      {onRemoveDatasets && selection.datasets.length > 0 && (
        <div className="dataset-actions">
          <span>
            {activeSelectedDatasets.size === 0
              ? "Select folders to remove"
              : `${activeSelectedDatasets.size} selected`}
          </span>
          <button
            className="button button-danger"
            type="button"
            disabled={activeSelectedDatasets.size === 0 || isUpdating}
            onClick={removeSelected}
          >
            {isUpdating ? "Updating…" : "Remove selected"}
          </button>
        </div>
      )}
      {warnings.length > 0 && (
        <details className="input-warnings">
          <summary>{warnings.length} input warning{warnings.length === 1 ? "" : "s"}</summary>
          <ul>
            {warnings.map((warning, index) => (
              <li key={`${warning.code}:${warning.filename ?? index}`}>{warning.message}</li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
