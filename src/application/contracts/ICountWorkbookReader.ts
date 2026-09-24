import type { CountWorkbookData } from "../../domain/models/CountWorkbookData";

export interface ICountWorkbookReader<TSource> {
  read(sources: readonly TSource[]): Promise<readonly CountWorkbookData[]>;
}
