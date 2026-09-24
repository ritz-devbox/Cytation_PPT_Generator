import { readSheet } from "read-excel-file/browser";
import type { ICountWorkbookReader } from "../../application/contracts/ICountWorkbookReader";
import type { CountWorkbookData } from "../../domain/models/CountWorkbookData";
import type { BrowserFileSource } from "./BrowserFileSource";

function isWorkbook(filename: string): boolean {
  return filename.toLowerCase().endsWith(".xlsx");
}

export class BrowserCountWorkbookReader implements ICountWorkbookReader<BrowserFileSource> {
  public async read(sources: readonly BrowserFileSource[]): Promise<readonly CountWorkbookData[]> {
    return Promise.all(
      sources.filter((source) => isWorkbook(source.file.name)).map(async ({ file }) => {
        try {
          return {
            filename: file.name,
            rows: await readSheet(file),
          };
        } catch (error) {
          return {
            filename: file.name,
            rows: [],
            readError: error instanceof Error ? error.message : "The workbook could not be read.",
          };
        }
      }),
    );
  }
}
