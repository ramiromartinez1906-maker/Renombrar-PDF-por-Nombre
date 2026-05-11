# Procesador nombre-CUIL para GitHub

Esta carpeta contiene la version lista para publicar en GitHub Pages.

## Diferencia con la version local

- Mantiene el modelo nuevo de renombrado por `Nombre` o por `CUIL`.
- Procesa todo dentro del navegador.
- No usa Python ni servidor.

## Como publicarla

1. Crear un repositorio nuevo en GitHub.
2. Subir el contenido completo de esta carpeta.
3. Agregar el workflow de GitHub Pages si queres URL publica automatica.

## Archivos incluidos

- `index.html`
- `styles.css`
- `app.js`
- `jszip.min.js`
- `pdf.min.mjs`
- `pdf.worker.min.mjs`

## Funcionamiento

- `Nombre`: busca el campo `Apellido y Nombres` en la primera pagina.
- `CUIL`: busca primero `Beneficiario: ##-########-#` y, si no existe, cualquier CUIL dentro de las primeras dos paginas.
