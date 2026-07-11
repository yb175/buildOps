import { execFile } from "child_process";
import * as fs from "fs/promises";
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

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "buildops-pdf-"));
  const inputPath = path.join(tmpDir, "input.pdf");
  const outputPrefix = path.join(tmpDir, "page");

  try {
    await fs.writeFile(inputPath, pdfBuffer);

    // Enforce page cap using pdfinfo (surfaced limit)
    let pageCount = 1;
    try {
      const { stdout } = await execFileAsync("pdfinfo", [inputPath], { timeout: 5000 });
      const match = stdout.match(/Pages:\s+(\d+)/);
      if (match) {
        pageCount = parseInt(match[1], 10);
      }
    } catch (err: any) {
      logger.warn("[pdf-renderer] pdfinfo failed to read page count", err);
      // In non-production/testing (e.g. mock PDF string), we can gracefully default or keep pageCount = 1
    }

    if (pageCount > maxPages) {
      throw new Error(`Max page limit exceeded: PDF has ${pageCount} pages, which exceeds the limit of ${maxPages} pages.`);
    }

    // -r: DPI, -png: output format, -l: last page limit
    // timeout: 30 seconds subprocess deadline, maxBuffer: 50MB resource limit
    await execFileAsync("pdftoppm", [
      "-r", String(dpi),
      "-png",
      "-l", String(maxPages),
      inputPath,
      outputPrefix,
    ], { timeout: 30000, maxBuffer: 50 * 1024 * 1024 });

    // Collect generated PNG files (pdftoppm names them page-01.png, page-02.png, etc.)
    const files = (await fs.readdir(tmpDir))
      .filter((f) => f.startsWith("page") && f.endsWith(".png"))
      .sort();

    if (files.length === 0) {
      logger.warn("[pdf-renderer] pdftoppm produced no output files.");
      return null;
    }

    const buffers: Buffer[] = [];
    for (const f of files) {
      buffers.push(await fs.readFile(path.join(tmpDir, f)));
    }

    logger.log(`[pdf-renderer] Rendered ${buffers.length} page(s) at ${dpi} DPI`);
    return buffers;
  } catch (err) {
    logger.error("[pdf-renderer] Rendering failed", err);
    return null;
  } finally {
    // Clean up temp files
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
}
