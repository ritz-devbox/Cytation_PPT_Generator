import type { InputFile } from "../../src/domain/models/InputFile";

export function inputFile(
  dataset: string,
  coordinate: string,
  options: { readonly name?: string; readonly content?: string | null } = {},
): InputFile {
  const name = options.name ?? `Stitched[GFP]_${coordinate}_1_001.jpg`;
  return {
    id: `${dataset}/${name}`,
    name,
    relativePath: `InputData/${dataset}/${name}`,
    mimeType: "image/jpeg",
    size: 10,
    content: options.content === undefined ? "data:image/jpeg;base64,AA==" : options.content,
  };
}
