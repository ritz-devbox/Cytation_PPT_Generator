import { GeneratorPage } from "../presentation/pages/GeneratorPage";
import { AccessGate } from "../presentation/components/AccessGate";
import { accessTokenVerifier } from "./dependencies";

export function App() {
  return (
    <AccessGate
      expectedTokenHash={import.meta.env.VITE_ACCESS_TOKEN_HASH ?? ""}
      verifier={accessTokenVerifier}
    >
      <GeneratorPage />
    </AccessGate>
  );
}
