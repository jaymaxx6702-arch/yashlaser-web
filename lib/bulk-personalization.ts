export const BULK_TEMPLATE_COLUMNS = [
  "record_id",
  "name",
  "line1",
  "line2",
  "photo_filename",
] as const;

export type BulkPersonalizationRow = {
  recordId: string;
  name: string;
  line1: string;
  line2: string;
  photoFilename: string;
};

export type BulkPersonalizationIssue = {
  kind: "error" | "warning";
  row?: number;
  message: string;
};

export type BulkPersonalizationInspection = {
  rows: BulkPersonalizationRow[];
  issues: BulkPersonalizationIssue[];
  matchedPhotoNames: string[];
};

function spreadsheetSafe(value: string) {
  return /^[=+@\-]/.test(value) ? "'" + value : value;
}

function csvCell(value: string) {
  return '"' + spreadsheetSafe(value).replaceAll('"', '""') + '"';
}

function parseRows(csv: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const source = csv.replace(/^\uFEFF/, "");

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (quoted) {
      if (ch === '"') {
        if (source[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else quoted = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }

  if (quoted) throw new Error("CSV contains an unterminated quoted field.");
  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows.filter((current) => current.some((value) => value.trim()));
}

function clean(value: string, max = 160) {
  return value.trim().slice(0, max);
}

function baseName(value: string) {
  return value.replaceAll("\\", "/").split("/").pop()?.trim() || "";
}

export function bulkPersonalizationTemplateCsv() {
  return [
    BULK_TEMPLATE_COLUMNS.map(csvCell).join(","),
    ["001", "Sample Name", "Winner", "Annual Event 2026", "001.jpg"]
      .map(csvCell)
      .join(","),
  ].join("\r\n") + "\r\n";
}

export function inspectBulkPersonalizationCsv(
  csv: string,
  uploadedPhotoNames: readonly string[] = [],
): BulkPersonalizationInspection {
  const issues: BulkPersonalizationIssue[] = [];
  let parsed: string[][] = [];
  try {
    parsed = parseRows(csv);
  } catch (error) {
    return {
      rows: [],
      matchedPhotoNames: [],
      issues: [
        {
          kind: "error",
          message: error instanceof Error ? error.message : "Invalid CSV.",
        },
      ],
    };
  }

  if (parsed.length < 2)
    return {
      rows: [],
      matchedPhotoNames: [],
      issues: [{ kind: "error", message: "CSV has no personalisation rows." }],
    };

  const header = parsed[0].map((value) => value.trim().toLowerCase());
  if (
    header.length !== BULK_TEMPLATE_COLUMNS.length ||
    BULK_TEMPLATE_COLUMNS.some((column, index) => header[index] !== column)
  )
    return {
      rows: [],
      matchedPhotoNames: [],
      issues: [
        {
          kind: "error",
          message:
            "CSV header must be record_id,name,line1,line2,photo_filename.",
        },
      ],
    };

  if (parsed.length - 1 > 1000)
    issues.push({
      kind: "error",
      message: "A Shop bulk CSV may contain at most 1000 records.",
    });

  const rows: BulkPersonalizationRow[] = [];
  const ids = new Set<string>();
  for (let index = 1; index < parsed.length; index += 1) {
    const source = parsed[index];
    while (source.length < BULK_TEMPLATE_COLUMNS.length) source.push("");
    if (source.length > BULK_TEMPLATE_COLUMNS.length) {
      issues.push({
        kind: "error",
        row: index + 1,
        message: "Row has too many columns.",
      });
      continue;
    }

    const recordId = clean(source[0], 80);
    if (!recordId) {
      issues.push({
        kind: "error",
        row: index + 1,
        message: "record_id is required.",
      });
      continue;
    }
    const normalizedId = recordId.toLowerCase();
    if (ids.has(normalizedId)) {
      issues.push({
        kind: "error",
        row: index + 1,
        message: "Duplicate record_id: " + recordId,
      });
      continue;
    }
    ids.add(normalizedId);

    rows.push({
      recordId,
      name: clean(source[1], 120),
      line1: clean(source[2], 180),
      line2: clean(source[3], 180),
      photoFilename: baseName(clean(source[4], 200)),
    });
  }

  const uploaded = new Map<string, number>();
  for (const raw of uploadedPhotoNames) {
    const name = baseName(raw).toLowerCase();
    if (!name) continue;
    uploaded.set(name, (uploaded.get(name) || 0) + 1);
  }
  for (const [name, count] of uploaded) {
    if (count > 1)
      issues.push({
        kind: "error",
        message: 'More than one uploaded photo is named "' + name + '".',
      });
  }

  const referenced = new Set(
    rows
      .map((row) => row.photoFilename.toLowerCase())
      .filter(Boolean),
  );
  for (const row of rows) {
    if (!row.photoFilename) continue;
    const count = uploaded.get(row.photoFilename.toLowerCase()) || 0;
    if (count === 0)
      issues.push({
        kind: "error",
        message:
          'Missing uploaded photo "' +
          row.photoFilename +
          '" for record ' +
          row.recordId +
          ".",
      });
  }
  for (const name of uploaded.keys()) {
    if (!referenced.has(name))
      issues.push({
        kind: "warning",
        message: 'Uploaded photo "' + name + '" is not referenced by the CSV.',
      });
  }

  return {
    rows,
    issues,
    matchedPhotoNames: [...referenced].filter(
      (name) => (uploaded.get(name) || 0) === 1,
    ),
  };
}
