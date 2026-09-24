# Cytation PowerPoint Generator

A browser-only React application that arranges locally selected Cytation JPG images into a validated matrix and exports the result as a PowerPoint presentation.

## What it does

- Select a root folder or drag image files/folders into the page.
- Detect dataset names from subfolders such as `0gy` and `2gy`.
- Detect coordinates from filename substrings such as `_B2_`.
- Validate missing and duplicate coordinates before generation.
- Preview horizontal or vertical ordering with an editable, 90-degree rotated label for every generated row.
- Calculate circular image size and slide pagination automatically.
- Save with the browser's native file picker when available, with a download fallback.

All file reading and PowerPoint generation happens locally in the browser. No backend or upload service is used.

## Shared access token

Production deployment is protected by a lightweight shared-token gate. The plaintext token is never committed or placed in the application bundle. Only its SHA-256 hash is supplied through the `VITE_ACCESS_TOKEN_HASH` GitHub Actions secret.

Generate the hash in PowerShell without writing the token to disk:

```powershell
$accessToken = Read-Host 'Shared access token'
$tokenBytes = [Text.Encoding]::UTF8.GetBytes($accessToken)
$sha256 = [Security.Cryptography.SHA256]::Create()
try {
  $tokenHash = -join ($sha256.ComputeHash($tokenBytes) | ForEach-Object { $_.ToString('x2') })
  $tokenHash
} finally {
  $sha256.Dispose()
  Remove-Variable accessToken, tokenBytes
}
```

In GitHub, save the resulting 64-character hash under **Settings → Secrets and variables → Actions → New repository secret**, named `VITE_ACCESS_TOKEN_HASH`. Keep and share the original token separately. The deployment workflow refuses to publish if the hash is absent or malformed.

Local development leaves the gate disabled when `VITE_ACCESS_TOKEN_HASH` is unset. To test it locally, copy `.env.example` to `.env.local` and add a test token hash. Never put the plaintext token in an environment file.

This is a shared client-side gate, not server-enforced authentication. Use a long random token, share it through a secure channel, and rotate it by updating the secret and redeploying.

## Local development

Requirements: Node.js 24 and npm.

```bash
npm ci
npm run dev
```

Quality checks:

```bash
npm test
npm run lint
npm run build
```

The untracked `InputData` sample can be used for a real generation smoke test:

```bash
npm run smoke:pptx
```

This creates the ignored file `smoke-output.pptx`.

## GitHub Pages

The deployment workflow calculates the Vite base path from the repository name. Pushes to `main` run tests, build the app, upload `dist`, and deploy it through GitHub Pages. Configure the repository's Pages source as **GitHub Actions** before the first deployment.

## Future matrix annotations

The slide cell model supports an optional coordinate annotation. A later matrix-file reader can attach a folder-specific value to each image coordinate and render the value above its image without changing the ordering rules.
