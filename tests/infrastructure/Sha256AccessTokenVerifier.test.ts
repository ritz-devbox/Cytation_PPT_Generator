// @vitest-environment node

import { describe, expect, it } from "vitest";
import { Sha256AccessTokenVerifier } from "../../src/infrastructure/security/Sha256AccessTokenVerifier";

describe("Sha256AccessTokenVerifier", () => {
  const verifier = new Sha256AccessTokenVerifier();
  const helloHash = "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824";

  it("accepts a token whose SHA-256 digest matches", async () => {
    await expect(verifier.verify("hello", helloHash)).resolves.toBe(true);
  });

  it("rejects an incorrect token or malformed configured hash", async () => {
    await expect(verifier.verify("incorrect", helloHash)).resolves.toBe(false);
    await expect(verifier.verify("hello", "not-a-sha256-hash")).resolves.toBe(false);
  });
});
