import { useState, type FormEvent, type ReactNode } from "react";
import type { IAccessTokenVerifier } from "../../application/contracts/IAccessTokenVerifier";
import { isValidSha256Hash } from "../../infrastructure/security/Sha256AccessTokenVerifier";

interface AccessGateProps {
  readonly expectedTokenHash: string;
  readonly verifier: IAccessTokenVerifier;
  readonly children: ReactNode;
}

function sessionKey(expectedTokenHash: string): string {
  return `cytation-access:${expectedTokenHash.slice(0, 16).toLowerCase()}`;
}

export function AccessGate({ expectedTokenHash, verifier, children }: AccessGateProps) {
  const normalizedHash = expectedTokenHash.trim().toLowerCase();
  const gateEnabled = normalizedHash.length > 0;
  const configurationValid = !gateEnabled || isValidSha256Hash(normalizedHash);
  const [granted, setGranted] = useState(
    () => gateEnabled && sessionStorage.getItem(sessionKey(normalizedHash)) === "granted",
  );
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  if (!gateEnabled) {
    return children;
  }

  if (!configurationValid) {
    return (
      <main className="access-page">
        <section className="access-card" role="alert">
          <div className="access-mark" aria-hidden="true">!</div>
          <p className="eyebrow">Configuration required</p>
          <h1>Access gate is not configured correctly.</h1>
          <p>The deployed token hash must be a 64-character SHA-256 hexadecimal value.</p>
        </section>
      </main>
    );
  }

  if (granted) {
    return children;
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsChecking(true);
    setError(null);
    try {
      if (await verifier.verify(token, normalizedHash)) {
        sessionStorage.setItem(sessionKey(normalizedHash), "granted");
        setToken("");
        setGranted(true);
      } else {
        setToken("");
        setError("That access token is not valid.");
      }
    } catch {
      setError("The access token could not be verified. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <main className="access-page">
      <section className="access-card" aria-labelledby="access-title">
        <div className="access-brand">
          <div className="brand-mark" aria-hidden="true"><span /></div>
          <div>
            <strong>Cytation</strong>
            <span>PowerPoint Generator</span>
          </div>
        </div>
        <div className="access-mark" aria-hidden="true">↗</div>
        <p className="eyebrow">Restricted access</p>
        <h1 id="access-title">Enter the shared access token.</h1>
        <p>Your token is checked locally and is never stored or transmitted.</p>
        <form onSubmit={submit}>
          <label className="field" htmlFor="access-token">
            <span>Access token</span>
            <input
              id="access-token"
              type="password"
              value={token}
              required
              autoComplete="off"
              spellCheck={false}
              autoFocus
              disabled={isChecking}
              onChange={(event) => setToken(event.target.value)}
            />
          </label>
          {error && <p className="access-error" role="alert">{error}</p>}
          <button className="button button-primary" type="submit" disabled={isChecking || !token}>
            {isChecking ? "Checking…" : "Continue"}
          </button>
        </form>
        <small>Access remains active only for this browser tab.</small>
      </section>
    </main>
  );
}
