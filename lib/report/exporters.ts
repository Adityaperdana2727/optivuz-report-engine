import type { ReportResult } from "./types";
import { renderTabbedHTML } from "../html";

export type ExportFormat = "html" | "pdf" | "xlsx";

export type ExportResult = {
  format: ExportFormat;
  contentType: string;
  body: string | Uint8Array;
};

export function renderReport(format: ExportFormat, report: ReportResult): ExportResult {
  if (format === "html") {
    return { format, contentType: "text/html; charset=utf-8", body: renderTabbedHTML(report) };
  }
  if (format === "pdf") {
    throw new Error("PDF export not implemented yet.");
  }
  if (format === "xlsx") {
    throw new Error("XLSX export not implemented yet.");
  }
  throw new Error(`Unsupported export format: ${format}`);
}
