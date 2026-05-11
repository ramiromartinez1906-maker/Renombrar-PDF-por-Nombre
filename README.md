# Procesador de PDFs por nombre

## Aplicacion de escritorio portable

La version mas independiente es la app nativa en Python. No usa navegador, React ni servidor web.

Para abrirla en esta computadora:

```bash
cd C:\Users\Usuario\Desktop\procesador-pdfs-web
python app_escritorio.py
```

## Generar ejecutable para otra computadora

Hace doble clic en `build_exe.bat` o ejecuta:

```bash
cd C:\Users\Usuario\Desktop\procesador-pdfs-web
build_exe.bat
```

Eso crea una carpeta dentro de `dist` con todo lo necesario para enviar a otra PC Windows.

La carpeta a compartir sera:

```bash
dist\Procesador de PDFs por nombre
```

En esa carpeta vas a encontrar el `.exe` y las dependencias incluidas. Para que funcione en otra computadora, conviene enviar la carpeta completa, no solo el `.exe`.

## Recomendacion

- Si queres maxima compatibilidad, comparti la carpeta completa generada en `dist`.
- Si la otra PC es Windows, no va a necesitar Python instalado.
- Los PDF originales no se modifican: la app genera un ZIP con las copias renombradas.

## Pagina web sin backend

Tambien tenes una version web que procesa todo dentro del navegador.

Para regenerarla:

```bash
cd frontend
npm.cmd run build
```

Despues podes abrir:

```bash
frontend\dist\index.html
```

Esa pagina no necesita Flask ni Python para funcionar. Solo abre el archivo en el navegador y procesa los PDF localmente.

## Pagina web con URL local fija

Si queres abrirla por URL en el navegador, usa:

```bash
Abrir Pagina Web.bat
```

Eso deja la pagina disponible en:

```bash
http://localhost:8000
```

Tambien podes abrir esa URL manualmente en cualquier navegador mientras el servidor local este en ejecucion.

## Subir a GitHub

La pagina web ya quedo preparada para publicarse con GitHub Pages.

Archivos importantes:

- `.github/workflows/deploy-pages.yml`
- `frontend/package.json`
- `frontend/vite.config.js`

Pasos:

1. Crea un repositorio nuevo en GitHub.
2. Sube el contenido de esta carpeta `procesador-pdfs-web`.
3. Asegurate de subirlo a la rama `main`.
4. En GitHub entra a `Settings` > `Pages`.
5. En `Source`, deja seleccionada la opcion `GitHub Actions`.
6. Hace un push nuevo a `main` o ejecuta manualmente el workflow `Deploy GitHub Pages`.

Cuando termine, GitHub te va a dar una URL publica del estilo:

```bash
https://TU-USUARIO.github.io/TU-REPOSITORIO/
```

La version publicada va a funcionar sin Flask, sin Python y sin servidor propio, porque procesa los PDF directamente en el navegador.

## Backend

```bash
cd backend
python -m pip install -r requirements.txt
python app.py
```

El backend queda en `http://localhost:5000`.

## Frontend

```bash
cd frontend
npm.cmd install
npm.cmd run dev
```

El frontend queda en `http://localhost:5173`.

Para volver a generar el frontend que usa la app de escritorio:

```bash
cd frontend
npm.cmd run build
```

## Funcionamiento

- Subis varios PDF desde la web.
- El backend crea una carpeta temporal.
- Renombra las copias usando `Apellido y Nombres`.
- Devuelve un ZIP con los archivos de `Renombrados`.
