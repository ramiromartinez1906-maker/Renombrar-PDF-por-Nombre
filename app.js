import * as pdfjsLib from "./pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = "./pdf.worker.min.mjs";

const NAME_PATTERN = /(\d{9}\/\d\/\d{3})\s+(.+?)\s+(\d{2}-\d{8}-\d)/s;
const CUIL_PATTERN = /\b\d{2}-\d{8}-\d\b/;
const BENEFICIARIO_PATTERN = /Beneficiario:\s*(?:\r?\n\s*)?(\d{2}-\d{8}-\d)/i;

const modeHelp = document.querySelector("#modeHelp");
const modeSelect = document.querySelector("#modeSelect");
const fileInput = document.querySelector("#fileInput");
const folderInput = document.querySelector("#folderInput");
const fileCount = document.querySelector("#fileCount");
const processButton = document.querySelector("#processButton");
const message = document.querySelector("#message");
const report = document.querySelector("#report");

let selectedFiles = [];

function sanitizeName(name) {
  return name.replace(/[<>:"/\\|?*]/g, "_").trim();
}

function nextAvailableName(baseName, usedNames) {
  if (!usedNames.has(baseName)) {
    usedNames.add(baseName);
    return baseName;
  }

  const dotIndex = baseName.toLowerCase().lastIndexOf(".pdf");
  const stem = dotIndex >= 0 ? baseName.slice(0, dotIndex) : baseName;
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

function setMessage(text) {
  message.hidden = !text;
  message.textContent = text || "";
}

function renderReport(items) {
  report.innerHTML = "";
  report.hidden = items.length === 0;

  for (const item of items) {
    const row = document.createElement("div");
    row.className = `report-item ${item.status}`;

    const title = document.createElement("strong");
    title.textContent = item.file;

    const detail = document.createElement("span");
    detail.textContent = item.output;

    row.append(title, detail);
    report.appendChild(row);
  }
}

function updateMode(nextMode) {
  modeHelp.textContent =
    nextMode === "nombre"
      ? "Busca el campo Apellido y Nombres dentro del PDF."
      : "Busca el CUIL dentro del PDF, priorizando el campo Beneficiario.";
}

function updateFileList(incomingFiles) {
  const pdfFiles = incomingFiles.filter(
    (file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );

  selectedFiles = pdfFiles;
  fileCount.textContent = `${selectedFiles.length} archivo(s) listo(s)`;
  setMessage(
    pdfFiles.length === incomingFiles.length ? "" : "Se ignoraron los archivos que no eran PDF."
  );
  renderReport([]);
}

async function extractTextFromPages(file, pageCount) {
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const totalPages = Math.min(pdf.numPages, pageCount);
  const chunks = [];

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    chunks.push(content.items.map((item) => item.str).join(" "));
  }

  return chunks.join("\n");
}

async function extractName(file) {
  const text = await extractTextFromPages(file, 1);
  const match = text.match(NAME_PATTERN);

  if (!match) {
    throw new Error("No se pudo encontrar el campo Apellido y Nombres.");
  }

  const normalizedName = sanitizeName(match[2].replace(/\s+/g, " "));
  if (!normalizedName) {
    throw new Error("El nombre extraido esta vacio.");
  }

  return normalizedName;
}

async function extractCuil(file) {
  const text = await extractTextFromPages(file, 2);
  const beneficiarioMatch = text.match(BENEFICIARIO_PATTERN);
  if (beneficiarioMatch) {
    return beneficiarioMatch[1];
  }

  const cuilMatch = text.match(CUIL_PATTERN);
  if (cuilMatch) {
    return cuilMatch[0];
  }

  throw new Error("No se pudo encontrar un CUIL dentro del PDF.");
}

async function processFiles() {
  if (selectedFiles.length === 0) {
    alert("Subi al menos un PDF.");
    return;
  }

  processButton.disabled = true;
  processButton.textContent = "Procesando...";
  setMessage("");
  renderReport([]);

  try {
    const zip = new window.JSZip();
    const usedNames = new Set();
    const summary = [];
    const reportLines = [];
    const mode = modeSelect.value;

    for (const file of selectedFiles) {
      try {
        const baseName = mode === "cuil" ? await extractCuil(file) : await extractName(file);
        const finalName = nextAvailableName(`${baseName}.pdf`, usedNames);
        zip.file(finalName, file);
        summary.push({ file: file.name, status: "ok", output: finalName });
        reportLines.push(`${file.name} -> ${finalName}`);
      } catch (error) {
        const detail = error?.message || "No se pudo procesar el archivo";
        summary.push({ file: file.name, status: "error", output: detail });
        reportLines.push(`${file.name} -> ERROR: ${detail}`);
      }
    }

    const processedCount = summary.filter((item) => item.status === "ok").length;
    if (processedCount === 0) {
      throw new Error("No se pudo generar ningun archivo renombrado.");
    }

    zip.file("reporte.txt", reportLines.join("\n"));

    const blob = await zip.generateAsync({ type: "blob" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = mode === "cuil" ? "resultado-por-cuil.zip" : "resultado-por-nombre.zip";
    link.click();
    window.URL.revokeObjectURL(url);

    renderReport(summary);
    setMessage(
      processedCount === selectedFiles.length
        ? "El ZIP se descargo correctamente."
        : `El ZIP se descargo con ${processedCount} archivo(s) procesado(s).`
    );
  } catch (error) {
    setMessage(error?.message || "Ocurrio un error al procesar los archivos.");
  } finally {
    processButton.disabled = false;
    processButton.textContent = "Procesar archivos";
  }
}

fileInput.addEventListener("change", (event) => {
  updateFileList(Array.from(event.target.files || []));
});

folderInput.addEventListener("change", (event) => {
  updateFileList(Array.from(event.target.files || []));
});

modeSelect.addEventListener("change", () => {
  updateMode(modeSelect.value);
});

processButton.addEventListener("click", () => {
  processFiles();
});

updateMode(modeSelect.value);
