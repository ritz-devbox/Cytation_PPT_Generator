import type { IAccessTokenVerifier } from "../../application/contracts/IAccessTokenVerifier";

const sha256HexPattern = /^[a-f0-9]{64}$/i;

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function equalLengthConstantTime(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export function isValidSha256Hash(value: string): boolean {
  return sha256HexPattern.test(value);
}

export class Sha256AccessTokenVerifier implements IAccessTokenVerifier {
  public async verify(token: string, expectedHash: string): Promise<boolean> {
    const normalizedHash = expectedHash.trim().toLowerCase();
    if (!token || !isValidSha256Hash(normalizedHash)) {
      return false;
    }
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
    return equalLengthConstantTime(toHex(digest), normalizedHash);
  }
}
