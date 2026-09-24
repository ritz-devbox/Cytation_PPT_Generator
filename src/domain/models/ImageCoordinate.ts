export interface ImageCoordinate {
  readonly row: string;
  readonly column: number;
}

export function coordinateKey(coordinate: ImageCoordinate): string {
  return `${coordinate.row}${coordinate.column}`;
}
