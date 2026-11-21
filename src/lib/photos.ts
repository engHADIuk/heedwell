import list from "../../data/photos.json";

export type PhotoKey =
  | "field-dog"
  | "golden-run"
  | "forest-path"
  | "beach"
  | "lake"
  | "garden"
  | "cat-window"
  | "vet";

export interface PhotoInfo {
  file: PhotoKey;
  id: string;
  page: string;
  photographer: string;
  alt: string;
  position?: string;
}

export const PHOTO_LIST = list as PhotoInfo[];
export const PHOTOS = Object.fromEntries(PHOTO_LIST.map((p) => [p.file, p])) as Record<PhotoKey, PhotoInfo>;
