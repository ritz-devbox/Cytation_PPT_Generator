import type {
  MatrixOrientation,
  PresentationConfig,
} from "../../domain/models/PresentationConfig";
import type { EditableRowLabel } from "../../application/services/BuildSlideLayoutService";

interface PresentationFormProps {
  readonly editableRows: readonly EditableRowLabel[];
  readonly labels: Readonly<Record<string, string>>;
  readonly config: PresentationConfig;
  readonly filename: string;
  readonly actualDiameter: number;
  readonly onLabelChange: (datasetName: string, value: string) => void;
  readonly onConfigChange: <K extends keyof PresentationConfig>(
    key: K,
    value: PresentationConfig[K],
  ) => void;
  readonly onFilenameChange: (value: string) => void;
}

interface NumberFieldProps {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly min: number;
  readonly step: number;
  readonly suffix?: string;
  readonly onChange: (value: number) => void;
}

function NumberField({ id, label, value, min, step, suffix = "in", onChange }: NumberFieldProps) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <span className="number-input-wrap">
        <input
          id={id}
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.valueAsNumber)}
        />
        <span>{suffix}</span>
      </span>
    </label>
  );
}

export function PresentationForm({
  editableRows,
  labels,
  config,
  filename,
  actualDiameter,
  onLabelChange,
  onConfigChange,
  onFilenameChange,
}: PresentationFormProps) {
  const setOrientation = (orientation: MatrixOrientation) =>
    onConfigChange("orientation", orientation);

  return (
    <section className="panel" aria-labelledby="layout-title">
      <p className="eyebrow">Step 2</p>
      <h2 id="layout-title">Configure the layout</h2>

      <fieldset className="orientation-picker">
        <legend>Image ordering</legend>
        <label className={config.orientation === "horizontal" ? "selected" : ""}>
          <input
            type="radio"
            name="orientation"
            value="horizontal"
            checked={config.orientation === "horizontal"}
            onChange={() => setOrientation("horizontal")}
          />
          <span><strong>Horizontal</strong><small>B2, B3, B4…</small></span>
        </label>
        <label className={config.orientation === "vertical" ? "selected" : ""}>
          <input
            type="radio"
            name="orientation"
            value="vertical"
            checked={config.orientation === "vertical"}
            onChange={() => setOrientation("vertical")}
          />
          <span><strong>Vertical</strong><small>B2, C2, D2…</small></span>
        </label>
      </fieldset>

      <fieldset className="label-editor">
        <legend>Left-side row labels</legend>
        <p className="field-help">Each generated row can have its own label. Folder names are used by default.</p>
        <div className="field-grid row-label-grid">
          {editableRows.map((row) => (
            <label className="field" key={row.key}>
              <span>{row.coordinateGroup} · {row.datasetName}</span>
              <input
                type="text"
                value={labels[row.key] ?? row.datasetName}
                onChange={(event) => onLabelChange(row.key, event.target.value)}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <div className="field-grid layout-fields">
        <NumberField
          id="image-diameter"
          label="Preferred image diameter"
          value={config.preferredDiameter}
          min={0.1}
          step={0.1}
          onChange={(value) => onConfigChange("preferredDiameter", value)}
        />
        <div className="field calculated-field">
          <span>Calculated diameter</span>
          <output>{actualDiameter ? `${actualDiameter.toFixed(2)} in` : "—"}</output>
        </div>
        <NumberField
          id="horizontal-gap"
          label="Horizontal spacing"
          value={config.horizontalGap}
          min={0}
          step={0.01}
          onChange={(value) => onConfigChange("horizontalGap", value)}
        />
        <NumberField
          id="vertical-gap"
          label="Vertical spacing"
          value={config.verticalGap}
          min={0}
          step={0.01}
          onChange={(value) => onConfigChange("verticalGap", value)}
        />
      </div>

      <details className="advanced-settings">
        <summary>Advanced slide dimensions</summary>
        <div className="field-grid">
          <NumberField
            id="slide-width"
            label="Slide width"
            value={config.slideWidth}
            min={1}
            step={0.1}
            onChange={(value) => onConfigChange("slideWidth", value)}
          />
          <NumberField
            id="slide-height"
            label="Slide height"
            value={config.slideHeight}
            min={1}
            step={0.1}
            onChange={(value) => onConfigChange("slideHeight", value)}
          />
        </div>
      </details>

      <label className="field output-field" htmlFor="output-filename">
        <span>Output filename</span>
        <input
          id="output-filename"
          type="text"
          value={filename}
          onChange={(event) => onFilenameChange(event.target.value)}
        />
      </label>
    </section>
  );
}
