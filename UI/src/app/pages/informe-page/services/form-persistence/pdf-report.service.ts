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
  PRIMARY: [15, 78, 150] as [number, number, number],   // Azul corporativo
  SUCCESS: [22, 163, 74] as [number, number, number],   // Verde éxito
  DANGER: [220, 38, 38] as [number, number, number],   // Rojo peligro
  WARN: [217, 119, 6] as [number, number, number],   // Ámbar
  TEXT_MAIN: [15, 23, 42] as [number, number, number],   // Slate 900
  TEXT_MUTED: [100, 116, 139] as [number, number, number],   // Slate 500
  BG_LIGHT: [248, 250, 252] as [number, number, number],   // Slate 50
  BG_ACCENT: [239, 246, 255] as [number, number, number],   // Blue 50
  BORDER: [226, 232, 240] as [number, number, number],   // Slate 200
  WHITE: [255, 255, 255] as [number, number, number],
  BLACK: [0, 0, 0] as [number, number, number],
};

@Injectable({ providedIn: 'root' })
export class ServicioReporteDocumento {
  private logoBase64: string = '';

  async generarPDF(datos: DatosPDF): Promise<void> {
    const { jsPDF } = await import('jspdf');

    // Cargar logo local si no está cargado
    if (!this.logoBase64) {
      try {
        this.logoBase64 = await this.convertImageToBase64('/logoNoOficial.svg');
      } catch (err) {
        console.warn('No se pudo cargar el logo local:', err);
      }
    }

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const PW = 210;
    const MX = 20; // Aumentado de 15 a 20mm para más aire
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
      if (y + h > 270) { // Ajustado de 275 a 270 para acomodar márgenes mayores
        doc.addPage();
        drawHeader(false);
      }
    };

    // Separación inteligente: evita cortar secciones o tareas
    const checkPageForSection = () => {
      // Si quedan menos de 40mm en la página, salta a nueva página
      // Esto evita que un título de sección quede solo al final
      if (y > 230) {
        doc.addPage();
        drawHeader(false);
      }
    };

    const checkPageForTask = (taskHeight: number) => {
      // Si la tarea no cabe completa en la página, salta a nueva página
      // Esto evita cortar tareas a mitad
      if (y + taskHeight > 270) {
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
    doc.text('FECHA DEL INFORME', MX + CW / 2 + 6, y + 7);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.TEXT_MAIN);
    doc.text(X(datos.tecnico) || 'No especificado', MX + 6, y + 14);
    doc.text(X(datos.fecha) || 'No especificada', MX + CW / 2 + 6, y + 14);
    y += 30;

    // 3. Secciones
    for (const seccion of datos.secciones) {
      checkPageForSection(); // Separación inteligente: evita títulos solos al final
      y += 5; // Espacio extra antes de cada sección

      // Título de Sección
      doc.setDrawColor(...C.PRIMARY);
      doc.setLineWidth(1.5); // Línea más gruesa para más impacto
      doc.line(MX, y, MX + CW, y);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15); // Aumentado de 13 a 15 para más impacto
      doc.setTextColor(...C.PRIMARY);
      doc.text(X(seccion.tituloSeccion).toUpperCase(), MX, y + 10);
      y += 18; // Aumentado de 15 a 18 para más espacio después del título

      // Encabezado de tabla
      doc.setFillColor(...C.BG_LIGHT);
      doc.rect(MX, y, CW, 10, 'F'); // Aumentado de 8 a 10
      doc.setFontSize(9); // Aumentado de 8 a 9
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.TEXT_MUTED);
      doc.text('ESTADO', MX + 15, y + 6, { align: 'center' });
      doc.text('REF', MX + 35, y + 6, { align: 'center' });
      doc.text('DESCRIPCIÓN DE LA TAREA', MX + 45, y + 6);
      y += 10;

      // Puntos/Tareas
      let rowIdx = 0;
      for (const punto of seccion.puntos) {
        const descLines = doc.splitTextToSize(X(punto.descripcionManual), CW - 50);
        const noteLines = punto.notaPunto ? doc.splitTextToSize('Nota: ' + punto.notaPunto, CW - 50) : [];

        let contentH = descLines.length * 5.5 + 6; // Aumentado más espaciado
        if (punto.amperios || punto.hz || punto.bar || punto.porcentaje) contentH += 10; // Aumentado más
        if (punto.bombasQuimicas?.length) contentH += punto.bombasQuimicas.length * 7 + 6; // Aumentado más
        if (noteLines.length) contentH += noteLines.length * 5 + 4; // Aumentado más

        const rowH = Math.max(14, contentH); // Aumentado de 12 a 14 para más aire
        checkPageForTask(rowH + 10); // Aumentado espaciado entre filas

        // Zebra striping
        if (rowIdx % 2 === 0) {
          doc.setFillColor(252, 252, 252);
          doc.rect(MX, y, CW, rowH, 'F');
        }

        // Indicadores de estado (Badge más compacto)
        const badgeW = 14; // Reducido de 20 a 14
        const badgeH = 4;  // Reducido de 5 a 4
        const bx = MX + 15 - (badgeW / 2);
        const by = y + (rowH / 2) - (badgeH / 2);

        let statusLabel = 'PENDIENTE';
        let statusColor: [number, number, number] = [226, 232, 240]; // Gray tuple
        let textColor: [number, number, number] = [100, 116, 139];   // Muted tuple

        if (punto.ok) {
          statusLabel = 'OK';
          statusColor = C.SUCCESS;
          textColor = C.WHITE;
        } else if (punto.noOk) {
          statusLabel = 'NO';
          statusColor = C.DANGER;
          textColor = C.WHITE;
        }

        doc.setFillColor(...statusColor);
        doc.roundedRect(bx, by, badgeW, badgeH, 0.5, 0.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5); // Reducido de 6 a 5
        doc.setTextColor(...textColor);
        doc.text(statusLabel, bx + badgeW / 2, by + 2.8, { align: 'center' });

        // ID Manual (REF)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(...C.TEXT_MUTED);
        doc.text(X(punto.idManual), MX + 35, y + (rowH / 2) + 1, { align: 'center' });

        // Descripción
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10.5); // Aumentado de 9.5 a 10.5 para mejor legibilidad
        doc.setTextColor(...C.TEXT_MAIN);
        doc.text(descLines, MX + 45, y + 6);
        let curY = y + 6 + (descLines.length * 5.5); // Aumentado espaciado entre líneas

        // Medidas (Badges)
        const medValues: string[] = [];
        if (punto.amperios) medValues.push(`${punto.amperios}A`);
        if (punto.hz) medValues.push(`${punto.hz}Hz`);
        if (punto.bar) medValues.push(`${punto.bar}Bar`);
        if (punto.porcentaje) medValues.push(`${punto.porcentaje}%`);

        if (medValues.length > 0) {
          doc.setFillColor(...C.BG_ACCENT);
          const badgeW = doc.getTextWidth(medValues.join('  •  ')) + 8; // Aumentado padding de 6 a 8
          doc.roundedRect(MX + 45, curY, badgeW, 6, 1, 1, 'F'); // Aumentado altura de 5 a 6
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8); // Aumentado de 7.5 a 8
          doc.setTextColor(...C.PRIMARY);
          doc.text(medValues.join('  •  '), MX + 48, curY + 4);
          curY += 9; // Aumentado de 7 a 9
        }

        // Bombas Químicas
        if (punto.bombasQuimicas?.length) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8); 
          doc.setTextColor(...C.WARN);
          for (const b of punto.bombasQuimicas) {
            doc.text(`â—‹ ${b.nombre}: ${b.amperios || '0'}A / ${b.porcentaje || '0'}%`, MX + 47, curY + 3);
            curY += 6; 
          }
          curY += 2; 
        }

        // Notas
        if (noteLines.length) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8.5); 
          doc.setTextColor(100, 100, 100);
          doc.text(noteLines, MX + 45, curY + 2);
          curY += noteLines.length * 4.5 + 3; 
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
        const obsLines = doc.splitTextToSize(seccion.observaciones, CW - 12);
        const obsH = obsLines.length * 6 + 15; // Aumentado más
        checkPage(obsH + 20); // Aumentado más

        doc.setFillColor(...C.BG_LIGHT);
        doc.roundedRect(MX, y + 3, CW, obsH, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9); // Aumentado de 8 a 9
        doc.setTextColor(...C.TEXT_MUTED);
        doc.text('OBSERVACIONES DE SECCIÓN:', MX + 5, y + 9);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10); // Aumentado de 9 a 10
        doc.setTextColor(...C.TEXT_MAIN);
        doc.text(obsLines, MX + 5, y + 16);
        y += obsH + 15; // Aumentado más
      } else {
        y += 12; // Aumentado de 10 a 12
      }

        // Fotos de Sección (Diseño de 2 columnas para que sean más grandes y sin deformar)
        const fotos = seccion.fotosBase64?.filter(f => !!f) ?? [];
        if (fotos.length > 0) {
          checkPage(90); // Aumentado más
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10); // Aumentado de 9 a 10
          doc.setTextColor(...C.TEXT_MUTED);
          doc.text('REGISTRO FOTOGRÁFICO', MX, y);
          y += 8; // Aumentado más

          const cols = 2; // 2 columnas para que se vean más grandes
          const gap = 10; // Aumentado de 8 a 10
          const fW = (CW - (gap * (cols - 1))) / cols;
          const fH_max = 70; // Aumentado de 65 a 70 para fotos más grandes

          for (let i = 0; i < fotos.length; i++) {
            const col = i % cols;
            if (col === 0 && i > 0) {
              y += fH_max + gap + 10; // Aumentado más
              checkPage(fH_max + gap + 15); // Aumentado más
            }
            const fx = MX + col * (fW + gap);

            try {
              const b64 = fotos[i];
              const fmt = b64.startsWith('data:image/png') ? 'PNG' : 'JPEG';

              // Obtenemos las dimensiones reales de la imagen
              const props = doc.getImageProperties(b64);
              const imgRatio = props.width / props.height;
              const boxRatio = fW / fH_max;

              let finalW = fW;
              let finalH = fH_max;

              if (imgRatio > boxRatio) {
                // La imagen es más ancha que el hueco -> limitamos por ancho
                finalH = fW / imgRatio;
              } else {
                // La imagen es más alta que el hueco -> limitamos por alto
                finalW = fH_max * imgRatio;
              }

              // Centramos la imagen en el hueco de la columna
              const offsetX = (fW - finalW) / 2;
              const offsetY = (fH_max - finalH) / 2;

              doc.setDrawColor(...C.BORDER);
              doc.setLineWidth(0.2); // Aumentado de 0.15 a 0.2 para más definición
              // Dibujamos el recuadro de fondo (opcional, ayuda a que se vea ordenado)
              doc.roundedRect(fx, y, fW, fH_max, 3, 3, 'S'); // Aumentado radio de 2 a 3

              // Insertamos la imagen con sus proporciones reales calculadas
              doc.addImage(b64, fmt, fx + offsetX, y + offsetY, finalW, finalH, undefined, 'MEDIUM');
            } catch (e) {
              doc.setFillColor(245, 245, 245);
              doc.rect(fx, y, fW, fH_max, 'F');
            }
          }
          y += fH_max + 20; // Aumentado de 18 a 20
        }
    }

    // 4. Conclusiones Finales
    if (datos.conclusiones?.trim()) {
      const concLines = doc.splitTextToSize(datos.conclusiones, CW - 14);
      const concH = concLines.length * 6 + 22; // Aumentado más drásticamente
      checkPage(concH + 25); // Aumentado más

      doc.setFillColor(...C.PRIMARY);
      doc.roundedRect(MX, y, CW, concH, 4, 4, 'F'); // Aumentado radio de 3 a 4

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12); // Aumentado de 11 a 12
      doc.setTextColor(...C.WHITE);
      doc.text('CONCLUSIONES GENERALES', MX + 8, y + 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11); // Aumentado de 10 a 11
      doc.text(concLines, MX + 8, y + 19);
      y += concH + 20; // Aumentado más
    }

    // 5. Pie de Página (Global)
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(...C.BORDER);
      doc.setLineWidth(0.8); // Aumentado de 0.6 a 0.8 para más definición
      doc.line(MX, 285, PW - MX, 285);

      doc.setFontSize(9); // Aumentado de 8 a 9
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
      doc.circle(x + size / 2, y + size / 2, size / 2, 'F');
      doc.setTextColor(...C.WHITE);
      doc.setFontSize(4);
      doc.setFont('helvetica', 'bold');
      doc.text(label, x + size / 2, y + size / 2 + 1.2, { align: 'center' });
    } else {
      doc.setDrawColor(...C.BORDER);
      doc.setLineWidth(0.1);
      doc.circle(x + size / 2, y + size / 2, size / 2, 'S');
      doc.setTextColor(...C.BORDER);
      doc.setFontSize(4);
      doc.text(label, x + size / 2, y + size / 2 + 1.2, { align: 'center' });
    }
  }

  private async convertImageToBase64(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Usar un tamaño base decente para el logo
        const scale = 2;
        canvas.width = (img.width || 400) * scale;
        canvas.height = (img.height || 400) * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'white'; // Fondo blanco por si el SVG tiene transparencias conflictivas
          // ctx.fillRect(0, 0, canvas.width, canvas.height); // Opcional, mejor dejar transparente si el PNG lo soporta
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
