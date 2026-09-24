import type { IFileSaver } from "../../application/contracts/IFileSaver";
import type { GeneratedPresentationFile } from "../../domain/models/PresentationResult";

interface SaveFilePickerOptions {
  readonly suggestedName?: string;
  readonly types?: readonly {
    readonly description: string;
    readonly accept: Readonly<Record<string, readonly string[]>>;
  }[];
}

interface WritableFileHandle {
  createWritable(): Promise<{
    write(data: Blob): Promise<void>;
    close(): Promise<void>;
  }>;
}

type SaveFilePicker = (options?: SaveFilePickerOptions) => Promise<WritableFileHandle>;

export class BrowserFileSaver implements IFileSaver {
  public async save(
    file: GeneratedPresentationFile,
    filename: string,
  ): Promise<"picker" | "download"> {
    const blob = new Blob([file.bytes.slice().buffer], { type: file.mimeType });
    const picker = (window as Window & { showSaveFilePicker?: SaveFilePicker }).showSaveFilePicker;

    if (picker) {
      const handle = await picker({
        suggestedName: filename,
        types: [
          {
            description: "PowerPoint presentation",
            accept: {
              "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
            },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return "picker";
    }

    const url = URL.createObjectURL(blob);
    try {
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.style.display = "none";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      return "download";
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}
