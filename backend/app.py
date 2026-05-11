from __future__ import annotations

import shutil
import uuid
import zipfile
from pathlib import Path

from flask import Flask, jsonify, request, send_file, send_from_directory

try:
    from .procesar_recibos_por_nombre import procesar_carpeta
except ImportError:
    from procesar_recibos_por_nombre import procesar_carpeta


BASE_DIR = Path(__file__).resolve().parent
UPLOAD_FOLDER = BASE_DIR / "uploads"
OUTPUT_FOLDER = BASE_DIR / "outputs"
FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"

UPLOAD_FOLDER.mkdir(exist_ok=True)
OUTPUT_FOLDER.mkdir(exist_ok=True)

app = Flask(
    __name__,
    static_folder=str(FRONTEND_DIST / "assets"),
    static_url_path="/assets",
)


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response


@app.get("/")
def index():
    return send_from_directory(FRONTEND_DIST, "index.html")


@app.get("/<path:path>")
def frontend_files(path: str):
    archivo = FRONTEND_DIST / path
    if archivo.exists() and archivo.is_file():
        return send_from_directory(FRONTEND_DIST, path)
    return send_from_directory(FRONTEND_DIST, "index.html")


@app.route("/procesar", methods=["POST", "OPTIONS"])
def procesar():
    if request.method == "OPTIONS":
        return ("", 204)

    files = request.files.getlist("files")
    if not files:
        return jsonify({"error": "No se recibieron archivos"}), 400

    request_id = uuid.uuid4().hex
    carpeta_temp = UPLOAD_FOLDER / request_id
    carpeta_temp.mkdir(parents=True, exist_ok=True)

    try:
        for file in files:
            if not file.filename:
                continue
            destino = carpeta_temp / Path(file.filename).name
            file.save(destino)

        procesar_carpeta(carpeta_temp)

        carpeta_renombrados = carpeta_temp / "Renombrados"
        if not carpeta_renombrados.exists():
            return jsonify({"error": "No se generaron archivos renombrados"}), 400

        zip_path = OUTPUT_FOLDER / f"resultado-{request_id}.zip"
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            for pdf in carpeta_renombrados.glob("*.pdf"):
                zipf.write(pdf, pdf.name)

        return send_file(zip_path, as_attachment=True, download_name="resultado.zip")
    finally:
        shutil.rmtree(carpeta_temp, ignore_errors=True)


if __name__ == "__main__":
    app.run(debug=True)
