export interface BrowserFileSource {
  readonly file: File;
  readonly relativePath: string;
}

export function browserFileSource(file: File, relativePath?: string): BrowserFileSource {
  return {
    file,
    relativePath: relativePath || file.webkitRelativePath || file.name,
  };
}
