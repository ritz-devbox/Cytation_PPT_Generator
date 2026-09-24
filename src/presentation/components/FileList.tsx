import type { PreparedImageSelection } from "../../domain/models/PreparedImageSelection";

interface FileListProps {
  readonly selection: PreparedImageSelection;
}

export function FileList({ selection }: FileListProps) {
  return (
    <section className="panel compact-panel" aria-labelledby="selected-files-title">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Validated input</p>
          <h2 id="selected-files-title">Selected datasets</h2>
        </div>
        <span className="status-chip success">{selection.images.length} images</span>
      </div>
      <div className="dataset-list">
        {selection.datasets.map((datasetName) => {
          const images = selection.images.filter((image) => image.datasetName === datasetName);
          return (
            <details key={datasetName}>
              <summary>
                <span>{datasetName}</span>
                <span>{images.length} JPGs</span>
              </summary>
              <ul className="filename-list">
                {images.map((image) => (
                  <li key={image.file.id}>{image.file.name}</li>
                ))}
              </ul>
            </details>
          );
        })}
      </div>
    </section>
  );
}
