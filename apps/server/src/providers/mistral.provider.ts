import { mistralConfig } from "../config/mistral";
import { OCRResponse } from "../types/ocr.types";

export class MistralProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = mistralConfig.apiKey || "";
    this.baseUrl = mistralConfig.baseUrl || "https://api.mistral.ai/v1";
  }

  /**
   * Uploads a file buffer to Mistral Files API to receive a file_id.
   */
  async uploadFile(fileBuffer: Buffer, fileName: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error("Mistral API key is missing.");
    }

    const formData = new FormData();
    const fileBlob = new Blob([fileBuffer], { type: "application/pdf" });
    formData.append("file", fileBlob, fileName);
    formData.append("purpose", "ocr");

    try {
      const response = await fetch(`${this.baseUrl}/files`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Mistral file upload failed: ${response.status} - ${errorText}`);
      }

      const data = (await response.json()) as { id: string };
      return data.id;
    } catch (error) {
      throw new Error(`Mistral API failure: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Requests OCR extraction for a given uploaded file_id.
   */
  async performOCR(fileId: string): Promise<OCRResponse> {
    if (!this.apiKey) {
      throw new Error("Mistral API key is missing.");
    }

    try {
      const response = await fetch(`${this.baseUrl}/ocr`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "mistral-ocr-latest",
          document: {
            file_id: fileId,
          },
          include_image_base64: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Mistral OCR processing failed: ${response.status} - ${errorText}`);
      }

      return (await response.json()) as OCRResponse;
    } catch (error) {
      throw new Error(`Mistral API failure: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
