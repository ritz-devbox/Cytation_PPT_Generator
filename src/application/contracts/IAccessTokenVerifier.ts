export interface IAccessTokenVerifier {
  verify(token: string, expectedHash: string): Promise<boolean>;
}
