import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import RequirePermission from "../../components/auth/RequirePermission";
import StaffNav from "../../components/staff/StaffNav";
import { downloadBlob, exportReadingListCSV, exportCatalogCSV, parseFile, validateRows, importRows, generateErrorReportCSV, detectXLSXSupport } from "../../services/dataIO";
import { getAllGenres, getAllTags } from "../../services/taxonomy";
import { getBooks } from "../../services/api";
import "./staffImportExport.css";

// Helper components in this file for simplicity and cohesion

function FileDropzone({ onFile, accept = ".csv,.xlsx" }) {
  const { t } = useTranslation();
  const [isOver, setIsOver] = useState(false);
  const onDrop = (e) => {
    e.preventDefault();
    setIsOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  };
  const onSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };
  return (
    <div className="dropzone-wrapper">
      <div
        className={`dropzone ${isOver ? "over" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsOver(true);
        }}
        onDragLeave={() => setIsOver(false)}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        aria-label={t("drag_and_drop")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") e.currentTarget.querySelector("input")?.click();
        }}
      >
        <p>{t("drag_and_drop")}</p>
        <input
          type="file"
          accept={accept}
          onChange={onSelect}
          aria-label={t("upload_file")}
          tabIndex={0}
        />
      </div>
    </div>
  );
}

function MappingPreview({ rows }) {
  const headers = ["title", "author", "isbn", "description", "publishedYear", "genres", "tags", "coverUrl"];
  const preview = useMemo(() => rows.slice(0, 10), [rows]);
  return (
    <div className="mapping-preview">
      <table>
        <thead>
          <tr>{headers.map(h => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {preview.map((r, idx) => (
            <tr key={idx}>
              <td>{r.title}</td>
              <td>{r.author}</td>
              <td>{r.isbn}</td>
              <td className="ellipsis">{r.description}</td>
              <td>{r.publishedYear}</td>
              <td>{(r.genres || []).join(", ")}</td>
              <td>{(r.tags || []).join(", ")}</td>
              <td className="ellipsis">{r.coverUrl}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ImportSummary({ counts, onDownloadErrors, invalidRows }) {
  const { t } = useTranslation();
  return (
    <div className="import-summary">
      <div>{t("rows")}: {counts.total}</div>
      <div>{t("valid")}: {counts.valid}</div>
      <div>{t("invalid")}: {counts.invalid}</div>
      <div>{t("warnings")}: {counts.warnings}</div>
      {invalidRows?.length > 0 && (
        <button className="btn btn-error-outline" onClick={onDownloadErrors}>
          {t("download")} {t("errors")}
        </button>
      )}
    </div>
  );
}

function ImportTab() {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState({ rows: [], errors: [] });
  const [autoCreateMissing, setAutoCreateMissing] = useState(false);
  const [validation, setValidation] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [toast, setToast] = useState(null);

  const handleFile = async (f) => {
    setFile(f);
    const result = await parseFile(f);
    setParsed(result);
    setValidation(null);
  };

  const doValidate = async () => {
    setIsValidating(true);
    try {
      const val = await validateRows(parsed.rows, { autoCreateMissing });
      setValidation(val);
    } finally {
      setIsValidating(false);
    }
  };

  const confirmCreateMissing = async ({ genres, tags }) => {
    // Simple confirm modal using window.confirm for now
    if (genres.length === 0 && tags.length === 0) return true;
    return window.confirm(
      `${t("auto_create_missing_confirm")}\nGenres: ${genres.join(", ")}\nTags: ${tags.join(", ")}`
    );
  };

  const doImport = async () => {
    if (!validation) return;
    setIsImporting(true);
    try {
      const res = await importRows(validation.validRows, { autoCreateMissing }, confirmCreateMissing);
      setToast({
        type: res.failureCount === 0 ? "success" : "error",
        message:
          res.failureCount === 0
            ? t("import_success", { count: res.successCount })
            : t("import_failure", { success: res.successCount, failed: res.failureCount }),
      });
    } finally {
      setIsImporting(false);
    }
  };

  const downloadErrorReport = () => {
    if (validation?.invalidRows?.length) {
      const csv = generateErrorReportCSV(validation.invalidRows);
      downloadBlob("import_errors.csv", csv);
    }
  };

  return (
    <div>
      <FileDropzone onFile={handleFile} accept={detectXLSXSupport() ? ".csv,.xlsx" : ".csv"} />
      {parsed?.rows?.length > 0 && (
        <>
          <MappingPreview rows={parsed.rows} />
          <div className="controls-row">
            <label>
              <input
                type="checkbox"
                checked={autoCreateMissing}
                onChange={(e) => setAutoCreateMissing(e.target.checked)}
              />
              {t("auto_create_missing")}
            </label>
            <button className="btn" onClick={doValidate} disabled={isValidating}>
              {t("validate")}
            </button>
            {validation?.validRows?.length > 0 && (
              <button className="btn btn-primary" onClick={doImport} disabled={isImporting}>
                {t("import_n", { count: validation.validRows.length })}
              </button>
            )}
          </div>
          {validation && (
            <ImportSummary
              counts={validation.counts}
              invalidRows={validation.invalidRows}
              onDownloadErrors={downloadErrorReport}
            />
          )}
        </>
      )}
      {toast && (
        <div className={`toast ${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
}

function ExportTab() {
  const { t } = useTranslation();
  const [exportType, setExportType] = useState("readingList");
  const [format, setFormat] = useState("csv");
  const [genre, setGenre] = useState("");
  const [tag, setTag] = useState("");
  const [genres, setGenres] = useState([]);
  const [tags, setTags] = useState([]);
  const [books, setBooks] = useState([]);
  const xlsxSupported = detectXLSXSupport();

  React.useEffect(() => {
    getAllGenres().then(setGenres).catch(() => setGenres([]));
    getAllTags().then(setTags).catch(() => setTags([]));
    getBooks().then(setBooks).catch(() => setBooks([]));
  }, []);

  const doDownload = async () => {
    if (exportType === "readingList") {
      const favoritesRaw = localStorage.getItem("favorites") || "[]";
      let favorites;
      try { favorites = JSON.parse(favoritesRaw); } catch { favorites = []; }
      const csv = await exportReadingListCSV({ favorites, allBooks: books });
      downloadBlob("reading_list.csv", csv, "text/csv;charset=utf-8");
    } else {
      const csv = await exportCatalogCSV({ filterGenre: genre || undefined, filterTag: tag || undefined });
      downloadBlob("library_catalog.csv", csv, "text/csv;charset=utf-8");
    }
  };

  return (
    <div className="export-tab">
      <div className="controls-grid">
        <label>
          {t("export_type")}
          <select value={exportType} onChange={(e) => setExportType(e.target.value)}>
            <option value="readingList">{t("reading_list")}</option>
            <option value="catalog">{t("library_catalog")}</option>
          </select>
        </label>
        <label>
          {t("format")}
          <select value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="csv">CSV</option>
            {xlsxSupported && <option value="xlsx">XLSX</option>}
          </select>
        </label>
        <label>
          {t("filter_genre")}
          <select value={genre} onChange={(e) => setGenre(e.target.value)}>
            <option value="">{t("all")}</option>
            {genres.map(g => <option key={g.id || g.name} value={g.name}>{g.name}</option>)}
          </select>
        </label>
        <label>
          {t("filter_tag")}
          <select value={tag} onChange={(e) => setTag(e.target.value)}>
            <option value="">{t("all")}</option>
            {tags.map(tg => <option key={tg.id || tg.name} value={tg.name}>{tg.name}</option>)}
          </select>
        </label>
      </div>
      <button className="btn btn-primary" onClick={doDownload}>{t("download")}</button>
      {format === "xlsx" && (
        <p className="hint">{t("xlsx_notice")}</p>
      )}
    </div>
  );
}

function StaffImportExportPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState("import");

  return (
    <ProtectedRoute>
      <RequirePermission permission="manage_inventory">
        <div className="staff-layout">
          <StaffNav />
          <div className="staff-content card">
            <h1>{t("import_export")}</h1>
            <div className="tabs">
              <button
                className={`tab ${tab === "import" ? "active" : ""}`}
                onClick={() => setTab("import")}
              >
                {t("import")}
              </button>
              <button
                className={`tab ${tab === "export" ? "active" : ""}`}
                onClick={() => setTab("export")}
              >
                {t("export")}
              </button>
            </div>
            {tab === "import" ? <ImportTab /> : <ExportTab />}
          </div>
        </div>
      </RequirePermission>
    </ProtectedRoute>
  );
}

export default StaffImportExportPage;
