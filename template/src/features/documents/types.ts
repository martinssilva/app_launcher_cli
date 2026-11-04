export interface DocumentFile {
  id: string;
  name: string;
  mimeType: string;
  /** Size in bytes. */
  size: number;
  /** ISO 8601 date-time. */
  uploadedAt: string;
  uploadedBy: string;
  url: string;
}

/** A local file chosen by the user, ready to upload. */
export interface PickedFile {
  uri: string;
  name: string;
  type: string;
}
