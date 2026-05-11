import { useState } from "react";
import JSZip from "jszip";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const ROW_PATTERN = /(\d{9}\/\d\/\d{3})\s+(.+?)\s+(\d{2}-\d{8}-\d)/s;

function sanitizeName(name) {
  return name.replace(/[<>:"/\\|?*]/g, "_").trim();
}

function nextAvailableName(baseName, usedNames) {
  if (!usedNames.has(baseName)) {
    usedNames.add(baseName);
    return baseName;
  }

  const stem = baseName.replace(/\.pdf$/i, "");
  let counter = 2;
  while (true) {
    const candidate = `${stem} (${counter}).pdf`;
    if (!usedNames.has(candidate)) {
      usedNames.add(candidate);
      return candidate;
    }
    counter += 1;
  }
}

async function extractNameFromPdf(file) {
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const page = await pdf.getPage(1);
  const content = await page.getTextContent();
  const text = content.items.map((item) => item.str).join(" ");
  const match = text.match(ROW_PATTERN);

  if (!match) {
    throw new Error("No se pudo encontrar el campo Apellido y Nombres.");
  }

  const normalizedName = sanitizeName(match[2].replace(/\s+/g, " "));
  if (!normalizedName) {
    throw new Error("El nombre extraido esta vacio.");
  }

  return normalizedName;
}

export default function App() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [report, setReport] = useState([]);

  const handleSubmit = async () => {
    if (files.length === 0) {
      alert("Subi al menos un PDF");
      return;
    }

    setLoading(true);
    setMessage("");
    setReport([]);

    try {
      const zip = new JSZip();
      const usedNames = new Set();
      const summary = [];

      for (const file of files) {
        try {
          const extractedName = await extractNameFromPdf(file);
          const finalName = nextAvailableName(`${extractedName}.pdf`, usedNames);
          zip.file(finalName, file);
          summary.push({ file: file.name, status: "ok", output: finalName });
        } catch (error) {
          summary.push({
            file: file.name,
            status: "error",
            output: error.message || "No se pudo procesar el archivo",
          });
        }
      }

      const processedCount = summary.filter((item) => item.status === "ok").length;
      if (processedCount === 0) {
        throw new Error("No se pudo generar ningun archivo renombrado.");
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "resultado.zip";
      a.click();
      window.URL.revokeObjectURL(url);

      setReport(summary);
      setMessage(
        processedCount === files.length
          ? "El ZIP se descargo correctamente."
          : `El ZIP se descargo con ${processedCount} archivo(s) procesado(s).`
      );
    } catch (error) {
      setMessage(error.message || "Ocurrio un error al procesar los archivos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <section className="panel">
        <p className="eyebrow">Renombrado automatico</p>
        <h1>Procesador de PDFs por nombre</h1>
        <p className="lead">
          Subi varios recibos en PDF y descarga un ZIP con las copias renombradas
          usando el campo <strong>Apellido y Nombres</strong>. Todo se procesa en
          tu navegador, sin servidor ni backend.
        </p>

        <label className="dropzone">
          <span>Seleccionar PDFs</span>
          <input
            type="file"
            multiple
            accept="application/pdf"
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
          />
        </label>

        <div className="summary">
          <span>{files.length} archivo(s) listo(s)</span>
        </div>

        <button onClick={handleSubmit} disabled={loading} className="cta">
          {loading ? "Procesando..." : "Procesar archivos"}
        </button>

        {message ? <p className="message">{message}</p> : null}

        {report.length > 0 ? (
          <div className="report">
            {report.map((item) => (
              <div key={`${item.file}-${item.output}`} className={`report-item ${item.status}`}>
                <strong>{item.file}</strong>
                <span>{item.output}</span>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
