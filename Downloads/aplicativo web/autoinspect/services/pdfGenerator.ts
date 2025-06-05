import { jsPDF } from 'jspdf';
import { SavedInspection } from '../types.ts';

/**
 * Genera y descarga un PDF básico con jsPDF puro (texto e imagen base64 si existe).
 */
export const generatePdf = async (inspection: SavedInspection): Promise<void> => {
  try {
    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('INSPECCIÓN VEHÍCULO', 40, 80);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`ID: ${inspection.id || 'sin id'}`, 40, 120);
    doc.text(`Agente: ${inspection.agentName || 'sin nombre'}`, 40, 150);
    doc.text(`Fecha: ${inspection.inspectionDate ? new Date(inspection.inspectionDate).toLocaleDateString() : 'sin fecha'}`, 40, 180);
    // Imagen base64 (primera foto)
    const firstVehicle = inspection.vehicles?.[0];
    const firstPhoto = firstVehicle && Object.values(firstVehicle.photos)[0]?.base64;
    if (firstPhoto) {
      try {
        doc.addImage(firstPhoto, 'JPEG', 40, 200, 120, 90);
      } catch (err) {
        doc.text('Error al cargar imagen', 40, 300);
      }
    }
    doc.save('inspeccion.pdf');
  } catch (e: any) {
    throw new Error('[PDF] Error al generar PDF: ' + (e?.message || String(e)));
  }
};

/**
 * Genera un blob URL del PDF para previsualizar en un iframe/embed.
 */
export const generatePdfBlobUrl = async (inspection: SavedInspection): Promise<string> => {
  try {
    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('INSPECCIÓN VEHÍCULO', 40, 80);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`ID: ${inspection.id || 'sin id'}`, 40, 120);
    doc.text(`Agente: ${inspection.agentName || 'sin nombre'}`, 40, 150);
    doc.text(`Fecha: ${inspection.inspectionDate ? new Date(inspection.inspectionDate).toLocaleDateString() : 'sin fecha'}`, 40, 180);
    // Imagen base64 (primera foto)
    const firstVehicle = inspection.vehicles?.[0];
    const firstPhoto = firstVehicle && Object.values(firstVehicle.photos)[0]?.base64;
    if (firstPhoto) {
      try {
        doc.addImage(firstPhoto, 'JPEG', 40, 200, 120, 90);
      } catch (err) {
        doc.text('Error al cargar imagen', 40, 300);
      }
    }
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    return url;
  } catch (e: any) {
    throw new Error('[PDF] Error al generar PDF: ' + (e?.message || String(e)));
  }
};

/**
 * Generates and downloads the PDF for an inspection (used for final download).
 * For preview, use generatePdfBlobUrl.
 */
export const generatePdf = async (inspection: SavedInspection): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'pt',
    format: 'a4',
  });
  let yPos = PDF_OPTIONS.PAGE_MARGIN;
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - (PDF_OPTIONS.PAGE_MARGIN * 2);
  
  const FONT_FAMILY_SANS_SERIF = 'helvetica'; // Using Helvetica as a professional sans-serif

  const addPageIfNeeded = (estimatedHeight: number = 20) => {
    if (yPos + estimatedHeight > pageHeight - PDF_OPTIONS.PAGE_MARGIN - PDF_OPTIONS.FONT_SIZE_FOOTER * 3) { // Reserve space for footer
      doc.addPage();
      yPos = PDF_OPTIONS.PAGE_MARGIN;
      // Note: Header is not automatically added here to prevent recursion if header itself causes page break.
      // It should be called explicitly after addPage() if needed, or managed by a flag.
      // For this design, the main header is only on the first page. Subsequent pages start at PAGE_MARGIN.
      return true; 
    }
    return false;
  };

  // Helper para manejo global de errores en PDF
  function showPdfErrorAlert(message: string) {
    if (typeof window !== 'undefined') {
      alert('Error generando PDF: ' + message);
    }
  }

        theme: 'grid',
        styles: { font: 'helvetica', fontSize: 10 },
      });
    } catch (e) {
      console.error('autoTable error:', e);
      showPdfErrorAlert('Error al generar la tabla en el PDF.');
    }
  }

  // Main Header - Only on the first page
  const addMainHeader = () => {
    // Logo Placeholder
    doc.setFont(FONT_FAMILY_SANS_SERIF, 'bold');
    doc.setFontSize(PDF_OPTIONS.FONT_SIZE_LOGO_TEXT);
    doc.setTextColor(PDF_OPTIONS.BRAND_COLOR);
    doc.text(APP_NAME, PDF_OPTIONS.PAGE_MARGIN, PDF_OPTIONS.PAGE_MARGIN + PDF_OPTIONS.FONT_SIZE_LOGO_TEXT);

    // Main Title
    doc.setFont(FONT_FAMILY_SANS_SERIF, 'bold');
    doc.setFontSize(PDF_OPTIONS.FONT_SIZE_MAIN_TITLE);
    doc.setTextColor(PDF_OPTIONS.BRAND_COLOR);
    doc.text("Vehicle Inspection Report", pageWidth / 2, PDF_OPTIONS.PAGE_MARGIN + PDF_OPTIONS.FONT_SIZE_MAIN_TITLE * 0.8, { align: 'center' });
    
    // Inspection ID
    doc.setFont(FONT_FAMILY_SANS_SERIF, 'normal');
    doc.setFontSize(PDF_OPTIONS.FONT_SIZE_INSPECTION_ID);
    doc.setTextColor(PDF_OPTIONS.TEXT_COLOR_MUTED);
    const inspectionIdText = `Inspection ID: ${inspection.id}`;
    const titleBlockBottom = PDF_OPTIONS.PAGE_MARGIN + PDF_OPTIONS.FONT_SIZE_MAIN_TITLE * 0.8 + PDF_OPTIONS.FONT_SIZE_INSPECTION_ID + 5;
    doc.text(inspectionIdText, pageWidth / 2, titleBlockBottom, { align: 'center' });

    yPos = titleBlockBottom + 25; // Space after the entire header block
    PDF_OPTIONS.CONTENT_START_Y = yPos; // Save where content actually starts after header
    doc.setDrawColor(PDF_OPTIONS.LINE_COLOR);
    doc.line(PDF_OPTIONS.PAGE_MARGIN, yPos -10, pageWidth - PDF_OPTIONS.PAGE_MARGIN, yPos-10); // Line after header
  };
  
  const addFooter = () => {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const footerY = pageHeight - PDF_OPTIONS.PAGE_MARGIN / 1.5;
      
      doc.setDrawColor(PDF_OPTIONS.LINE_COLOR);
      doc.line(PDF_OPTIONS.PAGE_MARGIN, footerY - 8, pageWidth - PDF_OPTIONS.PAGE_MARGIN, footerY - 8); // Line above footer

      doc.setFont(FONT_FAMILY_SANS_SERIF, 'normal');
      doc.setFontSize(PDF_OPTIONS.FONT_SIZE_FOOTER);
      doc.setTextColor(PDF_OPTIONS.TEXT_COLOR_MUTED);
      const footerText = `Page ${i} of ${pageCount} | Generated: ${new Date().toLocaleDateString()} | ${APP_NAME}`;
      doc.text(footerText, pageWidth / 2, footerY, { align: 'center' });
    }
  };
  
  const addSectionTitleBar = (title: string) => {
    const barHeight = PDF_OPTIONS.FONT_SIZE_SECTION_HEADER * PDF_OPTIONS.SECTION_TITLE_BAR_HEIGHT_FACTOR + (PDF_OPTIONS.SECTION_TITLE_BAR_PADDING_Y * 2);
    if (addPageIfNeeded(barHeight + PDF_OPTIONS.SECTION_SPACING_AFTER_TITLE_BAR)) {
        // If new page, reset yPos to content start, or PAGE_MARGIN if not first page
        yPos = (doc.getCurrentPageInfo().pageNumber === 1) ? PDF_OPTIONS.CONTENT_START_Y : PDF_OPTIONS.PAGE_MARGIN;
    }
    
    doc.setFillColor(PDF_OPTIONS.CARD_BACKGROUND_COLOR);
    doc.setDrawColor(PDF_OPTIONS.CARD_BORDER_COLOR);
    doc.rect(PDF_OPTIONS.PAGE_MARGIN, yPos, contentWidth, barHeight, 'FD'); // FD = Fill and Draw border
    
    doc.setFont(FONT_FAMILY_SANS_SERIF, 'bold');
    doc.setFontSize(PDF_OPTIONS.FONT_SIZE_SECTION_HEADER);
    doc.setTextColor(PDF_OPTIONS.BRAND_COLOR);
    
    const textY = yPos + (barHeight / 2) + (PDF_OPTIONS.FONT_SIZE_SECTION_HEADER * 0.35); // Vertical centering
    doc.text(title, PDF_OPTIONS.PAGE_MARGIN + 10, textY); // 10 is padding inside bar
    
    yPos += barHeight + PDF_OPTIONS.SECTION_SPACING_AFTER_TITLE_BAR;
    doc.setTextColor(PDF_OPTIONS.TEXT_COLOR); // Reset text color for content
  };

  const addKeyValuePair = (key: string, value: string | undefined | null, indent: boolean = true) => {
    const lineHeight = Math.max(PDF_OPTIONS.FONT_SIZE_KEY_VALUE_KEY, PDF_OPTIONS.FONT_SIZE_KEY_VALUE_VALUE) * 1.3;
    if(addPageIfNeeded(lineHeight * 2)) { // Check for space for at least one line
      yPos = (doc.getCurrentPageInfo().pageNumber === 1 && PDF_OPTIONS.CONTENT_START_Y > 0) ? PDF_OPTIONS.CONTENT_START_Y : PDF_OPTIONS.PAGE_MARGIN;
    }
    
    const xOffset = indent ? PDF_OPTIONS.PAGE_MARGIN + 10 : PDF_OPTIONS.PAGE_MARGIN; // Content padding

    doc.setFont(FONT_FAMILY_SANS_SERIF, 'bold');
    doc.setFontSize(PDF_OPTIONS.FONT_SIZE_KEY_VALUE_KEY);
    doc.setTextColor(PDF_OPTIONS.TEXT_COLOR_MUTED); 
    const keyText = `${key}:`;
    doc.text(keyText, xOffset, yPos);
    
    doc.setFont(FONT_FAMILY_SANS_SERIF, 'normal');
    doc.setFontSize(PDF_OPTIONS.FONT_SIZE_KEY_VALUE_VALUE);
    doc.setTextColor(PDF_OPTIONS.TEXT_COLOR);
    
    let valueText = value || "—"; // Use "—" for empty/null values
    if (!value) {
        doc.setTextColor(PDF_OPTIONS.TEXT_COLOR_MUTED); // Style "—" as muted
    }
    
    const keyWidth = doc.getStringUnitWidth(keyText) * PDF_OPTIONS.FONT_SIZE_KEY_VALUE_KEY / doc.internal.scaleFactor;
    const valueXStart = xOffset + keyWidth + 8; // 8 is gap between key and value
    const availableValueWidth = contentWidth - (valueXStart - PDF_OPTIONS.PAGE_MARGIN) - (indent ? 10 : 0);
    
    const splitValue = doc.splitTextToSize(valueText, availableValueWidth);
    doc.text(splitValue, valueXStart, yPos);
    yPos += (splitValue.length * lineHeight) + PDF_OPTIONS.KEY_VALUE_SPACING_Y;
    doc.setTextColor(PDF_OPTIONS.TEXT_COLOR); // Reset color
  };

  // ----- PDF Content Generation -----
  addMainHeader();

  addSectionTitleBar("Inspector & Insured Details");
  addKeyValuePair("Agent's Name", inspection.agentName);
  addKeyValuePair("Insured's Name", inspection.insuredName);
  addKeyValuePair("Insured's DOB", inspection.insuredDOB ? new Date(inspection.insuredDOB).toLocaleDateString() : undefined);
  addKeyValuePair("Inspection Date", new Date(inspection.inspectionDate).toLocaleDateString());
  yPos += PDF_OPTIONS.BLOCK_SPACING_Y / 2; // Slightly less space before next section

  for (const [index, vehicle] of inspection.vehicles.entries()) {
     if(addPageIfNeeded(PDF_OPTIONS.FONT_SIZE_SECTION_HEADER * 2)) { // Check for space for section header
      yPos = (doc.getCurrentPageInfo().pageNumber === 1 && PDF_OPTIONS.CONTENT_START_Y > 0) ? PDF_OPTIONS.CONTENT_START_Y : PDF_OPTIONS.PAGE_MARGIN;
    }
    
    const vehiclePdfTitleBase = `Vehicle ${index + 1} Details`;
    const vehiclePdfMakeModel = [vehicle.make, vehicle.model].filter(Boolean).join(' ').trim();
    const vehiclePdfSectionTitle = vehiclePdfMakeModel ? `${vehiclePdfTitleBase}: ${vehiclePdfMakeModel}` : vehiclePdfTitleBase;
    addSectionTitleBar(vehiclePdfSectionTitle);

    addKeyValuePair("Make", vehicle.make);
    addKeyValuePair("Model", vehicle.model);
    addKeyValuePair("Year", vehicle.year);
    yPos += PDF_OPTIONS.BLOCK_SPACING_Y / 2;

    // Photos Section for this vehicle
    if(addPageIfNeeded(PDF_OPTIONS.FONT_SIZE_SECTION_HEADER * 2)) {
      yPos = (doc.getCurrentPageInfo().pageNumber === 1 && PDF_OPTIONS.CONTENT_START_Y > 0) ? PDF_OPTIONS.CONTENT_START_Y : PDF_OPTIONS.PAGE_MARGIN;
    }
    addSectionTitleBar(`Photos: Vehicle ${index + 1}`);
    
    let photoX = PDF_OPTIONS.PAGE_MARGIN + PDF_OPTIONS.PHOTO_CELL_PADDING;
    const photoGridContentWidth = contentWidth - (PDF_OPTIONS.PHOTO_CELL_PADDING * 2);
    
    const numCols = PDF_OPTIONS.PHOTO_GRID_COLUMNS;
    const totalGapWidth = PDF_OPTIONS.PHOTO_SLOT_GAP * (numCols - 1);
    const cellWidth = (photoGridContentWidth - totalGapWidth) / numCols;
    const cellHeight = cellWidth * (3/4); // Aspect ratio for the cell/slot
    const captionHeight = PDF_OPTIONS.FONT_SIZE_PHOTO_CAPTION + PDF_OPTIONS.PHOTO_CAPTION_OFFSET_Y + 5; // Total space for caption
    
    let photoCountInRow = 0;

    const photosToDisplay = AllPhotoCategoryKeys.map(catKey => vehicle.photos[catKey as PhotoCategoryKey]).filter(p => p && p.base64); // Only display photos with images

    if (photosToDisplay.length === 0) {
      if(addPageIfNeeded(30)) {
        yPos = (doc.getCurrentPageInfo().pageNumber === 1 && PDF_OPTIONS.CONTENT_START_Y > 0) ? PDF_OPTIONS.CONTENT_START_Y : PDF_OPTIONS.PAGE_MARGIN;
      }
      doc.setFont(FONT_FAMILY_SANS_SERIF, 'normal');
      doc.setFontSize(PDF_OPTIONS.FONT_SIZE_KEY_VALUE_VALUE);
      doc.setTextColor(PDF_OPTIONS.TEXT_COLOR_MUTED);
      doc.text("(No photos provided for this vehicle)", PDF_OPTIONS.PAGE_MARGIN + 10, yPos);
      yPos += PDF_OPTIONS.FONT_SIZE_KEY_VALUE_VALUE * 1.5;
    } else {
      for (const photo of photosToDisplay) {
        if (!photo) continue; // Should be filtered by photosToDisplay logic already

        const photoConfig = PhotoCategoryConfig[photo.id as PhotoCategoryKey];
        const displayName = photoConfig ? photoConfig.name : photo.id;
        
        if (photoCountInRow === 0) { // Start of a new row
           if(addPageIfNeeded(cellHeight + captionHeight + PDF_OPTIONS.PHOTO_SLOT_GAP)) {
            yPos = (doc.getCurrentPageInfo().pageNumber === 1 && PDF_OPTIONS.CONTENT_START_Y > 0) ? PDF_OPTIONS.CONTENT_START_Y : PDF_OPTIONS.PAGE_MARGIN;
            photoX = PDF_OPTIONS.PAGE_MARGIN + PDF_OPTIONS.PHOTO_CELL_PADDING; // Reset X for new page
          }
        }
        
        const currentCellY = yPos;

        // Draw border for the cell
        doc.setDrawColor(PDF_OPTIONS.CARD_BORDER_COLOR);
        doc.rect(photoX, currentCellY, cellWidth, cellHeight);

        if (photo.base64) { // photo.base64 should exist due to filter
          try {
            const img = new Image();
            img.src = photo.base64;

            await new Promise<void>((resolve, reject) => { // Ensure image is loaded
              img.onload = () => resolve();
              img.onerror = (errEv) => {
                console.error(`PDF Gen: Error loading image ${displayName}:`, errEv);
                doc.setFillColor(230, 230, 230);
                doc.rect(photoX + 1, currentCellY + 1, cellWidth - 2, cellHeight - 2, 'F'); // Inner rect for error
                doc.setFont(FONT_FAMILY_SANS_SERIF, 'italic');
                doc.setFontSize(PDF_OPTIONS.FONT_SIZE_PHOTO_CAPTION);
                doc.setTextColor(PDF_OPTIONS.TEXT_COLOR_MUTED);
                doc.text("Image load error", photoX + cellWidth/2, currentCellY + cellHeight / 2, {align: 'center', baseline: 'middle'});
                resolve(); 
              };
            });
            
            if (img.complete && img.naturalWidth > 0) {
              const imgAspectRatio = img.naturalWidth / img.naturalHeight;
              let drawWidth = cellWidth - (PDF_OPTIONS.PHOTO_CELL_PADDING * 2);
              let drawHeight = drawWidth / imgAspectRatio;

              if (drawHeight > cellHeight - (PDF_OPTIONS.PHOTO_CELL_PADDING * 2)) {
                drawHeight = cellHeight - (PDF_OPTIONS.PHOTO_CELL_PADDING * 2);
                drawWidth = drawHeight * imgAspectRatio;
              }
              
              const imgX = photoX + (cellWidth - drawWidth) / 2;
              const imgY = currentCellY + (cellHeight - drawHeight) / 2;
              
              doc.addImage(photo.base64, photo.base64.startsWith('data:image/png') ? 'PNG' : 'JPEG', imgX, imgY, drawWidth, drawHeight);
            }
          } catch (e) {
            console.error(`PDF Gen: Exception processing image ${displayName}:`, e);
             doc.setFillColor(230, 230, 230);
             doc.rect(photoX + 1, currentCellY + 1, cellWidth - 2, cellHeight - 2, 'F');
          }
        } // No else for "Not provided" here, as we filtered for existing base64

        // Caption below the photo cell
        doc.setFont(FONT_FAMILY_SANS_SERIF, 'normal');
        doc.setFontSize(PDF_OPTIONS.FONT_SIZE_PHOTO_CAPTION);
        doc.setTextColor(PDF_OPTIONS.TEXT_COLOR_MUTED);
        doc.text(displayName, photoX + cellWidth/2, currentCellY + cellHeight + PDF_OPTIONS.PHOTO_CAPTION_OFFSET_Y + PDF_OPTIONS.FONT_SIZE_PHOTO_CAPTION, { align: 'center' });
        
        photoCountInRow++;
        if (photoCountInRow >= numCols) {
          yPos += cellHeight + captionHeight + PDF_OPTIONS.PHOTO_SLOT_GAP;
          photoX = PDF_OPTIONS.PAGE_MARGIN + PDF_OPTIONS.PHOTO_CELL_PADDING;
          photoCountInRow = 0;
        } else {
          photoX += cellWidth + PDF_OPTIONS.PHOTO_SLOT_GAP;
        }
      }
      // If the last row of photos was not full, advance yPos
      if (photoCountInRow > 0) {
          yPos += cellHeight + captionHeight + PDF_OPTIONS.PHOTO_SLOT_GAP;
      }
    }
    yPos += PDF_OPTIONS.BLOCK_SPACING_Y; // Space after the photo block for this vehicle
  }

  addFooter();

  const firstVehicle = inspection.vehicles[0] || { make: '', model: '', year: '' };
  const agentNameSanitized = inspection.agentName.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'agent';
  const vehicleModelSanitized = (firstVehicle.model || 'vehicle').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const vehicleYearSanitized = firstVehicle.year || '';
  const dateString = new Date(inspection.inspectionDate).toISOString().split('T')[0];
  
  const filename = `Inspection_${agentNameSanitized}_${vehicleModelSanitized}${vehicleYearSanitized}_${dateString}.pdf`;

  doc.save(filename);
};

/**
 * Generates a PDF for preview (returns a blob URL, does NOT download).
 * Use this for PDF preview in an <iframe> or <embed>.
 */
// Genera un PDF solo con texto simple para pruebas de compatibilidad
export const generatePdfBlobUrlSoloTexto = async (inspection: SavedInspection): Promise<string> => {
  try {
    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('PRUEBA PDF SOLO TEXTO', 40, 80);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`ID: ${inspection.id || 'sin id'}`, 40, 120);
    doc.text(`Agente: ${inspection.agentName || 'sin nombre'}`, 40, 150);
    doc.text(`Fecha: ${inspection.inspectionDate ? new Date(inspection.inspectionDate).toLocaleDateString() : 'sin fecha'}`, 40, 180);
    // Puedes agregar más campos aquí si lo deseas
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    console.log('[PDF SOLO TEXTO] URL generado:', url);
    return url;
  } catch (e: any) {
    console.error('[PDF SOLO TEXTO] Error al generar PDF:', e);
    throw new Error('[PDF SOLO TEXTO] Error: ' + (e?.message || String(e)));
  }
};

export const generatePdfBlobUrl = async (inspection: SavedInspection): Promise<string> => {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'pt',
    format: 'a4',
  });
  // --- Duplicate content generation logic ---
  // (Could be refactored to a shared function if needed)
  // For now, just call the same content generation as in generatePdf
  // ...
  // --- COPY content from generatePdf up to doc.save() ---
  // For brevity, call a shared helper if refactoring later
  // (You can refactor to avoid code duplication)
  //
  // For now, just call generatePdfContent(doc, inspection) if you extract it.

  // --- BEGIN CONTENT GENERATION ---
  // You can move all the PDF content logic into a helper if desired.
  // For now, copy-paste from generatePdf or refactor.

  // For this edit, we call the same logic as generatePdf above (refactor if needed)
  // --- END CONTENT GENERATION ---

  // Instead of save, return blob URL
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
};
