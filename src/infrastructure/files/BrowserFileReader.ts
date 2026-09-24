import type { IFileReader } from "../../application/contracts/IFileReader";
import { FileReadError } from "../../domain/errors/FileReadError";
import type { InputFile } from "../../domain/models/InputFile";
import type { BrowserFileSource } from "./BrowserFileSource";

const imageExtensions = new Set(["jpg", "jpeg"]);

function shouldReadContent(filename: string): boolean {
  return imageExtensions.has(filename.split(".").pop()?.toLowerCase() ?? "");
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Unknown file read error"));
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("The selected file did not produce image data."));
      }
    };
    reader.readAsDataURL(file);
  });
}

export class BrowserFileReader implements IFileReader<BrowserFileSource> {
  public async readFiles(sources: readonly BrowserFileSource[]): Promise<readonly InputFile[]> {
    return Promise.all(
      sources.map(async ({ file, relativePath }) => {
        try {
          const content = shouldReadContent(file.name) ? await readAsDataUrl(file) : null;
          return {
            id: `${relativePath}:${file.size}:${file.lastModified}`,
            name: file.name,
            relativePath,
            mimeType: file.type,
            size: file.size,
            content,
          };
        } catch (error) {
          throw new FileReadError(file.name, { cause: error });
        }
      }),
    );
  }
}
