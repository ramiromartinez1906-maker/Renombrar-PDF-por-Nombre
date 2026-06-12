# Procesador nombre-CUIL para GitHub

Esta carpeta contiene la version lista para publicar en GitHub Pages.

## Diferencia con la version local

- Mantiene el modelo nuevo de renombrado por `Nombre` o por `CUIL`.
- Procesa todo dentro del navegador.
- No usa Python ni servidor.

## Como publicarla

1. Crear un repositorio nuevo en GitHub.
2. Subir el contenido completo de esta carpeta.
3. Activar GitHub Pages desde `Settings → Pages` (fuente: `main` / `root`) o agregar un workflow para desplegar a `gh-pages`.

## Archivos incluidos

- `index.html`
- `styles.css`
- `app.js`
- `jszip.min.js`

**Nota:** `pdf.min.mjs` y `pdf.worker.min.mjs` ahora se cargan desde CDN (jsDelivr), por lo que no es necesario incluirlos en el repo. Esto evita problemas de tamaño de archivo en GitHub Pages.

## Funcionamiento

- `Nombre`: busca el campo `Apellido y Nombres` en la primera pagina.
- `CUIL`: busca primero `Beneficiario: ##-########-#` y, si no existe, cualquier CUIL dentro de las primeras dos paginas.

### Nota sobre rutas y GitHub Pages

PDF.js se carga desde **jsDelivr CDN** (no desde archivos locales), por lo que no hay problemas de rutas ni tamaño de archivo. El worker se configura automáticamente desde el mismo CDN.

Si subes estos archivos al root del repo y activas GitHub Pages en `main`/`root`, la aplicación debería funcionar correctamente.
