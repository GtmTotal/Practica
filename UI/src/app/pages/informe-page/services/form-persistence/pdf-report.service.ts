import { Injectable } from '@angular/core';

export interface DatosPDF {
  nombreObra: string;
  tecnico: string;
  fecha: string;
  conclusiones: string;
  secciones: SeccionPDF[];
}

export interface SeccionPDF {
  tituloSeccion: string;
  tipoSeccion: string;
  observaciones: string;
  puntos: PuntoPDF[];
  fotosBase64?: string[];
}

export interface PuntoPDF {
  idManual: string;
  descripcionManual: string;
  revisado: boolean;
  ok: boolean;
  noOk: boolean;
  notaPunto: string;
  amperios: string;
  hz: string;
  bar: string;
  porcentaje: string;
  bombasQuimicas: BombaPDF[];
}

export interface BombaPDF {
  nombre: string;
  amperios: string;
  porcentaje: string;
}

// --- CONFIGURACIÓN ESTÉTICA ---
const C = {
  PRIMARY:    [30, 64, 175]   as [number, number, number], // Indigo-700
  SECONDARY:  [71, 85, 105]   as [number, number, number], // Slate-600
  SUCCESS:    [5, 150, 105]   as [number, number, number], // Emerald-600
  DANGER:     [185, 28, 28]   as [number, number, number], // Red-700
  WARN:       [245, 158, 11]  as [number, number, number], // Amber-500
  TEXT_MAIN:  [15, 23, 42]    as [number, number, number], // Slate-900
  TEXT_MUTED: [100, 116, 139] as [number, number, number], // Slate-500
  BG_LIGHT:   [248, 250, 252] as [number, number, number], // Slate-50
  BG_ACCENT:  [238, 242, 255] as [number, number, number], // Indigo-50
  BORDER:     [226, 232, 240] as [number, number, number], // Slate-200
  WHITE:      [255, 255, 255] as [number, number, number],
  BLACK:      [0, 0, 0]       as [number, number, number],
  SHADOW:     [203, 213, 225] as [number, number, number], // Slate-300
};

const PW  = 210;
const MX  = 20;
const CW  = PW - MX * 2;
const BAND_W = 6; // Ancho de la banda lateral de color

@Injectable({ providedIn: 'root' })
export class ServicioReporteDocumento {
  private logoBase64: string = '';

  // ─── PÚBLICO ───────────────────────────────────────────────────────────────

  async generarPDF(datos: DatosPDF): Promise<void> {
    const { jsPDF } = await import('jspdf');

    if (!this.logoBase64) {
      try {
        this.logoBase64 = await this.convertImageToBase64('/logoNoOficial.svg');
      } catch (err) {
        console.warn('No se pudo cargar el logo local:', err);
      }
    }

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    let y = 0;

    const checkPage = (h: number) => {
      if (y + h > 272) {
        doc.addPage();
        y = this.drawHeaderContinuation(doc, datos);
      }
    };

    const checkPageForSection = () => {
      if (y > 232) {
        doc.addPage();
        y = this.drawHeaderContinuation(doc, datos);
      }
    };

    const checkPageForTask = (taskHeight: number) => {
      if (y + taskHeight > 272) {
        doc.addPage();
        y = this.drawHeaderContinuation(doc, datos);
      }
    };

    // 1. Portada
    y = this.drawPortada(doc, datos);

    // 2. Metadata
    y = this.drawMetadata(doc, datos, y);

    // 3. Secciones
    for (const seccion of datos.secciones) {
      checkPageForSection();
      y = this.drawSeccionHeader(doc, seccion, y);

      let rowIdx = 0;
      for (const punto of seccion.puntos) {
        const rowH = this.calcRowHeight(doc, punto);
        checkPageForTask(rowH + 10);
        y = this.drawPunto(doc, punto, y, rowIdx);
        rowIdx++;
      }

      if (seccion.observaciones?.trim()) {
        y = this.drawObservaciones(doc, seccion.observaciones, y, checkPage);
      } else {
        y += 12;
      }

      const fotos = seccion.fotosBase64?.filter(f => !!f) ?? [];
      if (fotos.length > 0) {
        y = this.drawFotos(doc, fotos, y, checkPage);
      }
    }

    // 4. Conclusiones
    if (datos.conclusiones?.trim()) {
      y = this.drawConclusiones(doc, datos.conclusiones, y, checkPage);
    }

    // 5. Pie de página global
    this.drawFooters(doc, datos);

    const filename = `Informe_${datos.nombreObra}_${datos.fecha}`
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_') + '.pdf';
    doc.save(filename);
  }

  // ─── PORTADA ───────────────────────────────────────────────────────────────

  private drawPortada(doc: any, datos: DatosPDF): number {
    const X = (t: string) => t ?? '';

    // Fondo suave
    doc.setFillColor(...C.BG_LIGHT);
    doc.rect(0, 0, PW, 70, 'F');

    // Banda lateral de color
    doc.setFillColor(...C.PRIMARY);
    doc.rect(0, 0, BAND_W, 297, 'F');

    // Línea de acento horizontal
    doc.setFillColor(...C.PRIMARY);
    doc.rect(BAND_W, 68, PW - BAND_W, 2, 'F');

    // Logo
    if (this.logoBase64) {
      doc.addImage(this.logoBase64, 'PNG', PW - MX - 38, 12, 38, 38, undefined, 'FAST');
    }

    // Títulos
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.PRIMARY);
    doc.setFontSize(22);
    doc.text('INFORME TÉCNICO', MX + BAND_W, 28);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.TEXT_MUTED);
    doc.setFontSize(10);
    doc.text('MANTENIMIENTO PREVENTIVO DE INSTALACIONES', MX + BAND_W, 36);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.TEXT_MAIN);
    doc.setFontSize(17);
    doc.text(X(datos.nombreObra).toUpperCase(), MX + BAND_W, 52);

    // Subtítulo descriptivo
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.SECONDARY);
    doc.setFontSize(9);
    doc.text(`${datos.fecha}   ·   ${datos.tecnico}`, MX + BAND_W, 62);

    return 82;
  }

  // ─── ENCABEZADO DE PÁGINAS SIGUIENTES ──────────────────────────────────────

  private drawHeaderContinuation(doc: any, datos: DatosPDF): number {
    const X = (t: string) => t ?? '';

    // Banda lateral persistente
    doc.setFillColor(...C.PRIMARY);
    doc.rect(0, 0, BAND_W, 297, 'F');

    doc.setFillColor(...C.BG_LIGHT);
    doc.rect(BAND_W, 0, PW - BAND_W, 16, 'F');
    doc.setDrawColor(...C.BORDER);
    doc.setLineWidth(0.3);
    doc.line(BAND_W, 16, PW, 16);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...C.PRIMARY);
    doc.text(X(datos.nombreObra).toUpperCase(), MX + BAND_W, 10);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.TEXT_MUTED);
    doc.text(`${datos.fecha}  ·  ${datos.tecnico}`, PW - MX, 10, { align: 'right' });

    return 26;
  }

  // ─── METADATA ──────────────────────────────────────────────────────────────

  private drawMetadata(doc: any, datos: DatosPDF, y: number): number {
    const X = (t: string) => t ?? '';

    doc.setFillColor(...C.BG_ACCENT);
    doc.roundedRect(MX + BAND_W, y, CW - BAND_W, 22, 3, 3, 'F');

    // Separador central
    doc.setDrawColor(...C.BORDER);
    doc.setLineWidth(0.2);
    doc.line(MX + BAND_W + (CW - BAND_W) / 2, y + 4, MX + BAND_W + (CW - BAND_W) / 2, y + 18);

    const col1X = MX + BAND_W + 8;
    const col2X = MX + BAND_W + (CW - BAND_W) / 2 + 8;

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.PRIMARY);
    doc.text('TÉCNICO RESPONSABLE', col1X, y + 8);
    doc.text('FECHA DEL INFORME', col2X, y + 8);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.TEXT_MAIN);
    doc.text(X(datos.tecnico) || 'No especificado', col1X, y + 16);
    doc.text(X(datos.fecha) || 'No especificada', col2X, y + 16);

    return y + 32;
  }

  // ─── ENCABEZADO DE SECCIÓN ─────────────────────────────────────────────────

  private drawSeccionHeader(doc: any, seccion: SeccionPDF, y: number): number {
    const X = (t: string) => t ?? '';
    y += 5;

    // Fondo de cabecera de sección
    doc.setFillColor(...C.BG_ACCENT);
    doc.roundedRect(MX + BAND_W, y, CW - BAND_W, 13, 2, 2, 'F');

    // Acento izquierdo de sección (pequeña barra adicional)
    doc.setFillColor(...C.PRIMARY);
    doc.roundedRect(MX + BAND_W, y, 3, 13, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...C.PRIMARY);
    doc.text(X(seccion.tituloSeccion).toUpperCase(), MX + BAND_W + 8, y + 9);
    y += 19;

    // Encabezado de tabla
    doc.setFillColor(...C.SECONDARY);
    doc.rect(MX + BAND_W, y, CW - BAND_W, 9, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.WHITE);
    doc.text('ESTADO', MX + BAND_W + 16, y + 5.5, { align: 'center' });
    doc.text('REF', MX + BAND_W + 37, y + 5.5, { align: 'center' });
    doc.text('DESCRIPCIÓN DE LA TAREA', MX + BAND_W + 50, y + 5.5);
    y += 9;

    return y;
  }

  // ─── FILA DE PUNTO/TAREA ───────────────────────────────────────────────────

  private calcRowHeight(doc: any, punto: PuntoPDF): number {
    const X = (t: string) => t ?? '';
    const descLines = doc.splitTextToSize(X(punto.descripcionManual), CW - BAND_W - 52);
    const noteLines = punto.notaPunto ? doc.splitTextToSize('Nota: ' + punto.notaPunto, CW - BAND_W - 52) : [];

    let contentH = descLines.length * 5.5 + 6;
    if (punto.amperios || punto.hz || punto.bar || punto.porcentaje) contentH += 10;
    if (punto.bombasQuimicas?.length) contentH += punto.bombasQuimicas.length * 7 + 6;
    if (noteLines.length) contentH += noteLines.length * 5 + 4;

    return Math.max(14, contentH);
  }

  private drawPunto(doc: any, punto: PuntoPDF, y: number, rowIdx: number): number {
    const X = (t: string) => t ?? '';
    const rowH = this.calcRowHeight(doc, punto);
    const efectiveCW = CW - BAND_W;
    const startX = MX + BAND_W;

    // Zebra striping
    if (rowIdx % 2 === 0) {
      doc.setFillColor(250, 251, 255);
      doc.rect(startX, y, efectiveCW, rowH, 'F');
    }

    // Badge de estado (más grande y legible)
    const badgeW = 18;
    const badgeH = 6;
    const bx = startX + 16 - (badgeW / 2);
    const by = y + (rowH / 2) - (badgeH / 2);

    let statusLabel = 'PEND.';
    let statusBg: [number, number, number] = C.BORDER;
    let statusTxt: [number, number, number] = C.TEXT_MUTED;

    if (punto.ok) {
      statusLabel = '✓ OK';
      statusBg = C.SUCCESS;
      statusTxt = C.WHITE;
    } else if (punto.noOk) {
      statusLabel = '✗ NO';
      statusBg = C.DANGER;
      statusTxt = C.WHITE;
    }

    doc.setFillColor(...statusBg);
    doc.roundedRect(bx, by, badgeW, badgeH, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...statusTxt);
    doc.text(statusLabel, bx + badgeW / 2, by + 4, { align: 'center' });

    // REF en fuente monoespaciada
    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...C.TEXT_MUTED);
    doc.text(X(punto.idManual), startX + 37, y + (rowH / 2) + 1, { align: 'center' });

    // Descripción
    const descLines = doc.splitTextToSize(X(punto.descripcionManual), efectiveCW - 52);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(...C.TEXT_MAIN);
    doc.text(descLines, startX + 50, y + 6);
    let curY = y + 6 + descLines.length * 5.5;

    // Medidas (badges)
    const medValues: string[] = [];
    if (punto.amperios) medValues.push(`${punto.amperios} A`);
    if (punto.hz)       medValues.push(`${punto.hz} Hz`);
    if (punto.bar)      medValues.push(`${punto.bar} Bar`);
    if (punto.porcentaje) medValues.push(`${punto.porcentaje}%`);

    if (medValues.length > 0) {
      const label = medValues.join('  ·  ');
      const bW = doc.getTextWidth(label) + 10;
      doc.setFillColor(...C.BG_ACCENT);
      doc.roundedRect(startX + 50, curY, bW, 6.5, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...C.PRIMARY);
      doc.text(label, startX + 55, curY + 4.5);
      curY += 10;
    }

    // Bombas Químicas
    if (punto.bombasQuimicas?.length) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(...C.WARN);
      for (const b of punto.bombasQuimicas) {
        doc.text(`○ ${b.nombre}: ${b.amperios || '0'} A  /  ${b.porcentaje || '0'}%`, startX + 52, curY + 3);
        curY += 7;
      }
      curY += 2;
    }

    // Notas
    if (punto.notaPunto) {
      const noteLines = doc.splitTextToSize('Nota: ' + punto.notaPunto, efectiveCW - 52);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(...C.SECONDARY);
      doc.text(noteLines, startX + 50, curY + 2);
    }

    // Separador fino
    doc.setDrawColor(...C.BORDER);
    doc.setLineWidth(0.1);
    doc.line(startX, y + rowH, startX + efectiveCW, y + rowH);

    return y + rowH;
  }

  // ─── OBSERVACIONES ─────────────────────────────────────────────────────────

  private drawObservaciones(
    doc: any,
    texto: string,
    y: number,
    checkPage: (h: number) => void
  ): number {
    const startX = MX + BAND_W;
    const efectiveCW = CW - BAND_W;
    const obsLines = doc.splitTextToSize(texto, efectiveCW - 14);
    const obsH = obsLines.length * 6 + 16;
    checkPage(obsH + 20);

    doc.setFillColor(...C.BG_LIGHT);
    doc.roundedRect(startX, y + 3, efectiveCW, obsH, 2, 2, 'F');
    doc.setDrawColor(...C.BORDER);
    doc.setLineWidth(0.2);
    doc.roundedRect(startX, y + 3, efectiveCW, obsH, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...C.TEXT_MUTED);
    doc.text('OBSERVACIONES DE SECCIÓN:', startX + 6, y + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...C.TEXT_MAIN);
    doc.text(obsLines, startX + 6, y + 17);

    return y + obsH + 15;
  }

  // ─── FOTOS ─────────────────────────────────────────────────────────────────

  private drawFotos(
    doc: any,
    fotos: string[],
    y: number,
    checkPage: (h: number) => void
  ): number {
    const startX = MX + BAND_W;
    const efectiveCW = CW - BAND_W;
    checkPage(95);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...C.TEXT_MUTED);
    doc.text('REGISTRO FOTOGRÁFICO', startX, y);
    y += 8;

    const cols   = 2;
    const gap    = 10;
    const fW     = (efectiveCW - gap * (cols - 1)) / cols;
    const fH_max = 72;

    for (let i = 0; i < fotos.length; i++) {
      const col = i % cols;
      if (col === 0 && i > 0) {
        y += fH_max + gap + 14;
        checkPage(fH_max + gap + 18);
      }
      const fx = startX + col * (fW + gap);

      // Sombra simulada
      doc.setFillColor(...C.SHADOW);
      doc.roundedRect(fx + 2, y + 2, fW, fH_max, 3, 3, 'F');

      // Fondo blanco del frame
      doc.setFillColor(...C.WHITE);
      doc.roundedRect(fx, y, fW, fH_max, 3, 3, 'F');

      try {
        const b64  = fotos[i];
        const fmt  = b64.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        const props = doc.getImageProperties(b64);
        const imgRatio = props.width / props.height;
        const boxRatio = fW / fH_max;

        let finalW = fW;
        let finalH = fH_max;
        if (imgRatio > boxRatio) {
          finalH = fW / imgRatio;
        } else {
          finalW = fH_max * imgRatio;
        }

        const offsetX = (fW - finalW) / 2;
        const offsetY = (fH_max - finalH) / 2;

        // Clip con roundedRect — marco de borde
        doc.setDrawColor(...C.BORDER);
        doc.setLineWidth(0.3);
        doc.roundedRect(fx, y, fW, fH_max, 3, 3, 'S');
        doc.addImage(b64, fmt, fx + offsetX, y + offsetY, finalW, finalH, undefined, 'MEDIUM');

      } catch {
        doc.setFillColor(240, 240, 240);
        doc.roundedRect(fx, y, fW, fH_max, 3, 3, 'F');
      }

      // Numeración de foto
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...C.TEXT_MUTED);
      doc.text(`Foto ${i + 1} / ${fotos.length}`, fx + fW / 2, y + fH_max + 5, { align: 'center' });
    }

    return y + fH_max + 22;
  }

  // ─── CONCLUSIONES ──────────────────────────────────────────────────────────

  private drawConclusiones(
    doc: any,
    texto: string,
    y: number,
    checkPage: (h: number) => void
  ): number {
    const startX = MX + BAND_W;
    const efectiveCW = CW - BAND_W;
    const concLines = doc.splitTextToSize(texto, efectiveCW - 16);
    const concH = concLines.length * 6 + 24;
    checkPage(concH + 25);

    doc.setFillColor(...C.PRIMARY);
    doc.roundedRect(startX, y, efectiveCW, concH, 4, 4, 'F');

    // Acento decorativo (rectángulo semitransparente claro)
    doc.setFillColor(255, 255, 255);
    doc.setGState && doc.setGState(doc.GState({ opacity: 0.07 }));
    doc.roundedRect(startX + efectiveCW - 30, y + 4, 25, concH - 8, 3, 3, 'F');
    doc.setGState && doc.setGState(doc.GState({ opacity: 1 }));

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...C.WHITE);
    doc.text('CONCLUSIONES GENERALES', startX + 10, y + 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.text(concLines, startX + 10, y + 20);

    return y + concH + 20;
  }

  // ─── PIE DE PÁGINA GLOBAL ──────────────────────────────────────────────────

  private drawFooters(doc: any, datos: DatosPDF): void {
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // Banda lateral en todas las páginas
      doc.setFillColor(...C.PRIMARY);
      doc.rect(0, 0, BAND_W, 297, 'F');

      // Línea divisora
      doc.setDrawColor(...C.BORDER);
      doc.setLineWidth(0.6);
      doc.line(MX + BAND_W, 284, PW - MX, 284);

      // Logo en miniatura (si está disponible)
      if (this.logoBase64) {
        try {
          doc.addImage(this.logoBase64, 'PNG', MX + BAND_W, 286, 8, 8, undefined, 'FAST');
        } catch { /* si falla el logo, omitir */ }
      }

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C.TEXT_MUTED);
      doc.text(`GTM Mantenimiento  ·  ${datos.nombreObra}`, MX + BAND_W + 11, 291);
      doc.text(`Página ${i} de ${totalPages}`, PW - MX, 291, { align: 'right' });
    }
  }

  // ─── UTILIDADES ────────────────────────────────────────────────────────────

  private async convertImageToBase64(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = 2;
        canvas.width  = (img.width  || 400) * scale;
        canvas.height = (img.height || 400) * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject(new Error('Error al crear canvas'));
        }
      };
      img.onerror = reject;
      img.src = url;
    });
  }
}