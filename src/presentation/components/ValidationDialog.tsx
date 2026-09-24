import type { ValidationIssue } from "../../domain/models/ValidationIssue";

interface ValidationDialogProps {
  readonly issues: readonly ValidationIssue[];
  readonly onClose: () => void;
}

export function ValidationDialog({ issues, onClose }: ValidationDialogProps) {
  const errors = issues.filter((issue) => issue.severity === "error");
  return (
    <div className="dialog-backdrop" role="presentation">
      <section
        className="validation-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="validation-title"
      >
        <div className="dialog-icon" aria-hidden="true">!</div>
        <h2 id="validation-title">The image matrix is incomplete</h2>
        <p>Correct these items and select the folder again before generating the presentation.</p>
        <ul>
          {errors.slice(0, 12).map((issue, index) => (
            <li key={`${issue.code}-${issue.datasetName}-${issue.coordinate}-${index}`}>
              {issue.message}
            </li>
          ))}
        </ul>
        {errors.length > 12 && <p>And {errors.length - 12} more validation issues.</p>}
        <button className="button button-primary" type="button" onClick={onClose} autoFocus>
          Return to selection
        </button>
      </section>
    </div>
  );
}
