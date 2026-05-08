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
  PRIMARY:      [15, 78, 150]   as [number, number, number],   // Azul corporativo elegante
  SUCCESS:      [22, 163, 74]   as [number, number, number],   // Verde éxito
  DANGER:       [220, 38, 38]   as [number, number, number],   // Rojo peligro
  WARN:         [217, 119, 6]   as [number, number, number],   // Ámbar
  TEXT_MAIN:    [15, 23, 42]    as [number, number, number],   // Slate 900
  TEXT_MUTED:   [100, 116, 139] as [number, number, number],   // Slate 500
  BG_LIGHT:     [248, 250, 252] as [number, number, number],   // Slate 50
  BG_ACCENT:    [239, 246, 255] as [number, number, number],   // Blue 50
  BORDER:       [226, 232, 240] as [number, number, number],   // Slate 200
  WHITE:        [255, 255, 255] as [number, number, number],
  BLACK:        [0, 0, 0]       as [number, number, number],
};

@Injectable({ providedIn: 'root' })
export class ServicioReporteDocumento {
  private logoBase64: string = '';

  async generarPDF(datos: DatosPDF): Promise<void> {
    const { jsPDF } = await import('jspdf');
    
    // Cargar logo local si no está cargado
    if (!this.logoBase64) {
      try {
        this.logoBase64 = await this.convertImageToBase64('/logo-gtm.png');
      } catch (err) {
        console.warn('No se pudo cargar el logo local:', err);
      }
    }

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const PW = 210;
    const MX = 15;
    const CW = PW - MX * 2;
    let y = 0;

    const X = (texto: string) => texto ?? '';

    const drawHeader = (isFirstPage: boolean) => {
      if (isFirstPage) {
        // --- PORTADA MODERNA ---
        doc.setFillColor(...C.BG_LIGHT);
        doc.rect(0, 0, PW, 60, 'F');
        
        // Logo
        if (this.logoBase64) {
          doc.addImage(this.logoBase64, 'PNG', PW - MX - 40, 10, 40, 40, undefined, 'FAST');
        }

        // Títulos
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.PRIMARY);
        doc.setFontSize(24);
        doc.text('INFORME TÉCNICO', MX, 25);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...C.TEXT_MUTED);
        doc.setFontSize(11);
        doc.text('MANTENIMIENTO PREVENTIVO DE INSTALACIONES', MX, 32);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.TEXT_MAIN);
        doc.setFontSize(18);
        doc.text(X(datos.nombreObra).toUpperCase(), MX, 45);

        // Línea de acento
        doc.setDrawColor(...C.PRIMARY);
        doc.setLineWidth(1.5);
        doc.line(MX, 52, MX + 20, 52);

        y = 70;
      } else {
        // --- MINI ENCABEZADO PAGINAS SIGUIENTES ---
        doc.setFillColor(...C.BG_LIGHT);
        doc.rect(0, 0, PW, 15, 'F');
        doc.setDrawColor(...C.BORDER);
        doc.line(0, 15, PW, 15);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...C.PRIMARY);
        doc.text(X(datos.nombreObra).toUpperCase(), MX, 10);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...C.TEXT_MUTED);
        doc.text(`${datos.fecha} | ${datos.tecnico}`, PW - MX, 10, { align: 'right' });
        y = 25;
      }
    };

    const checkPage = (h: number) => {
      if (y + h > 275) {
        doc.addPage();
        drawHeader(false);
      }
    };

    // 1. Dibujar primera cabecera
    drawHeader(true);

    // 2. Metadata (Técnico y Fecha)
    doc.setFillColor(...C.BG_ACCENT);
    doc.roundedRect(MX, y, CW, 20, 2, 2, 'F');
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.PRIMARY);
    doc.text('TÉCNICO RESPONSABLE', MX + 6, y + 7);
    doc.text('FECHA DEL INFORME', MX + CW/2 + 6, y + 7);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.TEXT_MAIN);
    doc.text(X(datos.tecnico) || 'No especificado', MX + 6, y + 14);
    doc.text(X(datos.fecha) || 'No especificada', MX + CW/2 + 6, y + 14);
    y += 30;

    // 3. Secciones
    for (const seccion of datos.secciones) {
      checkPage(20);
      
      // Título de Sección
      doc.setDrawColor(...C.PRIMARY);
      doc.setLineWidth(1);
      doc.line(MX, y, MX + CW, y);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...C.PRIMARY);
      doc.text(X(seccion.tituloSeccion).toUpperCase(), MX, y + 8);
      y += 12;

      // Encabezado de tabla
      doc.setFillColor(...C.BG_LIGHT);
      doc.rect(MX, y, CW, 7, 'F');
      doc.setFontSize(7);
      doc.setTextColor(...C.TEXT_MUTED);
      doc.text('ESTADO', MX + 3, y + 4.5);
      doc.text('REF', MX + 32, y + 4.5);
      doc.text('DESCRIPCIÓN DE LA TAREA', MX + 45, y + 4.5);
      y += 7;

      // Puntos/Tareas
      let rowIdx = 0;
      for (const punto of seccion.puntos) {
        const descLines = doc.splitTextToSize(X(punto.descripcionManual), CW - 50);
        const noteLines = punto.notaPunto ? doc.splitTextToSize('Nota: ' + punto.notaPunto, CW - 50) : [];
        
        let contentH = descLines.length * 4.5 + 4;
        if (punto.amperios || punto.hz || punto.bar || punto.porcentaje) contentH += 7;
        if (punto.bombasQuimicas?.length) contentH += punto.bombasQuimicas.length * 5 + 4;
        if (noteLines.length) contentH += noteLines.length * 4 + 2;

        const rowH = Math.max(10, contentH);
        checkPage(rowH + 5);

        // Zebra striping
        if (rowIdx % 2 === 0) {
          doc.setFillColor(252, 252, 252);
          doc.rect(MX, y, CW, rowH, 'F');
        }
        
        // Indicadores de estado (Círculos)
        const iy = y + 3.5;
        this.drawStatusCircle(doc, MX + 4, iy, 'REV', punto.revisado);
        this.drawStatusCircle(doc, MX + 12, iy, 'OK', punto.ok);
        this.drawStatusCircle(doc, MX + 20, iy, 'NO', punto.noOk);

        // ID Manual
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...C.TEXT_MUTED);
        doc.text(X(punto.idManual), MX + 32, y + 5.5);

        // Descripción
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...C.TEXT_MAIN);
        doc.text(descLines, MX + 45, y + 5.5);
        let curY = y + 5.5 + (descLines.length * 4.5);

        // Medidas (Badges)
        const medValues: string[] = [];
        if (punto.amperios) medValues.push(`${punto.amperios}A`);
        if (punto.hz) medValues.push(`${punto.hz}Hz`);
        if (punto.bar) medValues.push(`${punto.bar}Bar`);
        if (punto.porcentaje) medValues.push(`${punto.porcentaje}%`);

        if (medValues.length > 0) {
          doc.setFillColor(...C.BG_ACCENT);
          const badgeW = doc.getTextWidth(medValues.join('  •  ')) + 6;
          doc.roundedRect(MX + 45, curY, badgeW, 5, 1, 1, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(...C.PRIMARY);
          doc.text(medValues.join('  •  '), MX + 48, curY + 3.5);
          curY += 7;
        }

        // Bombas Químicas
        if (punto.bombasQuimicas?.length) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7.5);
          doc.setTextColor(...C.WARN);
          for (const b of punto.bombasQuimicas) {
            doc.text(`â—‹ ${b.nombre}: ${b.amperios || '0'}A / ${b.porcentaje || '0'}%`, MX + 47, curY + 3);
            curY += 5;
          }
          curY += 1;
        }

        // Notas
        if (noteLines.length) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.text(noteLines, MX + 45, curY + 2);
          curY += noteLines.length * 4 + 2;
        }

        // Separador fino
        doc.setDrawColor(...C.BORDER);
        doc.setLineWidth(0.1);
        doc.line(MX, y + rowH, MX + CW, y + rowH);

        y += rowH;
        rowIdx++;
      }

      // Observaciones de Sección
      if (seccion.observaciones?.trim()) {
        const obsLines = doc.splitTextToSize(seccion.observaciones, CW - 10);
        const obsH = obsLines.length * 4.5 + 8;
        checkPage(obsH + 10);
        
        doc.setFillColor(...C.BG_LIGHT);
        doc.roundedRect(MX, y + 2, CW, obsH, 1, 1, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...C.TEXT_MUTED);
        doc.text('OBSERVACIONES DE SECCIÓN:', MX + 4, y + 7);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(...C.TEXT_MAIN);
        doc.text(obsLines, MX + 4, y + 12);
        y += obsH + 10;
      } else {
        y += 8;
      }

      // Fotos de Sección
      const fotos = seccion.fotosBase64?.filter(f => !!f) ?? [];
      if (fotos.length > 0) {
        checkPage(60);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...C.TEXT_MUTED);
        doc.text('REGISTRO FOTOGRÁFICO', MX, y);
        y += 4;

        const cols = 3;
        const gap = 4;
        const fW = (CW - (gap * (cols - 1))) / cols;
        const fH = 40;

        for (let i = 0; i < fotos.length; i++) {
          const col = i % cols;
          if (col === 0 && i > 0) {
            y += fH + gap;
            checkPage(fH + gap);
          }
          const fx = MX + col * (fW + gap);
          
          try {
            const b64 = fotos[i];
            const fmt = b64.startsWith('data:image/png') ? 'PNG' : 'JPEG';
            doc.setDrawColor(...C.BORDER);
            doc.roundedRect(fx, y, fW, fH, 1, 1, 'S');
            doc.addImage(b64, fmt, fx + 0.5, y + 0.5, fW - 1, fH - 1, undefined, 'FAST');
          } catch (e) {
            doc.setFillColor(240, 240, 240);
            doc.rect(fx, y, fW, fH, 'F');
          }
        }
        y += fH + 15;
      }
    }

    // 4. Conclusiones Finales
    if (datos.conclusiones?.trim()) {
      const concLines = doc.splitTextToSize(datos.conclusiones, CW - 12);
      const concH = concLines.length * 5 + 15;
      checkPage(concH + 10);
      
      doc.setFillColor(...C.PRIMARY);
      doc.roundedRect(MX, y, CW, concH, 2, 2, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...C.WHITE);
      doc.text('CONCLUSIONES GENERALES', MX + 6, y + 8);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.text(concLines, MX + 6, y + 15);
      y += concH + 10;
    }

    // 5. Pie de Página (Global)
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(...C.BORDER);
      doc.setLineWidth(0.5);
      doc.line(MX, 285, PW - MX, 285);
      
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C.TEXT_MUTED);
      doc.text(`GTM Mantenimiento — ${datos.nombreObra}`, MX, 290);
      doc.text(`Página ${i} de ${totalPages}`, PW - MX, 290, { align: 'right' });
    }

    const filename = `Informe_${datos.nombreObra}_${datos.fecha}`
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_') + '.pdf';
    doc.save(filename);
  }

  private drawStatusCircle(doc: any, x: number, y: number, label: string, active: boolean) {
    const size = 5;
    const color = label === 'OK' ? C.SUCCESS : label === 'NO' ? C.DANGER : C.WARN;
    
    if (active) {
      doc.setFillColor(...color);
      doc.circle(x + size/2, y + size/2, size/2, 'F');
      doc.setTextColor(...C.WHITE);
      doc.setFontSize(4);
      doc.setFont('helvetica', 'bold');
      doc.text(label, x + size/2, y + size/2 + 1.2, { align: 'center' });
    } else {
      doc.setDrawColor(...C.BORDER);
      doc.setLineWidth(0.1);
      doc.circle(x + size/2, y + size/2, size/2, 'S');
      doc.setTextColor(...C.BORDER);
      doc.setFontSize(4);
      doc.text(label, x + size/2, y + size/2 + 1.2, { align: 'center' });
    }
  }

  private async convertImageToBase64(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function() {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(xhr.response);
      };
      xhr.onerror = reject;
      xhr.open('GET', url);
      xhr.responseType = 'blob';
      xhr.send();
    });
  }
}
