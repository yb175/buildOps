export interface OCRPage {
  markdown: string;
}

export interface OCRResponse {
  pages: OCRPage[];
}
