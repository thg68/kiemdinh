export class EvidenceZipStorageError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "EvidenceZipStorageError";
  }
}
