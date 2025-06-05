
# AutoInspect - Aplicación de Inspección Vehicular

AutoInspect es una aplicación web progresiva (PWA) diseñada para realizar inspecciones de vehículos de manera eficiente. Permite a los usuarios ingresar detalles de la inspección y del vehículo, capturar múltiples fotografías y generar un informe detallado en formato PDF. Toda la información se almacena localmente en el navegador del usuario, garantizando la privacidad y el funcionamiento offline.

## Características Principales

*   **Flujo de Inspección Guiado:** Un asistente de varios pasos guía al usuario a través del proceso de inspección:
    *   Detalles del Inspector y Asegurado.
    *   Detalles del Vehículo (soporte para múltiples vehículos por inspección).
    *   Captura de Fotografías por categorías.
    *   Resumen y Confirmación.
*   **Generación de PDF:** Crea informes de inspección profesionales en formato PDF con todos los datos y fotos.
*   **Almacenamiento Local:** Todas las inspecciones y fotos se guardan directamente en el `localStorage` del navegador, permitiendo el acceso offline y manteniendo la privacidad de los datos.
*   **Gestión de Inspecciones:**
    *   Visualización de inspecciones guardadas.
    *   Edición de inspecciones existentes.
    *   Eliminación de inspecciones.
    *   Re-descarga o re-generación de PDFs.
*   **Interfaz de Usuario Moderna:** Diseño limpio y responsivo utilizando Tailwind CSS y Lucide Icons.
*   **Personalización Básica:** Configuración de nombre de agente predeterminado.
*   **Guía de Usuario Integrada:** Documentación dentro de la aplicación para ayudar a los usuarios.

## Tecnologías Utilizadas

*   **React:** Biblioteca de JavaScript para construir la interfaz de usuario.
*   **TypeScript:** Superset de JavaScript que añade tipado estático.
*   **Tailwind CSS:** Framework CSS de utilidad para un diseño rápido y responsivo.
    *   *Nota: Actualmente se usa el CDN de Tailwind para desarrollo. Para producción, se recomienda instalarlo como un plugin de PostCSS o usar la CLI de Tailwind.*
*   **React Router:** Para la gestión de rutas y navegación en la aplicación (usando `HashRouter`).
*   **jsPDF & jspdf-autotable:** Para la generación de documentos PDF.
*   **Lucide Icons:** Set de iconos SVG.
*   **ESM (ES Modules) via `esm.sh`:** Para la carga de dependencias directamente en el navegador a través de `importmap`.

## Estructura del Proyecto (Simplificada)

```
/
├── public/
│   └── (Archivos estáticos si los hubiera, ej. favicon)
├── src/
│   ├── components/     # Componentes reutilizables (Botones, Modales, etc.)
│   ├── screens/        # Componentes de pantalla (Vistas principales)
│   ├── services/       # Lógica de negocio (LocalStorage, PDF)
│   ├── App.tsx         # Componente principal y configuración de rutas/contexto
│   ├── constants.ts    # Constantes de la aplicación
│   ├── index.tsx       # Punto de entrada de React
│   ├── types.ts        # Definiciones de tipos de TypeScript
│   └── metadata.json   # Metadatos de la aplicación
├── index.html          # Archivo HTML principal (incluye importmap)
└── README.md           # Esta documentación
```

## Configuración y Ejecución

Esta aplicación está diseñada para ejecutarse directamente en un navegador que soporte ES Modules y `importmap`. No requiere un proceso de compilación complejo para desarrollo básico.

1.  **Clonar el Repositorio (si aplica):**
    ```bash
    git clone <URL_DEL_REPOSITORIO>
    cd <NOMBRE_DEL_DIRECTORIO>
    ```
2.  **Servir los Archivos:**
    Puedes usar cualquier servidor HTTP simple para servir los archivos estáticos (`index.html`, `src/index.tsx`, etc.) desde la raíz del proyecto. Algunas opciones:
    *   **Live Server (Extensión de VS Code):** Si usas VS Code, la extensión "Live Server" es una forma muy sencilla de lanzar la aplicación. Haz clic derecho en `index.html` y selecciona "Open with Live Server".
    *   **Python HTTP Server:**
        ```bash
        python -m http.server 8000
        ```
        Luego abre `http://localhost:8000` en tu navegador.
    *   **Node.js `http-server`:**
        ```bash
        npx http-server -p 8000
        ```
        Luego abre `http://localhost:8000` en tu navegador.

3.  **API Key (Si se usaran servicios externos que la requieran):**
    Actualmente, la aplicación no utiliza APIs externas que requieran una API key directamente visible o configurable por el usuario en el frontend. *Si se integrara una API como Gemini, esta esperaría que `process.env.API_KEY` estuviera configurada en el entorno de ejecución.* Para esta aplicación PWA basada en cliente, este tipo de clave debería manejarse a través de un backend o un servicio proxy para mantenerla segura.

## Consideraciones y Posibles Mejoras Futuras

*   **Build para Producción:** Para un despliegue en producción, se recomienda:
    *   Minificar el código JavaScript/CSS.
    *   Procesar Tailwind CSS con su CLI o como plugin de PostCSS para purgar clases no usadas y optimizar el CSS.
    *   Considerar un empaquetador como Vite o Webpack si la complejidad de la aplicación crece significativamente.
*   **Gestión de Estado Avanzada:** Para aplicaciones más grandes, se podría considerar una librería de gestión de estado más robusta (Zustand, Redux Toolkit).
*   **Backend y Sincronización en la Nube:** Para persistencia de datos más allá del `localStorage` y funcionalidades multi-dispositivo, se necesitaría un backend.
*   **Pruebas (Testing):** Implementar pruebas unitarias y de integración.
*   **Optimización de Imágenes:** Antes de guardar en Base64, se podrían aplicar compresiones o redimensionamientos para optimizar el uso de `localStorage`.
*   **Alternativas a `localStorage`:** Para datos más grandes o más estructurados, `IndexedDB` podría ser una mejor opción.

## Contribuciones

Las contribuciones son bienvenidas. Por favor, sigue las guías estándar de contribución (fork, branch, pull request).

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LicenseScreen.tsx` o la sección correspondiente en la documentación de la app para más detalles.
*(Podrías crear un archivo LICENSE en la raíz con el texto de la licencia que tienes en `LicenseScreen.tsx`).*
