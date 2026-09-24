import { browserFileSource, type BrowserFileSource } from "./BrowserFileSource";

function entryFile(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => entry.file(resolve, reject));
}

async function readAllEntries(reader: FileSystemDirectoryReader): Promise<readonly FileSystemEntry[]> {
  const entries: FileSystemEntry[] = [];
  while (true) {
    const batch = await new Promise<readonly FileSystemEntry[]>((resolve, reject) =>
      reader.readEntries(resolve, reject),
    );
    if (batch.length === 0) {
      return entries;
    }
    entries.push(...batch);
  }
}

async function collectEntry(entry: FileSystemEntry, parentPath: string): Promise<BrowserFileSource[]> {
  const relativePath = parentPath ? `${parentPath}/${entry.name}` : entry.name;
  if (entry.isFile) {
    const file = await entryFile(entry as FileSystemFileEntry);
    return [browserFileSource(file, relativePath)];
  }
  if (!entry.isDirectory) {
    return [];
  }
  const children = await readAllEntries((entry as FileSystemDirectoryEntry).createReader());
  const nested = await Promise.all(children.map((child) => collectEntry(child, relativePath)));
  return nested.flat();
}

export async function collectDroppedFiles(dataTransfer: DataTransfer): Promise<readonly BrowserFileSource[]> {
  const items = Array.from(dataTransfer.items);
  const entries = items
    .map((item) =>
      typeof item.webkitGetAsEntry === "function" ? item.webkitGetAsEntry() : null,
    )
    .filter(Boolean) as FileSystemEntry[];
  if (entries.length > 0) {
    return (await Promise.all(entries.map((entry) => collectEntry(entry, "")))).flat();
  }
  return Array.from(dataTransfer.files).map((file) => browserFileSource(file));
}
