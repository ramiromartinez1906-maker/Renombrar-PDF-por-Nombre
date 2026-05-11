from __future__ import annotations

import re
import shutil
from pathlib import Path

from PyPDF2 import PdfReader


PATRON_FILA = re.compile(r"(\d{9}/\d/\d{3})\s+(.+?)\s+(\d{2}-\d{8}-\d)", re.S)
CARPETA_SALIDA = "Renombrados"


def extraer_nombre(pdf_path: Path) -> str | None:
    reader = PdfReader(str(pdf_path))
    if not reader.pages:
        return None

    text = reader.pages[0].extract_text() or ""
    match = PATRON_FILA.search(text)
    if not match:
        return None

    nombre = " ".join(match.group(2).split())
    return re.sub(r'[<>:"/\\|?*]', "_", nombre) or None


def ruta_disponible(destino: Path) -> Path:
    if not destino.exists():
        return destino

    contador = 2
    while True:
        candidata = destino.with_name(f"{destino.stem} ({contador}){destino.suffix}")
        if not candidata.exists():
            return candidata
        contador += 1


def procesar_carpeta(carpeta: Path) -> None:
    carpeta = Path(carpeta)
    if not carpeta.exists():
        raise FileNotFoundError(f"La ruta no existe: {carpeta}")
    if not carpeta.is_dir():
        raise NotADirectoryError(f"La ruta no es una carpeta: {carpeta}")

    salida = carpeta / CARPETA_SALIDA
    if salida.exists():
        shutil.rmtree(salida)
    salida.mkdir(exist_ok=True)

    for pdf in sorted(carpeta.glob("*.pdf")):
        nombre = extraer_nombre(pdf)
        if not nombre:
            continue

        destino = ruta_disponible(salida / f"{nombre}{pdf.suffix.lower()}")
        shutil.copy2(pdf, destino)
