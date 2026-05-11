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
  PRIMARY:    [30, 64, 175]   as [number, number, number],
  SECONDARY:  [71, 85, 105]   as [number, number, number],
  SUCCESS:    [5, 150, 105]   as [number, number, number],
  DANGER:     [185, 28, 28]   as [number, number, number],
  WARN:       [245, 158, 11]  as [number, number, number],
  TEXT_MAIN:  [15, 23, 42]    as [number, number, number],
  TEXT_MUTED: [100, 116, 139] as [number, number, number],
  BG_LIGHT:   [248, 250, 252] as [number, number, number],
  BG_ACCENT:  [238, 242, 255] as [number, number, number],
  BORDER:     [226, 232, 240] as [number, number, number],
  WHITE:      [255, 255, 255] as [number, number, number],
  BLACK:      [0, 0, 0]       as [number, number, number],
  SHADOW:     [203, 213, 225] as [number, number, number],
};

const PW     = 210;
const MX     = 20;
const CW     = PW - MX * 2;
const BAND_W = 6;

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

    // Reserva espacio si el contenido no cabe en la página actual.
    // NOTA: no se usa para secciones (siempre abren página nueva).
    const checkPage = (h: number) => {
      if (y + h > 272) {
        doc.addPage();
        y = this.drawHeaderContinuation(doc, datos);
      }
    };

    // Cada tarea: si no cabe completa, salta de página.
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

    // 3. Secciones — cada una comienza en página nueva (excepto la primera,
    //    que continúa tras la metadata si hay espacio; en la práctica la
    //    portada + metadata ya ocupa casi una página, así que también salta).
    let primeraSeccion = true;
    for (const seccion of datos.secciones) {
      if (!primeraSeccion) {
        // Forzar nueva página para cada sección
        doc.addPage();
        y = this.drawHeaderContinuation(doc, datos);
      } else {
        // Para la primera sección comprobamos si cabe el encabezado (≈28mm)
        if (y + 28 > 272) {
          doc.addPage();
          y = this.drawHeaderContinuation(doc, datos);
        }
        primeraSeccion = false;
      }

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

    doc.setFillColor(...C.BG_LIGHT);
    doc.rect(0, 0, PW, 70, 'F');

    doc.setFillColor(...C.PRIMARY);
    doc.rect(0, 0, BAND_W, 297, 'F');

    doc.setFillColor(...C.PRIMARY);
    doc.rect(BAND_W, 68, PW - BAND_W, 2, 'F');

    if (this.logoBase64) {
      doc.addImage(this.logoBase64, 'PNG', PW - MX - 38, 12, 38, 38, undefined, 'FAST');
    }

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

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.SECONDARY);
    doc.setFontSize(9);
    doc.text(`${datos.fecha}   ·   ${datos.tecnico}`, MX + BAND_W, 62);

    return 82;
  }

  // ─── ENCABEZADO DE PÁGINAS SIGUIENTES ──────────────────────────────────────

  private drawHeaderContinuation(doc: any, datos: DatosPDF): number {
    const X = (t: string) => t ?? '';

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

    doc.setFillColor(...C.BG_ACCENT);
    doc.roundedRect(MX + BAND_W, y, CW - BAND_W, 13, 2, 2, 'F');

    doc.setFillColor(...C.PRIMARY);
    doc.roundedRect(MX + BAND_W, y, 3, 13, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...C.PRIMARY);
    doc.text(X(seccion.tituloSeccion).toUpperCase(), MX + BAND_W + 8, y + 9);
    y += 19;

    // Encabezado de tabla — SIN columna REF
    doc.setFillColor(...C.SECONDARY);
    doc.rect(MX + BAND_W, y, CW - BAND_W, 9, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.WHITE);
    doc.text('ESTADO', MX + BAND_W + 20, y + 5.5, { align: 'center' });
    doc.text('DESCRIPCIÓN DE LA TAREA', MX + BAND_W + 42, y + 5.5);
    y += 9;

    return y;
  }

  // ─── CÁLCULO DE ALTURA DE FILA ─────────────────────────────────────────────

  private calcRowHeight(doc: any, punto: PuntoPDF): number {
    const X = (t: string) => t ?? '';
    // Ancho disponible para descripción (sin columna REF)
    const descW = CW - BAND_W - 42;
    const descLines = doc.splitTextToSize(X(punto.descripcionManual), descW);
    const noteLines = punto.notaPunto
      ? doc.splitTextToSize('Nota: ' + punto.notaPunto, descW)
      : [];

    // Altura mínima de la fila: suficiente para que badge y texto queden al mismo nivel
    const ROW_PADDING_TOP    = 5;  // espacio superior antes del texto
    const ROW_PADDING_BOTTOM = 5;  // espacio inferior
    const LINE_H             = 5.5;
    const BADGE_H            = 7;

    let contentH = ROW_PADDING_TOP + ROW_PADDING_BOTTOM;
    contentH += descLines.length * LINE_H;
    if (punto.amperios || punto.hz || punto.bar || punto.porcentaje) contentH += 10;
    if (punto.bombasQuimicas?.length) contentH += punto.bombasQuimicas.length * 7 + 4;
    if (noteLines.length) contentH += noteLines.length * 5 + 4;

    // La altura mínima debe acomodar el badge verticalmente centrado con padding
    return Math.max(BADGE_H + ROW_PADDING_TOP + ROW_PADDING_BOTTOM, contentH);
  }

  // ─── FILA DE PUNTO/TAREA ───────────────────────────────────────────────────

  private drawPunto(doc: any, punto: PuntoPDF, y: number, rowIdx: number): number {
    const X = (t: string) => t ?? '';
    const rowH     = this.calcRowHeight(doc, punto);
    const startX   = MX + BAND_W;
    const efectiveCW = CW - BAND_W;

    // Zebra striping
    if (rowIdx % 2 === 0) {
      doc.setFillColor(250, 251, 255);
      doc.rect(startX, y, efectiveCW, rowH, 'F');
    }

    // ── Badge de estado ────────────────────────────────────────────────────
    // Alineado verticalmente al centro de la fila.
    // El texto de descripción también arranca en el mismo centro vertical
    // para que ambos estén a la misma altura visual.

    const BADGE_W = 22;
    const BADGE_H = 7;
    const badgeCenterX = startX + 21;           // centro horizontal del badge
    const rowCenterY   = y + rowH / 2;          // centro vertical de la fila

    const bx = badgeCenterX - BADGE_W / 2;
    const by = rowCenterY   - BADGE_H / 2;

    let statusLabel = 'PEND.';
    let statusBg: [number, number, number] = C.BORDER;
    let statusTxt: [number, number, number] = C.TEXT_MUTED;

    if (punto.ok) {
      statusLabel = 'OK';
      statusBg    = C.SUCCESS;
      statusTxt   = C.WHITE;
    } else if (punto.noOk) {
      statusLabel = 'NO OK';
      statusBg    = C.DANGER;
      statusTxt   = C.WHITE;
    }

    doc.setFillColor(...statusBg);
    doc.roundedRect(bx, by, BADGE_W, BADGE_H, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...statusTxt);
    doc.text(statusLabel, badgeCenterX, by + BADGE_H / 2 + 2.5, { align: 'center' });

    // ── Descripción ────────────────────────────────────────────────────────
    // El texto arranca alineado con el mismo centro vertical que el badge,
    // desplazado hacia arriba según el número de líneas para que el bloque
    // de texto quede centrado (igual que el badge).

    const descW     = efectiveCW - 42;
    const descX     = startX + 42;
    const descLines = doc.splitTextToSize(X(punto.descripcionManual), descW);
    const LINE_H    = 5.5;

    // Calcular cuánto ocupa el bloque de texto completo de esta fila
    let blockH = descLines.length * LINE_H;
    if (punto.amperios || punto.hz || punto.bar || punto.porcentaje) blockH += 10;
    if (punto.bombasQuimicas?.length) blockH += punto.bombasQuimicas.length * 7 + 4;
    if (punto.notaPunto) {
      const noteLines = doc.splitTextToSize('Nota: ' + punto.notaPunto, descW);
      blockH += noteLines.length * 5 + 4;
    }

    // Punto de inicio del bloque para centrarlo verticalmente en la fila
    let curY = rowCenterY - blockH / 2 + LINE_H; // +LINE_H = baseline del primer renglón

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(...C.TEXT_MAIN);
    doc.text(descLines, descX, curY);
    curY += descLines.length * LINE_H;

    // Medidas (badges)
    const medValues: string[] = [];
    if (punto.amperios)   medValues.push(`${punto.amperios} A`);
    if (punto.hz)         medValues.push(`${punto.hz} Hz`);
    if (punto.bar)        medValues.push(`${punto.bar} Bar`);
    if (punto.porcentaje) medValues.push(`${punto.porcentaje}%`);

    if (medValues.length > 0) {
      const label = medValues.join('  ·  ');
      const bW    = doc.getTextWidth(label) + 10;
      doc.setFillColor(...C.BG_ACCENT);
      doc.roundedRect(descX, curY, bW, 6.5, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...C.PRIMARY);
      doc.text(label, descX + 5, curY + 4.5);
      curY += 10;
    }

    // Bombas Químicas
    if (punto.bombasQuimicas?.length) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(...C.WARN);
      for (const b of punto.bombasQuimicas) {
        doc.text(
          `o ${b.nombre}: ${b.amperios || '0'} A  /  ${b.porcentaje || '0'}%`,
          descX, curY + 3
        );
        curY += 7;
      }
      curY += 2;
    }

    // Notas
    if (punto.notaPunto) {
      const noteLines = doc.splitTextToSize('Nota: ' + punto.notaPunto, descW);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(...C.SECONDARY);
      doc.text(noteLines, descX, curY + 2);
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
    const startX     = MX + BAND_W;
    const efectiveCW = CW - BAND_W;
    const obsLines   = doc.splitTextToSize(texto, efectiveCW - 14);
    const obsH       = obsLines.length * 6 + 16;
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
    const startX     = MX + BAND_W;
    const efectiveCW = CW - BAND_W;

    const cols   = 2;
    const gap    = 10;
    const fW     = (efectiveCW - gap * (cols - 1)) / cols;
    const fH_max = 72;
    const LABEL_H = 8;  // altura del texto "Foto N / M" bajo cada imagen
    const ROW_H  = fH_max + LABEL_H;

    // Encabezado del bloque fotográfico
    checkPage(ROW_H + 16);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...C.TEXT_MUTED);
    doc.text('REGISTRO FOTOGRÁFICO', startX, y + 5);
    y += 12;

    for (let i = 0; i < fotos.length; i++) {
      const col = i % cols;

      // Al inicio de cada nueva fila de imágenes, comprobar que cabe
      if (col === 0) {
        checkPage(ROW_H + 4);
      }

      const fx = startX + col * (fW + gap);

      // Sombra simulada
      doc.setFillColor(...C.SHADOW);
      doc.roundedRect(fx + 2, y + 2, fW, fH_max, 3, 3, 'F');

      // Fondo blanco del frame
      doc.setFillColor(...C.WHITE);
      doc.roundedRect(fx, y, fW, fH_max, 3, 3, 'F');

      try {
        const b64      = fotos[i];
        const fmt      = b64.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        const props    = doc.getImageProperties(b64);
        const imgRatio = props.width / props.height;
        const boxRatio = fW / fH_max;

        let finalW = fW;
        let finalH = fH_max;
        if (imgRatio > boxRatio) {
          finalH = fW / imgRatio;
        } else {
          finalW = fH_max * imgRatio;
        }

        const offsetX = (fW     - finalW) / 2;
        const offsetY = (fH_max - finalH) / 2;

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

      // Avanzar y solo al completar una fila (dos columnas) o en la última foto
      const esUltima      = i === fotos.length - 1;
      const completaFila  = col === cols - 1;
      if (completaFila || esUltima) {
        y += ROW_H + gap;
      }
    }

    return y + 4;
  }

  // ─── CONCLUSIONES ──────────────────────────────────────────────────────────

  private drawConclusiones(
    doc: any,
    texto: string,
    y: number,
    checkPage: (h: number) => void
  ): number {
    const startX     = MX + BAND_W;
    const efectiveCW = CW - BAND_W;
    const concLines  = doc.splitTextToSize(texto, efectiveCW - 16);
    const concH      = concLines.length * 6 + 24;
    checkPage(concH + 25);

    doc.setFillColor(...C.PRIMARY);
    doc.roundedRect(startX, y, efectiveCW, concH, 4, 4, 'F');

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

      doc.setFillColor(...C.PRIMARY);
      doc.rect(0, 0, BAND_W, 297, 'F');

      doc.setDrawColor(...C.BORDER);
      doc.setLineWidth(0.6);
      doc.line(MX + BAND_W, 284, PW - MX, 284);

      if (this.logoBase64) {
        try {
          doc.addImage(this.logoBase64, 'PNG', MX + BAND_W, 286, 8, 8, undefined, 'FAST');
        } catch { /* omitir si falla el logo */ }
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
        const canvas  = document.createElement('canvas');
        const scale   = 2;
        canvas.width  = (img.width  || 400) * scale;
        canvas.height = (img.height || 400) * scale;
        const ctx     = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject(new Error('Error al crear canvas'));
        }
      };
      img.onerror = reject;
      img.src     = url;
    });
  }
}
