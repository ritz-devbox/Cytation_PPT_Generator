import type { InputFile } from "../../domain/models/InputFile";

export interface IFileReader<TSource> {
  readFiles(sources: readonly TSource[]): Promise<readonly InputFile[]>;
}
