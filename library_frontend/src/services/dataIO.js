import { getAllGenres, getAllTags, createGenre, createTag } from "./taxonomy";
import { getBooks, upsertBookByISBN } from "./api";

/**
 * Utility: simple CSV parse and stringify without external deps.
 * Handles basic quoted fields and commas.
 */
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        row.push(field);
        field = "";
      } else if (char === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else if (char === "\r") {
        // swallow CR (handle CRLF)
      } else {
        field += char;
      }
    }
  }
  // flush last field
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function toCSVValue(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// PUBLIC_INTERFACE
export function stringifyCSV(rows) {
  /** Convert array of objects (or arrays) into CSV string with header if objects. */
  if (!rows || rows.length === 0) return "";
  if (Array.isArray(rows[0])) {
    return rows.map(r => r.map(toCSVValue).join(",")).join("\n");
  }
  // objects - compute header keys as union preserving order of first row
  const header = Object.keys(rows[0]);
  const out = [];
  out.push(header.map(toCSVValue).join(","));
  for (const obj of rows) {
    out.push(header.map(k => toCSVValue(obj[k])).join(","));
  }
  return out.join("\n");
}

// Basic validators
const isNonEmpty = v => v !== undefined && v !== null && String(v).trim().length > 0;
const isISBN = v => !v || /^[0-9Xx\- ]{9,20}$/.test(String(v)); // permissive
const isYear = v => !v || /^\d{1,4}$/.test(String(v));
const isURL = v => {
  if (!v) return true;
  try {
    // eslint-disable-next-line no-new
    new URL(v);
    return true;
  } catch {
    return false;
  }
};

const HEADER_MAP = {
  title: "title",
  author: "author",
  isbn: "isbn",
  description: "description",
  publishedYear: "publishedYear",
  genres: "genres",
  tags: "tags",
  coverUrl: "coverUrl",
};

function normalizeHeader(h) {
  return String(h || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

// PUBLIC_INTERFACE
export function detectXLSXSupport() {
  /** Returns true if xlsx library is present (optional). */
  try {
    // Avoid static require so bundler doesn't include it
    // eslint-disable-next-line no-new-func
    const req = Function('m', 'return import(m)');
    // We don't actually import here to avoid async; just check env hint
    // Consumers will still gracefully fallback if import fails.
    if (typeof window !== "undefined" && window.__XLSX_AVAILABLE__) return true;
  } catch {
    // ignore
  }
  return false;
}

// PUBLIC_INTERFACE
export async function parseFile(file) {
  /**
   * Parse a File (CSV or XLSX if supported).
   * Returns { rows: parsed[], headers, errors: [ {rowNumber, message} ] }
   */
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) {
    const text = await file.text();
    return parseCSVText(text);
  }
  if (name.endsWith(".xlsx")) {
    try {
      // dynamic import; will fail if not installed
      const XLSX = await import(/* webpackIgnore: true */ 'xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
      const textLike = stringifyCSV(json);
      return parseCSVText(textLike);
    } catch {
      // fallback: treat as unsupported and return proper error
      return {
        rows: [],
        headers: [],
        errors: [{ rowNumber: 0, message: "File type not supported" }],
      };
    }
  }
  return {
    rows: [],
    headers: [],
    errors: [{ rowNumber: 0, message: "File type not supported" }],
  };
}

function parseCSVText(text) {
  const table = parseCSV(text);
  if (table.length === 0) {
    return { rows: [], headers: [], errors: [{ rowNumber: 0, message: "Empty file" }] };
  }
  const headerRow = table[0].map(h => normalizeHeader(h));
  const headers = table[0];

  const colIndex = {};
  headerRow.forEach((h, idx) => {
    const mapped = HEADER_MAP[h] || h;
    colIndex[mapped] = idx;
  });

  const rows = [];
  const errors = [];

  for (let r = 1; r < table.length; r++) {
    const raw = table[r];
    if (raw.length === 1 && String(raw[0]).trim() === "") continue;
    const rowObj = {
      title: raw[colIndex.title] ?? "",
      author: raw[colIndex.author] ?? "",
      isbn: raw[colIndex.isbn] ?? "",
      description: raw[colIndex.description] ?? "",
      publishedYear: raw[colIndex.publishedYear] ?? "",
      genres: (raw[colIndex.genres] ?? "").split(",").map(s => s.trim()).filter(Boolean),
      tags: (raw[colIndex.tags] ?? "").split(",").map(s => s.trim()).filter(Boolean),
      coverUrl: raw[colIndex.coverUrl] ?? "",
      _rowNumber: r + 1, // 1-based with header
    };
    rows.push(rowObj);
  }

  return { rows, headers, errors };
}

// PUBLIC_INTERFACE
export async function validateRows(rows, { autoCreateMissing = false } = {}) {
  /**
   * Validate rows for required fields and field formats
   * Returns { validRows, invalidRows, warnings, counts }
   */
  const invalidRows = [];
  const validRows = [];
  const warnings = [];

  const [existingGenres, existingTags] = await Promise.all([getAllGenres(), getAllTags()]);
  const genreSet = new Set(existingGenres.map(g => (g.name || g).toLowerCase()));
  const tagSet = new Set(existingTags.map(t => (t.name || t).toLowerCase()));

  for (const row of rows) {
    const rowErrors = [];
    const rowWarnings = [];

    if (!isNonEmpty(row.title)) rowErrors.push("Missing required: title");
    if (!isNonEmpty(row.author)) rowErrors.push("Missing required: author");
    if (!isISBN(row.isbn)) rowErrors.push("Invalid ISBN");
    if (!isYear(row.publishedYear)) rowErrors.push("Invalid year");
    if (!isURL(row.coverUrl)) rowErrors.push("Invalid coverUrl");

    const unknownGenres = (row.genres || []).filter(g => !genreSet.has(g.toLowerCase()));
    const unknownTags = (row.tags || []).filter(t => !tagSet.has(t.toLowerCase()));

    if ((unknownGenres.length || unknownTags.length) && !autoCreateMissing) {
      if (unknownGenres.length) rowWarnings.push(`Unknown genres: ${unknownGenres.join("; ")}`);
      if (unknownTags.length) rowWarnings.push(`Unknown tags: ${unknownTags.join("; ")}`);
    }

    if (rowErrors.length > 0) {
      invalidRows.push({ ...row, _errors: rowErrors, _warnings: rowWarnings });
    } else {
      validRows.push({ ...row, _warnings: rowWarnings });
    }
    if (rowWarnings.length > 0) {
      warnings.push({ rowNumber: row._rowNumber, messages: rowWarnings });
    }
  }

  const counts = {
    total: rows.length,
    valid: validRows.length,
    invalid: invalidRows.length,
    warnings: warnings.length,
  };

  return { validRows, invalidRows, warnings, counts };
}

// PUBLIC_INTERFACE
export async function importRows(rows, { autoCreateMissing = false } = {}, confirmCreateMissingCb) {
  /**
   * Import rows:
   * - Optionally create missing tags/genres (after external confirmation via callback)
   * - Upsert books by ISBN via API (or mock)
   * Returns { successCount, failureCount, errors: [] }
   */
  const [existingGenres, existingTags] = await Promise.all([getAllGenres(), getAllTags()]);
  const genreSet = new Set(existingGenres.map(g => (g.name || g).toLowerCase()));
  const tagSet = new Set(existingTags.map(t => (t.name || t).toLowerCase()));

  const toCreateGenres = new Set();
  const toCreateTags = new Set();

  for (const row of rows) {
    (row.genres || []).forEach(g => {
      if (!genreSet.has(g.toLowerCase())) toCreateGenres.add(g);
    });
    (row.tags || []).forEach(t => {
      if (!tagSet.has(t.toLowerCase())) toCreateTags.add(t);
    });
  }

  if ((toCreateGenres.size || toCreateTags.size) && autoCreateMissing) {
    const proceed = await (confirmCreateMissingCb
      ? confirmCreateMissingCb({
          genres: Array.from(toCreateGenres),
          tags: Array.from(toCreateTags),
        })
      : Promise.resolve(true));
    if (proceed) {
      for (const g of toCreateGenres) {
        // eslint-disable-next-line no-await-in-loop
        await createGenre({ name: g });
        genreSet.add(g.toLowerCase());
      }
      for (const t of toCreateTags) {
        // eslint-disable-next-line no-await-in-loop
        await createTag({ name: t });
        tagSet.add(t.toLowerCase());
      }
    }
  }

  let successCount = 0;
  let failureCount = 0;
  const errors = [];

  for (const row of rows) {
    const payload = {
      title: row.title,
      author: row.author,
      isbn: row.isbn || undefined,
      description: row.description || "",
      publishedYear: row.publishedYear ? Number(row.publishedYear) : undefined,
      genres: row.genres || [],
      tags: row.tags || [],
      coverUrl: row.coverUrl || "",
    };
    try {
      // eslint-disable-next-line no-await-in-loop
      await upsertBookByISBN(payload);
      successCount++;
    } catch (e) {
      failureCount++;
      errors.push({ rowNumber: row._rowNumber, message: e?.message || "Failed to upsert" });
    }
  }

  return { successCount, failureCount, errors };
}

// PUBLIC_INTERFACE
export async function exportReadingListCSV({ favorites = [], allBooks = [] }) {
  /**
   * Export user's reading list (favorites).
   * favorites: array of isbn or ids stored in localStorage by app
   * allBooks: optional, if provided to enrich title/author
   */
  const booksMap = new Map();
  (allBooks || []).forEach(b => {
    if (b.isbn) booksMap.set(String(b.isbn), b);
  });

  const rows = [];
  rows.push({
    title: "title",
    author: "author",
    isbn: "isbn",
    description: "description",
    publishedYear: "publishedYear",
    genres: "genres",
    tags: "tags",
    coverUrl: "coverUrl",
    addedAt: "addedAt",
  });

  favorites.forEach(f => {
    const fav = typeof f === "object" ? f : { isbn: f };
    const b = fav.isbn ? booksMap.get(String(fav.isbn)) : undefined;
    rows.push({
      title: b?.title || fav.title || "",
      author: b?.author || fav.author || "",
      isbn: b?.isbn || fav.isbn || "",
      description: b?.description || "",
      publishedYear: b?.publishedYear || "",
      genres: (b?.genres || []).join(", "),
      tags: (b?.tags || []).join(", "),
      coverUrl: b?.coverUrl || "",
      addedAt: fav.addedAt || new Date().toISOString(),
    });
  });

  // Convert rows to CSV (first element is header row object)
  const header = rows[0];
  const body = rows.slice(1);
  const csv = stringifyCSV([header, ...body]);
  return csv;
}

// PUBLIC_INTERFACE
export async function exportCatalogCSV({ filterGenre, filterTag } = {}) {
  /**
   * Export entire catalog via API if available; else returns empty CSV with headers.
   */
  let books = [];
  try {
    books = await getBooks();
  } catch {
    books = [];
  }
  if (filterGenre) {
    books = books.filter(b => (b.genres || []).map(g => g.toLowerCase()).includes(filterGenre.toLowerCase()));
  }
  if (filterTag) {
    books = books.filter(b => (b.tags || []).map(t => t.toLowerCase()).includes(filterTag.toLowerCase()));
  }

  const header = {
    title: "title",
    author: "author",
    isbn: "isbn",
    description: "description",
    publishedYear: "publishedYear",
    genres: "genres",
    tags: "tags",
    coverUrl: "coverUrl",
  };
  const body = books.map(b => ({
    title: b.title || "",
    author: b.author || "",
    isbn: b.isbn || "",
    description: b.description || "",
    publishedYear: b.publishedYear || "",
    genres: (b.genres || []).join(", "),
    tags: (b.tags || []).join(", "),
    coverUrl: b.coverUrl || "",
  }));
  return stringifyCSV([header, ...body]);
}

// PUBLIC_INTERFACE
export function downloadBlob(filename, text, mime = "text/csv;charset=utf-8") {
  /** Trigger a download from text content */
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}

// PUBLIC_INTERFACE
export function generateErrorReportCSV(invalidRows) {
  /** Create CSV report for invalid rows with messages */
  const header = ["rowNumber", "title", "author", "isbn", "messages"];
  const rows = invalidRows.map(r => [
    r._rowNumber,
    r.title,
    r.author,
    r.isbn,
    (r._errors || []).join(" | "),
  ]);
  return stringifyCSV([header, ...rows]);
}
