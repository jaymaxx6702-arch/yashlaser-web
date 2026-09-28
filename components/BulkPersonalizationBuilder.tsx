"use client";

import { useEffect, useMemo, useState } from "react";
import {
  bulkPersonalizationTemplateCsv,
  inspectBulkPersonalizationCsv,
} from "@/lib/bulk-personalization";
import type { UiLanguage } from "@/lib/i18n";

const copy = {
  en: {
    title: "Batch personalisation",
    help: "Choose one design/text for everyone or upload different data for each recipient.",
    same: "Same for all",
    different: "Different for each",
    common1: "Common text / name",
    common2: "Common second line",
    template: "Download CSV template",
    csv: "Upload completed CSV",
    photos: "Upload matching photos",
    photoHelp: "Optional JPG/PNG/WebP photos. File names are matched to photo_filename in the CSV. Up to 100 photos in the Shop flow.",
    summary: "Validation summary",
    ready: "Ready",
    blocked: "Fix errors before submitting",
  },
  gu: {
    title: "Batch personalisation",
    help: "બધા માટે એકસરખી design/text રાખો અથવા દરેક વ્યક્તિ માટે અલગ data upload કરો.",
    same: "બધા માટે એકસરખું",
    different: "દરેક માટે અલગ",
    common1: "Common text / name",
    common2: "Common second line",
    template: "CSV template download કરો",
    csv: "ભરેલું CSV upload કરો",
    photos: "Matching photos upload કરો",
    photoHelp: "વૈકલ્પિક JPG/PNG/WebP photos. CSVના photo_filename સાથે file name match થાય છે. Shop flowમાં મહત્તમ 100 photos.",
    summary: "Validation summary",
    ready: "Ready",
    blocked: "Submit કરતાં પહેલાં errors સુધારો",
  },
  hi: {
    title: "Batch personalisation",
    help: "सभी के लिए एक जैसा design/text रखें या हर recipient के लिए अलग data upload करें.",
    same: "सभी के लिए समान",
    different: "हर एक के लिए अलग",
    common1: "Common text / name",
    common2: "Common second line",
    template: "CSV template download करें",
    csv: "भरा हुआ CSV upload करें",
    photos: "Matching photos upload करें",
    photoHelp: "वैकल्पिक JPG/PNG/WebP photos. File name CSV के photo_filename से match होता है. Shop flow में अधिकतम 100 photos.",
    summary: "Validation summary",
    ready: "Ready",
    blocked: "Submit से पहले errors ठीक करें",
  },
  mr: {
    title: "Batch personalisation",
    help: "सर्वांसाठी समान design/text ठेवा किंवा प्रत्येक recipientसाठी वेगळा data upload करा.",
    same: "सर्वांसाठी समान",
    different: "प्रत्येकासाठी वेगळे",
    common1: "Common text / name",
    common2: "Common second line",
    template: "CSV template download करा",
    csv: "भरलेला CSV upload करा",
    photos: "Matching photos upload करा",
    photoHelp: "पर्यायी JPG/PNG/WebP photos. File name CSVच्या photo_filenameशी match होतो. Shop flowमध्ये कमाल 100 photos.",
    summary: "Validation summary",
    ready: "Ready",
    blocked: "Submitपूर्वी errors दुरुस्त करा",
  },
} as const;

export function BulkPersonalizationBuilder({
  lang = "en",
  onAttachmentsChange,
  onValidityChange,
}: {
  lang?: UiLanguage;
  onAttachmentsChange: (files: File[]) => void;
  onValidityChange: (valid: boolean) => void;
}) {
  const t = copy[lang];
  const [mode, setMode] = useState<"same" | "different">("same");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csv, setCsv] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);

  const inspection = useMemo(
    () =>
      mode === "different" && csv
        ? inspectBulkPersonalizationCsv(
            csv,
            photos.map((file) => file.name),
          )
        : null,
    [mode, csv, photos],
  );
  const errors = inspection?.issues.filter((issue) => issue.kind === "error") ?? [];
  const warnings =
    inspection?.issues.filter((issue) => issue.kind === "warning") ?? [];
  const valid =
    mode === "same" ||
    Boolean(inspection && inspection.rows.length > 0 && errors.length === 0);

  useEffect(() => {
    onValidityChange(valid);
    if (mode !== "different" || !csvFile || !inspection || errors.length) {
      onAttachmentsChange([]);
      return;
    }
    const matched = new Set(inspection.matchedPhotoNames);
    onAttachmentsChange([
      csvFile,
      ...photos.filter((file) => matched.has(file.name.toLowerCase())),
    ]);
  }, [
    mode,
    csvFile,
    photos,
    inspection,
    errors.length,
    valid,
    onAttachmentsChange,
    onValidityChange,
  ]);

  function downloadTemplate() {
    const blob = new Blob([bulkPersonalizationTemplateCsv()], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "yashlaser-bulk-personalisation-template.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }

  async function chooseCsv(file: File | undefined) {
    setCsvFile(file || null);
    setCsv("");
    if (!file) return;
    if (file.size > 1024 * 1024) return;
    setCsv(await file.text());
  }

  function choosePhotos(files: FileList | null) {
    const selected = files ? Array.from(files) : [];
    const allowed = selected.filter(
      (file) =>
        ["image/jpeg", "image/png", "image/webp"].includes(file.type) &&
        file.size > 0 &&
        file.size <= 20 * 1024 * 1024,
    );
    setPhotos(allowed.slice(0, 100));
  }

  const summary = inspection
    ? JSON.stringify({
        mode,
        records: inspection.rows.length,
        referencedPhotos: inspection.rows.filter((row) => row.photoFilename)
          .length,
        matchedPhotos: inspection.matchedPhotoNames.length,
        warnings: warnings.length,
      })
    : JSON.stringify({ mode });

  return (
    <section className="admin-card bulk-personalisation">
      <p className="eyebrow">{t.title}</p>
      <p>{t.help}</p>
      <div className="editor-toolbar" role="group" aria-label={t.title}>
        <button
          type="button"
          aria-pressed={mode === "same"}
          onClick={() => setMode("same")}
        >
          {t.same}
        </button>
        <button
          type="button"
          aria-pressed={mode === "different"}
          onClick={() => setMode("different")}
        >
          {t.different}
        </button>
      </div>

      <input type="hidden" name="bulkMode" value={mode} />
      <input type="hidden" name="bulkPersonalizationSummary" value={summary} />

      {mode === "same" ? (
        <div className="checkout-fields">
          <label>
            {t.common1}
            <input name="bulkCommonLine1" maxLength={180} />
          </label>
          <label>
            {t.common2}
            <input name="bulkCommonLine2" maxLength={180} />
          </label>
        </div>
      ) : (
        <>
          <div className="editor-toolbar">
            <button type="button" onClick={downloadTemplate}>
              {t.template}
            </button>
          </div>
          <label>
            {t.csv}
            <input
              type="file"
              accept=".csv,text/csv,text/plain"
              onChange={(event) => void chooseCsv(event.target.files?.[0])}
            />
          </label>
          <label>
            {t.photos}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(event) => choosePhotos(event.target.files)}
            />
            <small>{t.photoHelp}</small>
          </label>

          {inspection && (
            <div className="admin-card" role={valid ? "status" : "alert"}>
              <strong>{t.summary}</strong>
              <p>
                {inspection.rows.length} records · {inspection.matchedPhotoNames.length} matched photos ·{" "}
                {errors.length} errors · {warnings.length} warnings
              </p>
              <p>{valid ? t.ready : t.blocked}</p>
              {[...errors, ...warnings].slice(0, 20).map((issue, index) => (
                <p key={index}>
                  {issue.kind === "error" ? "Error: " : "Warning: "}
                  {issue.row ? "Row " + issue.row + ": " : ""}
                  {issue.message}
                </p>
              ))}
              {inspection.rows.slice(0, 10).map((row) => (
                <div className="summary-row" key={row.recordId}>
                  <span>{row.recordId}</span>
                  <span>{row.name || row.line1 || row.line2 || "—"}</span>
                  <span>{row.photoFilename || "No photo"}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
