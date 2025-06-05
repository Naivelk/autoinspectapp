import { jsPDF } from 'jspdf';
import { SavedInspection } from '../types';

// Constantes para la generación del PDF
const PDF_OPTIONS = {
  // Diseño
  PAGE_MARGIN: 30,
  CONTENT_START_Y: 100,
  
  // Tipografía
  FONT_FAMILY: 'helvetica',
  FONT_FAMILY_BOLD: 'helvetica',
  FONT_FAMILY_ITALIC: 'helvetica',
  FONT_SIZE_TITLE: 20,
  FONT_SIZE_SUBTITLE: 16,
  FONT_SIZE_HEADER: 14,
  FONT_SIZE_NORMAL: 11,
  FONT_SIZE_SMALL: 9,
  
  // Colores
  COLOR_PRIMARY: '#2c3e50',
  COLOR_SECONDARY: '#7f8c8d',
  COLOR_TEXT: '#2c3e50',
  COLOR_TEXT_MUTED: '#7f8c8d',
  COLOR_BORDER: '#ecf0f1',
  COLOR_HEADER_BG: '#f8f9fa',
  
  // Imágenes
  MAX_IMAGE_WIDTH: 500, // Ancho máximo de las imágenes
  MAX_IMAGE_HEIGHT: 300, // Altura máxima de las imágenes
  IMAGE_QUALITY: 0.9, // Calidad de compresión (0-1)
  
  // Espaciados
  LINE_HEIGHT: 1.3,
  PARAGRAPH_SPACING: 10,
  SECTION_SPACING: 20,
  
  // Encabezado y pie de página
  HEADER_HEIGHT: 60,
  FOOTER_HEIGHT: 30
};

// Interfaz para la configuración de categorías de fotos
interface PhotoCategoryConfig {
  name: string;
  description?: string;
  order?: number; // Orden de visualización en el PDF
}

// Configuración de categorías de fotos
const PHOTO_CATEGORY_CONFIG: Record<string, PhotoCategoryConfig> = {
  front: { name: 'Vista Frontal', order: 1 },
  back: { name: 'Vista Trasera', order: 2 },
  left: { name: 'Vista Lateral Izquierda', order: 3 },
  right: { name: 'Vista Lateral Derecha', order: 4 },
  interior: { name: 'Vista Interior', order: 5 },
  odometer: { name: 'Cuentakilómetros', order: 6 },
  vin: { name: 'Número de Chasis (VIN)', order: 7 },
  engine: { name: 'Motor', order: 8 },
  trunk: { name: 'Maletero', order: 9 },
  roof: { name: 'Techo', order: 10 },
  wheel: { name: 'Ruedas', order: 11 },
  tire: { name: 'Neumáticos', order: 12 },
  damage: { name: 'Daños', order: 13 },
  other: { name: 'Otras', order: 14 },
};

/**
 * Agrega un encabezado al documento PDF
 */
const addHeader = (doc: jsPDF, _inspection: SavedInspection) => {
  // Usamos _inspection para evitar la advertencia de variable no utilizada
  doc.setFont(PDF_OPTIONS.FONT_FAMILY_BOLD, 'bold');
  doc.setFontSize(PDF_OPTIONS.FONT_SIZE_HEADER);
  doc.setTextColor(PDF_OPTIONS.COLOR_PRIMARY);
  
  // Título del encabezado
  doc.text('INFORME DE INSPECCIÓN VEHICULAR', 
    PDF_OPTIONS.PAGE_MARGIN, 
    PDF_OPTIONS.HEADER_HEIGHT - 20
  );
  
  // Línea decorativa
  doc.setDrawColor(PDF_OPTIONS.COLOR_BORDER);
  doc.setLineWidth(0.5);
  doc.line(
    PDF_OPTIONS.PAGE_MARGIN,
    PDF_OPTIONS.HEADER_HEIGHT - 10,
    doc.internal.pageSize.getWidth() - PDF_OPTIONS.PAGE_MARGIN,
    PDF_OPTIONS.HEADER_HEIGHT - 10
  );
};

/**
 * Agrega un pie de página al documento PDF
 */
const addFooter = (doc: jsPDF, _inspection: SavedInspection) => {
  // Obtener el número de páginas manualmente contando las páginas en el array interno
  const pageCount = doc.internal.pages.length;
  
  // Recorrer todas las páginas
  for (let i = 1; i <= pageCount; i++) {
    // Solo establecer la página si hay más de una
    if (pageCount > 1) {
      doc.setPage(i);
    }
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Línea decorativa
    doc.setDrawColor(PDF_OPTIONS.COLOR_BORDER);
    doc.setLineWidth(0.5);
    const y = pageHeight - PDF_OPTIONS.FOOTER_HEIGHT + 10;
    doc.line(
      PDF_OPTIONS.PAGE_MARGIN,
      y,
      pageWidth - PDF_OPTIONS.PAGE_MARGIN,
      y
    );
    
    // Número de página
    doc.setFont(PDF_OPTIONS.FONT_FAMILY, 'normal');
    doc.setFontSize(PDF_OPTIONS.FONT_SIZE_SMALL);
    doc.setTextColor(PDF_OPTIONS.COLOR_TEXT_MUTED);
    
    const pageText = `Página ${i} de ${pageCount}`;
    const textWidth = doc.getTextWidth(pageText);
    
    // Texto de número de página (derecha)
    doc.text(
      pageText,
      pageWidth - PDF_OPTIONS.PAGE_MARGIN - textWidth,
      pageHeight - 20
    );
    
    // Fecha de generación (izquierda)
    doc.text(
      `Generado el: ${new Date().toLocaleDateString('es-ES')}`,
      PDF_OPTIONS.PAGE_MARGIN,
      pageHeight - 20
    );
  }
};

/**
 * Formatea una fecha legible
 */
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'No especificada';
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return new Date(dateString).toLocaleDateString('es-ES', options);
};


// Interfaz para las opciones de metadatos del PDF
interface PdfMetadata {
  title?: string;
  subject?: string;
  author?: string;
  keywords?: string[];
}

/**
 * Configura los metadatos del documento PDF
 */
const setPdfMetadata = (doc: jsPDF, metadata: PdfMetadata) => {
  const { title, subject, author, keywords } = metadata;
  
  if (title) {
    doc.setProperties({
      title,
      subject: subject || '',
      author: author || 'AutoInspect App',
      keywords: keywords?.join(', ') || 'inspección, vehículo, auto, informe',
    });
  }
};

/**
 * Genera el contenido principal del PDF
 */
const generatePdfContent = async (doc: jsPDF, inspection: SavedInspection) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const startY = PDF_OPTIONS.HEADER_HEIGHT + 20;
  let currentY = startY;
  
  // Agregar encabezado
  addHeader(doc, inspection);
  
  // Título principal
  doc.setFont(PDF_OPTIONS.FONT_FAMILY_BOLD, 'bold');
  doc.setFontSize(24);
  doc.setTextColor('#2c3e50');
  doc.text('INFORME DE INSPECCIÓN', PDF_OPTIONS.PAGE_MARGIN, currentY);
  
  // Subtítulo
  currentY += 15;
  doc.setFont(PDF_OPTIONS.FONT_FAMILY, 'normal');
  doc.setFontSize(12);
  doc.setTextColor('#7f8c8d');
  doc.text('Documento generado por AutoInspect App', PDF_OPTIONS.PAGE_MARGIN, currentY);
  
  currentY += 30;
  
  // Línea decorativa
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(2);
  doc.line(
    PDF_OPTIONS.PAGE_MARGIN,
    currentY - 10,
    100,
    currentY - 10
  );
  
  // Fecha de generación
  doc.setFont(PDF_OPTIONS.FONT_FAMILY, 'normal');
  doc.setFontSize(10);
  doc.setTextColor('#95a5a6');
  doc.text(
    `Generado el: ${new Date().toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, 
    pageWidth - PDF_OPTIONS.PAGE_MARGIN, 
    currentY - 15,
    { align: 'right' }
  );
  
  currentY += 20;
  
  // Título de la sección de información
  doc.setFont(PDF_OPTIONS.FONT_FAMILY_BOLD, 'bold');
  doc.setFontSize(16);
  doc.setTextColor('#2c3e50');
  doc.text('INFORMACIÓN DE LA INSPECCIÓN', PDF_OPTIONS.PAGE_MARGIN, currentY);
  
  currentY += 15;
  
  // Línea decorativa fina
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(
    PDF_OPTIONS.PAGE_MARGIN,
    currentY,
    pageWidth - PDF_OPTIONS.PAGE_MARGIN,
    currentY
  );
  
  currentY += 20;
  
  // Información de la inspección
  const vehicles = inspection.vehicles || [];
  const columnWidth = (pageWidth - (PDF_OPTIONS.PAGE_MARGIN * 3)) / 2;
  
  // Columna izquierda - Información general
  let leftY = currentY;
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(
    PDF_OPTIONS.PAGE_MARGIN - 5, 
    leftY - 5, 
    columnWidth + 10, 
    30, 
    3, 
    3, 
    'F'
  );
  
  doc.setFont(PDF_OPTIONS.FONT_FAMILY_BOLD, 'bold');
  doc.setFontSize(12);
  doc.setTextColor('#2c3e50');
  doc.text('DATOS GENERALES', PDF_OPTIONS.PAGE_MARGIN, leftY + 10);
  
  leftY += 25;
  
  // Función mejorada para agregar información
  const addInfoRow = (label: string, value: string, y: number): number => {
    doc.setFont(PDF_OPTIONS.FONT_FAMILY_BOLD, 'bold');
    doc.setFontSize(10);
    doc.setTextColor('#7f8c8d');
    doc.text(`${label}:`, PDF_OPTIONS.PAGE_MARGIN, y);
    
    doc.setFont(PDF_OPTIONS.FONT_FAMILY, 'normal');
    doc.setTextColor('#2c3e50');
    const lines = doc.splitTextToSize(value || 'No especificado', columnWidth - 20);
    doc.text(lines, PDF_OPTIONS.PAGE_MARGIN + 60, y);
    
    return y + (lines.length * 6) + 8;
  };
  
  leftY = addInfoRow('ID de Inspección', inspection.id || 'N/A', leftY);
  leftY = addInfoRow('Agente', inspection.agentName || 'No especificado', leftY);
  leftY = addInfoRow('Fecha', formatDate(inspection.inspectionDate), leftY);
  leftY += 10;
  
  // Título de la sección de vehículos
  doc.setFont(PDF_OPTIONS.FONT_FAMILY_BOLD, 'bold');
  doc.setFontSize(16);
  doc.setTextColor('#2c3e50');
  doc.text('VEHÍCULOS INSPECCIONADOS', PDF_OPTIONS.PAGE_MARGIN, leftY + 30);
  
  currentY = leftY + 45;
  
  // Mostrar información de cada vehículo
  for (let i = 0; i < vehicles.length; i++) {
    const vehicle = vehicles[i];
    const isLast = i === vehicles.length - 1;
    
    // Fondo de la tarjeta del vehículo
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.roundedRect(
      PDF_OPTIONS.PAGE_MARGIN - 5, 
      currentY - 5, 
      pageWidth - (PDF_OPTIONS.PAGE_MARGIN * 2) + 10, 
      120, 
      5, 
      5, 
      'FD' // Relleno y borde
    );
    
    // Título del vehículo
    doc.setFont(PDF_OPTIONS.FONT_FAMILY_BOLD, 'bold');
    doc.setFontSize(14);
    doc.setTextColor('#2c3e50');
    doc.text(
      `Vehículo ${i + 1}${vehicles.length > 1 ? ` de ${vehicles.length}` : ''}`, 
      PDF_OPTIONS.PAGE_MARGIN, 
      currentY + 15
    );
    
    // Línea decorativa debajo del título
    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(1.5);
    doc.line(
      PDF_OPTIONS.PAGE_MARGIN,
      currentY + 20,
      PDF_OPTIONS.PAGE_MARGIN + 100,
      currentY + 20
    );
    
    // Información del vehículo
    const vehicleInfoY = currentY + 40;
    const vehicleInfo = [
      { label: 'Marca', value: vehicle.make || 'No especificada' },
      { label: 'Modelo', value: vehicle.model || 'No especificado' },
      { label: 'Año', value: vehicle.year || 'No especificado' },
      { label: 'Placa', value: (vehicle as any).plate || 'No especificada' },
      { label: 'Color', value: (vehicle as any).color || 'No especificado' },
      { label: 'VIN', value: (vehicle as any).vin || 'No especificado' }
    ];
    
    // Mostrar información en dos columnas
    const infoColumnWidth = (pageWidth - (PDF_OPTIONS.PAGE_MARGIN * 2)) / 3;
    let yOffset = 0;
    
    vehicleInfo.forEach((item, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = PDF_OPTIONS.PAGE_MARGIN + (col * infoColumnWidth);
      const y = vehicleInfoY + (row * 15);
      
      doc.setFont(PDF_OPTIONS.FONT_FAMILY_BOLD, 'bold');
      doc.setFontSize(9);
      doc.setTextColor('#7f8c8d');
      doc.text(`${item.label}:`, x, y);
      
      doc.setFont(PDF_OPTIONS.FONT_FAMILY, 'normal');
      doc.setFontSize(10);
      doc.setTextColor('#2c3e50');
      doc.text(item.value, x + 40, y);
      
      yOffset = y;
    });
    
    // Actualizar la posición Y para el siguiente vehículo
    currentY = yOffset + 25;
    
    // Agregar espacio entre vehículos
    if (!isLast) {
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      // Línea punteada personalizada
      const lineLength = 2; // Longitud del guión
      const gapLength = 2;  // Longitud del espacio
      const startX = PDF_OPTIONS.PAGE_MARGIN;
      const endX = pageWidth - PDF_OPTIONS.PAGE_MARGIN;
      const y = currentY + 5;
      
      // Dibujar línea punteada manualmente
      for (let x = startX; x < endX; x += lineLength + gapLength) {
        doc.line(
          x,
          y,
          Math.min(x + lineLength, endX),
          y
        );
      }
      currentY += 20;
    }
    
    // Verificar si necesitamos una nueva página para el siguiente vehículo
    if (currentY > doc.internal.pageSize.getHeight() - 100) {
      doc.addPage();
      currentY = 40;
      addHeader(doc, inspection);
    } else {
      // No es necesario hacer nada aquí, ya que usamos currentY para el seguimiento
    }
  }
  
  // Continuar desde la posición Y más baja
  currentY = leftY + 20;
  
  // Línea separadora
  doc.setDrawColor(PDF_OPTIONS.COLOR_BORDER);
  doc.setLineWidth(0.2);
  doc.line(
    PDF_OPTIONS.PAGE_MARGIN,
    currentY - 10,
    pageWidth - PDF_OPTIONS.PAGE_MARGIN,
    currentY - 10
  );
  
  // Título principal de la sección de fotos
  doc.setFont(PDF_OPTIONS.FONT_FAMILY_BOLD, 'bold');
  doc.setFontSize(18);
  doc.setTextColor('#2c3e50');
  doc.text('DOCUMENTACIÓN FOTOGRÁFICA', PDF_OPTIONS.PAGE_MARGIN, currentY);
  
  // Línea decorativa
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(2);
  doc.line(
    PDF_OPTIONS.PAGE_MARGIN,
    currentY + 5,
    120,
    currentY + 5
  );
  
  // Subtítulo descriptivo
  currentY += 20;
  doc.setFont(PDF_OPTIONS.FONT_FAMILY, 'normal');
  doc.setFontSize(10);
  doc.setTextColor('#7f8c8d');
  doc.text(
    'A continuación se muestran las fotografías tomadas durante la inspección del vehículo.',
    PDF_OPTIONS.PAGE_MARGIN,
    currentY
  );
  
  currentY += 30;
  
  // Mostrar fotos de todos los vehículos
  for (let vehicleIndex = 0; vehicleIndex < vehicles.length; vehicleIndex++) {
    const vehicle = vehicles[vehicleIndex];
    // Se eliminó la variable isLastVehicle no utilizada
    
    // Tarjeta de vehículo para la sección de fotos
    doc.setFillColor(250, 250, 252);
    doc.setDrawColor(230, 230, 235);
    doc.roundedRect(
      PDF_OPTIONS.PAGE_MARGIN - 5,
      currentY - 5,
      pageWidth - (PDF_OPTIONS.PAGE_MARGIN * 2) + 10,
      40,
      3,
      3,
      'FD'
    );
    
    // Título del vehículo
    doc.setFont(PDF_OPTIONS.FONT_FAMILY_BOLD, 'bold');
    doc.setFontSize(14);
    doc.setTextColor('#2c3e50');
    doc.text(
      `Vehículo ${vehicleIndex + 1}${vehicles.length > 1 ? ` de ${vehicles.length}` : ''}`, 
      PDF_OPTIONS.PAGE_MARGIN, 
      currentY + 15
    );
    
    // Información del vehículo
    doc.setFont(PDF_OPTIONS.FONT_FAMILY, 'normal');
    doc.setFontSize(10);
    doc.setTextColor('#7f8c8d');
    
    const vehicleInfo = [
      vehicle.make || 'Marca no especificada',
      vehicle.model || 'Modelo no especificado',
      vehicle.year || 'Año no especificado'
    ].filter(Boolean).join(' • ');
    
    doc.text(vehicleInfo, PDF_OPTIONS.PAGE_MARGIN + 100, currentY + 15);
    
    // Línea decorativa
    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(1);
    doc.line(
      PDF_OPTIONS.PAGE_MARGIN,
      currentY + 22,
      PDF_OPTIONS.PAGE_MARGIN + 80,
      currentY + 22
    );
    
    currentY += 45;
    
    if (!vehicle?.photos || Object.keys(vehicle.photos).length === 0) {
      doc.setFont(PDF_OPTIONS.FONT_FAMILY_ITALIC, 'italic');
      doc.setFontSize(PDF_OPTIONS.FONT_SIZE_SMALL);
      doc.setTextColor('#95a5a6');
      doc.text('No hay fotografías para este vehículo.', PDF_OPTIONS.PAGE_MARGIN + 5, currentY);
      currentY += 30;
      continue;
    }
    
    // Configuración de la galería de fotos
    const photosPerRow = 2; // Fotos por fila
    const maxWidth = (pageWidth - (PDF_OPTIONS.PAGE_MARGIN * 2) - (15 * (photosPerRow - 1))) / photosPerRow;
    let currentX = PDF_OPTIONS.PAGE_MARGIN;
    
    // Obtener y ordenar las categorías de fotos
    const photoCategories = Object.entries(vehicle.photos).sort(([catA], [catB]) => {
      // Ordenar por orden predefinido si existe, de lo contrario por nombre
      const orderA = PHOTO_CATEGORY_CONFIG[catA]?.order || 999;
      const orderB = PHOTO_CATEGORY_CONFIG[catB]?.order || 999;
      return orderA - orderB;
    });

    const totalCategories = photoCategories.length;

    for (let i = 0; i < totalCategories; i++) {
      const [category, photo] = photoCategories[i];
      const isLastCategory = i === totalCategories - 1;
      if (!photo?.base64) continue;
      
      const categoryName = PHOTO_CATEGORY_CONFIG[category]?.name || category;
      
      try {
        // Función para verificar y agregar nueva página si es necesario
        const checkPageBreak = (requiredHeight: number) => {
          const pageHeight = doc.internal.pageSize.getHeight();
          const remainingSpace = pageHeight - currentY - 40; // 40px de margen inferior
          
          if (requiredHeight > remainingSpace) {
            doc.addPage();
            currentY = 40;
            currentX = PDF_OPTIONS.PAGE_MARGIN;
            addHeader(doc, inspection);
            return true; // Se agregó una nueva página
          }
          return false; // No se necesitó nueva página
        };
        
        // Verificar espacio para el título de categoría (50px)
        checkPageBreak(50);
        
        // Título de la categoría con mejor espaciado
        currentY += 15; // Espacio antes del título
        
        // Fondo sutil para el título
        doc.setFillColor(245, 245, 245);
        doc.rect(
          PDF_OPTIONS.PAGE_MARGIN - 5,
          currentY - 5,
          doc.internal.pageSize.getWidth() - (PDF_OPTIONS.PAGE_MARGIN * 2) + 10,
          25,
          'F'
        );
        
        // Texto del título
        doc.setFont(PDF_OPTIONS.FONT_FAMILY_BOLD, 'bold');
        doc.setFontSize(12);
        doc.setTextColor('#2c3e50');
        doc.text(categoryName.toUpperCase(), currentX, currentY + 12);
        
        // Línea decorativa debajo del título
        doc.setDrawColor(41, 128, 185);
        doc.setLineWidth(1);
        doc.line(
          currentX,
          currentY + 15,
          currentX + 50,
          currentY + 15
        );
        
        currentY += 25; // Espacio después del título
        
        // Cargar la imagen para obtener sus dimensiones
        const img = new window.Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Error al cargar la imagen'));
          if (photo.base64) {
            img.src = photo.base64;
          } else {
            reject(new Error('No hay datos de imagen'));
          }
        });
        
        // Calcular dimensiones manteniendo la relación de aspecto
        const imgWidth = Math.min(img.width || maxWidth, maxWidth);
        const aspectRatio = img.width / img.height;
        let imgHeight = imgWidth / aspectRatio;
        
        // Verificar espacio para la imagen + margen inferior
        const requiredSpace = imgHeight + 30; // Espacio para la imagen + margen
        const pageBreakOccurred = checkPageBreak(requiredSpace);
        
        if (pageBreakOccurred) {
          // Si hubo salto de página, volver a dibujar el título
          doc.setFont(PDF_OPTIONS.FONT_FAMILY_BOLD, 'bold');
          doc.setFontSize(12);
          doc.setTextColor('#2c3e50');
          doc.text(categoryName.toUpperCase(), currentX, currentY + 12);
          
          // Línea decorativa debajo del título
          doc.setDrawColor(41, 128, 185);
          doc.setLineWidth(1);
          doc.line(
            currentX,
            currentY + 25,
            currentX + 50,
            currentY + 25
          );
          
          currentY += 40; // Ajuste para el título en la nueva página
        }
        
        // Calcular posición X para centrar la imagen
        const imgX = currentX + (maxWidth - imgWidth) / 2;
        const imgY = currentY;
        
        try {
          // Agregar borde sutil
          doc.setDrawColor(220, 220, 220);
          doc.setFillColor(250, 250, 250);
          doc.setLineWidth(0.5);
          doc.roundedRect(
            imgX - 2,
            imgY - 2,
            imgWidth + 4,
            imgHeight + 4,
            3,
            3,
            'FD' // Relleno y borde
          );
          
          // Agregar la imagen
          doc.addImage(
            photo.base64,
            'JPEG',
            imgX,
            imgY,
            imgWidth,
            imgHeight,
            undefined,
            'FAST' // Renderizado más rápido
          );
        } catch (error) {
          console.error('Error al agregar imagen al PDF:', error);
          // Mostrar mensaje de error en lugar de la imagen
          doc.setFont(PDF_OPTIONS.FONT_FAMILY, 'normal');
          doc.setFontSize(10);
          doc.setTextColor('#e74c3c');
          doc.text(
            'Error al cargar la imagen',
            imgX,
            imgY + 20,
            { maxWidth: maxWidth }
          );
        }
        
        // Mostrar nota si existe
        currentY += imgHeight + 5; // Espacio después de la imagen
        
        if (photo.note) {
          doc.setFont(PDF_OPTIONS.FONT_FAMILY_ITALIC, 'italic');
          doc.setFontSize(9);
          doc.setTextColor('#7f8c8d');
          const noteLines = doc.splitTextToSize(`Nota: ${photo.note}`, maxWidth);
          
          // Calcular espacio necesario para la nota
          const noteHeight = noteLines.length * 12 + 10;
          checkPageBreak(noteHeight);
          
          doc.text(
            noteLines,
            currentX,
            currentY,
            { maxWidth: maxWidth }
          );
          currentY += noteHeight;
        } else {
          currentY += 10; // Margen estándar si no hay nota
        }
        
        // Espacio después de cada categoría
        if (!isLastCategory) {
          // Verificar espacio para la línea separadora (40px)
          checkPageBreak(40);
          
          currentY += 15; // Espacio antes de la línea
          
          // Línea separadora punteada personalizada
          doc.setDrawColor(230, 230, 230);
          doc.setLineWidth(0.5);
          
          // Coordenadas de la línea
          const startX = PDF_OPTIONS.PAGE_MARGIN + 50;
          const endX = doc.internal.pageSize.getWidth() - PDF_OPTIONS.PAGE_MARGIN - 50;
          const y = currentY;
          
          // Dibujar línea punteada manualmente
          const dashLength = 3;
          const gapLength = 3;
          
          for (let x = startX; x < endX; x += dashLength + gapLength) {
            doc.line(
              x,
              y,
              Math.min(x + dashLength, endX),
              y
            );
          }
          
          currentY += 25; // Espacio después de la línea
        } else {
          // Espacio adicional después de la última categoría
          currentY += 20;
        }
        
      } catch (error) {
        console.error('Error al procesar imagen:', error);
        // Verificar si necesitamos una nueva página para el mensaje de error
        if (currentY + 30 > doc.internal.pageSize.getHeight() - 40) {
          doc.addPage();
          currentY = 40;
          addHeader(doc, inspection);
        }
        
        // Mostrar mensaje de error
        doc.setFont(PDF_OPTIONS.FONT_FAMILY, 'normal');
        doc.setFontSize(PDF_OPTIONS.FONT_SIZE_SMALL);
        doc.setTextColor('#e74c3c'); // Rojo más suave
        doc.text(`Error al cargar imagen de ${categoryName}`, 
          PDF_OPTIONS.PAGE_MARGIN, 
          currentY
        );
        currentY += 20;
        
        // Línea de error
        doc.setDrawColor(231, 76, 60, 30);
        doc.setLineWidth(2);
        doc.line(
          PDF_OPTIONS.PAGE_MARGIN,
          currentY - 5,
          PDF_OPTIONS.PAGE_MARGIN + 100,
          currentY - 5
        );
        currentY += 10;
      }
    }
  }
  
  return doc;
};

/**
 * Genera y descarga un PDF con la información de la inspección
 */
export const generatePdf = async (inspection: SavedInspection): Promise<void> => {
  try {
    // Crear documento con orientación vertical y unidades en puntos
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
      compress: true // Comprimir el PDF para reducir el tamaño
    });
    
    // Configuración inicial del documento
    setPdfMetadata(doc, {
      title: `Inspección Vehículo - ${inspection.id || 'sin ID'}`,
      subject: 'Informe de Inspección Vehicular',
      author: 'AutoInspect App',
      keywords: ['inspección', 'vehículo', 'informe']
    });
    
    // Agregar contenido principal (esperar a que se complete)
    const pdfDoc = await generatePdfContent(doc, inspection);
    
    // Agregar pie de página
    addFooter(pdfDoc, inspection);
    
    // Generar nombre de archivo descriptivo
    const firstVehicle = inspection.vehicles?.[0] || {};
    const agentNameSanitized = inspection.agentName
      ?.replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '_')
      .toLowerCase() || 'inspector';
      
    const vehicleInfo = [
      firstVehicle.make,
      firstVehicle.model,
      firstVehicle.year
    ].filter(Boolean).join('_').toLowerCase() || 'vehiculo';
    
    const dateString = inspection.inspectionDate 
      ? new Date(inspection.inspectionDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    
    const filename = `Inspeccion_${vehicleInfo}_${dateString}_${agentNameSanitized}.pdf`;
    
    // Guardar el PDF
    doc.save(filename);
    
  } catch (error) {
    console.error('Error al generar el PDF:', error);
    throw new Error('No se pudo generar el PDF. Por favor, inténtalo de nuevo.');
  }
};

/**
 * Genera una versión simplificada del PDF para previsualización rápida
 */
export const generatePdfBlobUrlSoloTexto = async (inspection: SavedInspection): Promise<string> => {
  const doc = new jsPDF({ 
    orientation: 'p', 
    unit: 'pt', 
    format: 'a4' 
  });
  
  // Configuración del documento
  doc.setFont(PDF_OPTIONS.FONT_FAMILY, 'bold');
  doc.setFontSize(PDF_OPTIONS.FONT_SIZE_TITLE);
  doc.text('INSPECCIÓN VEHÍCULO (Vista Previa)', PDF_OPTIONS.PAGE_MARGIN, 80);
  
  doc.setFont(PDF_OPTIONS.FONT_FAMILY, 'normal');
  doc.setFontSize(PDF_OPTIONS.FONT_SIZE_NORMAL);
  
  // Información básica
  doc.text(`ID: ${inspection.id || 'sin id'}`, PDF_OPTIONS.PAGE_MARGIN, 120);
  doc.text(`Agente: ${inspection.agentName || 'sin nombre'}`, PDF_OPTIONS.PAGE_MARGIN, 150);
  
  const inspectionDate = inspection.inspectionDate 
    ? new Date(inspection.inspectionDate).toLocaleDateString() 
    : 'sin fecha';
    
  doc.text(`Fecha: ${inspectionDate}`, PDF_OPTIONS.PAGE_MARGIN, 180);
  doc.text('Esta es una vista previa. El PDF final contendrá todas las fotos e información detallada.', 
    PDF_OPTIONS.PAGE_MARGIN, 210);
  
  // Generar y devolver el blob URL
  const pdfBlob = doc.output('blob');
  return URL.createObjectURL(pdfBlob);
};

/**
 * Genera un blob URL del PDF para previsualizar en un iframe/embed.
 */
export const generatePdfBlobUrl = async (inspection: SavedInspection): Promise<string> => {
  const doc = new jsPDF({ 
    orientation: 'p', 
    unit: 'pt', 
    format: 'a4' 
  });
  
  generatePdfContent(doc, inspection);
  addFooter(doc, inspection);
  
  // Generar y devolver el blob URL
  const pdfBlob = doc.output('blob');
  return URL.createObjectURL(pdfBlob);
};
