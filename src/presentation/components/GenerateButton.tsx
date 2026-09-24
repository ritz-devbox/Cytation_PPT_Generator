interface GenerateButtonProps {
  readonly disabled: boolean;
  readonly isGenerating: boolean;
  readonly onClick: () => Promise<void>;
}

export function GenerateButton({ disabled, isGenerating, onClick }: GenerateButtonProps) {
  return (
    <button
      className="button button-primary generate-button"
      type="button"
      disabled={disabled || isGenerating}
      onClick={onClick}
    >
      {isGenerating ? "Generating PowerPoint…" : "Generate PowerPoint"}
    </button>
  );
}
