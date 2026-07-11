import { execFile } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { promisify } from "util";
import { logger } from "./logger";

const execFileAsync = promisify(execFile);

/**
 * Renders each page of a PDF buffer to a 300 DPI PNG buffer.
 * Requires poppler-utils (pdftoppm) to be installed on the system.
 * Falls back gracefully — returns null if pdftoppm is unavailable.
 *
 * Production note: For zero-dependency deployments (Lambda, edge),
 * replace this with the `mupdf` npm package (WebAssembly-based).
 */
export async function renderPdfToImages(
  pdfBuffer: Buffer,
  dpi: number = 300,
  maxPages: number = 5
): Promise<Buffer[] | null> {
  // Check pdftoppm availability
  try {
    await execFileAsync("which", ["pdftoppm"]);
  } catch {
    logger.warn("[pdf-renderer] pdftoppm not found. Skipping PDF→PNG rendering. Install poppler-utils or mupdf for higher quality.");
    return null;
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "buildops-pdf-"));
  const inputPath = path.join(tmpDir, "input.pdf");
  const outputPrefix = path.join(tmpDir, "page");

  try {
    fs.writeFileSync(inputPath, pdfBuffer);

    // -r: DPI, -png: output format, -l: last page limit
    await execFileAsync("pdftoppm", [
      "-r", String(dpi),
      "-png",
      "-l", String(maxPages),
      inputPath,
      outputPrefix,
    ]);

    // Collect generated PNG files (pdftoppm names them page-01.png, page-02.png, etc.)
    const files = fs
      .readdirSync(tmpDir)
      .filter((f) => f.startsWith("page") && f.endsWith(".png"))
      .sort();

    if (files.length === 0) {
      logger.warn("[pdf-renderer] pdftoppm produced no output files.");
      return null;
    }

    const buffers = files.map((f) => fs.readFileSync(path.join(tmpDir, f)));
    logger.log(`[pdf-renderer] Rendered ${buffers.length} page(s) at ${dpi} DPI (${buffers.map((b) => Math.round(b.length / 1024) + "KB").join(", ")})`);
    return buffers;
  } catch (err) {
    logger.error("[pdf-renderer] Rendering failed", err);
    return null;
  } finally {
    // Clean up temp files
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
}
