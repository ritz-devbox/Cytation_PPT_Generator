interface ErrorMessageProps {
  readonly message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="message error-message" role="alert">
      <span aria-hidden="true">!</span>
      <p>{message}</p>
    </div>
  );
}
