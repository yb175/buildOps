export class UnsupportedDocumentError extends Error {
  constructor(
    public documentType: string,
    public confidence: number,
    public reason: string
  ) {
    super("Unsupported document type.");
    this.name = "UnsupportedDocumentError";
    Object.setPrototypeOf(this, UnsupportedDocumentError.prototype);
  }
}
