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

// Colores (azules para el resto, pero cabecera ahora serÃ¡ blanco/negro)
const COLOR_VERDE   = [24, 95, 165]   as [number, number, number];   // Azul primario
const COLOR_VERDE_L = [232, 240, 250] as [number, number, number];   // Azul muy claro
const COLOR_AZUL_L  = [238, 246, 255] as [number, number, number];
const COLOR_WARN    = [255, 246, 224] as [number, number, number];
const COLOR_GRIS    = [92, 99, 96]    as [number, number, number];
const COLOR_BORDE   = [216, 219, 217] as [number, number, number];
const COLOR_TEXT    = [26, 28, 27]    as [number, number, number];
const COLOR_BLANCO  = [255, 255, 255] as [number, number, number];
const COLOR_NEGRO   = [0, 0, 0]       as [number, number, number];

@Injectable({ providedIn: 'root' })
export class ServicioReporteDocumento {
  private logoBase64: string = '';

  async generarPDF(datos: DatosPDF): Promise<void> {
    const { jsPDF } = await import('jspdf');
    if (!this.logoBase64) {
      const logoUrl = 'https://media.licdn.com/dms/image/v2/C560BAQFKEPrMIqxr6Q/company-logo_200_200/company-logo_200_200/0/1631380192679?e=2147483647&v=beta&t=Pai3UOPG2M_bOyZ2VHVEwS4Km4DGPJJFb_BJsqAatmY'
      try {
        this.logoBase64 = await this.convertImageToBase64(logoUrl);
        console.log('Logo cargado correctamente');
      } catch (err) {
        console.warn('No se pudo cargar el logo:', err);
      }
    }
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const PW = 210;
    const MX = 14;
    const CW = PW - MX * 2;
    let y = 0;

    const nuevaPagina = () => {
      doc.addPage();
      y = 14;
      this.dibujarEncabezadoMini(doc, datos, MX, PW);
      y = 24;
    };

    const checkEspacio = (necesario: number) => {
      if (y + necesario > 275) nuevaPagina();
    };

    const X = (texto: string) => texto ?? '';

    // â”€â”€ PORTADA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Fondo de cabecera: BLANCO (antes azul)
    doc.setFillColor(...COLOR_BLANCO);
    doc.rect(0, 0, PW, 55, 'F');

    if (this.logoBase64) {
      const logoWidth = 35;
      const logoHeight = 35;
      const logoX = PW - MX - logoWidth;
      const logoY = 5;
      doc.addImage(this.logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight, undefined, 'FAST');
    }

    // Texto de cabecera: NEGRO (antes blanco)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...COLOR_NEGRO);
    doc.text('INFORME DE MANTENIMIENTO', MX, 18);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'normal');
    doc.text('Servicio de Mantenimiento Preventivo', MX, 27);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(X(datos.nombreObra), MX, 37);

    y = 62;
    doc.setFillColor(...COLOR_VERDE_L);
    doc.roundedRect(MX, y, CW, 22, 3, 3, 'F');
    doc.setDrawColor(...COLOR_BORDE);
    doc.roundedRect(MX, y, CW, 22, 3, 3, 'S');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR_GRIS);
    doc.text('TÃ‰CNICO RESPONSABLE', MX + 4, y + 7);
    doc.text('FECHA', MX + CW / 2 + 4, y + 7);
    doc.setFontSize(12);
    doc.setTextColor(...COLOR_TEXT);
    doc.text(X(datos.tecnico) || 'â€”', MX + 4, y + 16);
    doc.text(X(datos.fecha) || 'â€”', MX + CW / 2 + 4, y + 16);
    y += 35;

    // â”€â”€ SECCIONES (sin cambios) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    for (const seccion of datos.secciones) {
      checkEspacio(25);

      doc.setFillColor(...COLOR_VERDE);
      doc.rect(MX, y, CW, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...COLOR_BLANCO);
      doc.text(X(seccion.tituloSeccion).toUpperCase(), MX + 3, y + 5.5);
      y += 10;

      doc.setFillColor(240, 242, 241);
      doc.rect(MX, y, CW, 6, 'F');
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLOR_GRIS);
      doc.text('REV', MX + 2, y + 4.2);
      doc.text('OK', MX + 11, y + 4.2);
      doc.text('No Ok', MX + 19, y + 4.2);
      doc.text('TAREA', MX + 32, y + 4.2);
      y += 7;

      for (const punto of seccion.puntos) {
        const descLines = doc.splitTextToSize(X(punto.descripcionManual), CW - 38);
        const noteLines = punto.notaPunto ? doc.splitTextToSize('Nota: ' + punto.notaPunto, CW - 38) : [];

        const campos: string[] = [];
        if (punto.amperios)   campos.push(`${punto.amperios} A`);
        if (punto.hz)         campos.push(`${punto.hz} HZ`);
        if (punto.bar)        campos.push(`${punto.bar} Bar`);
        if (punto.porcentaje) campos.push(`${punto.porcentaje} %`);
        const medicionStr = campos.join('  /  ');

        let contenidoH = 5;
        contenidoH += descLines.length * 4.5;
        if (medicionStr) contenidoH += 7;
        if (punto.bombasQuimicas?.length) contenidoH += punto.bombasQuimicas.length * 6 + 4;
        if (noteLines.length > 0) contenidoH += noteLines.length * 4.5 + 2;

        const filaH = Math.max(12, contenidoH + 4);
        checkEspacio(filaH + 2);

        doc.setFillColor(punto.noOk ? 255 : 255, punto.noOk ? 245 : 255, punto.noOk ? 245 : 255);
        doc.rect(MX, y, CW, filaH, 'F');
        doc.setDrawColor(...COLOR_BORDE);
        doc.line(MX, y + filaH, MX + CW, y + filaH);

        const cy = y + 4;
        this.dibujarCheck(doc, MX + 2, cy, punto.revisado, COLOR_VERDE);
        this.dibujarCheck(doc, MX + 11, cy, punto.ok, COLOR_VERDE);
        this.dibujarCheck(doc, MX + 20, cy, punto.noOk, [176, 28, 28]);

        let currentY = y + 4.5;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...COLOR_GRIS);
        doc.text(X(punto.idManual), MX + 32, currentY);

        currentY += 4;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(...COLOR_TEXT);
        doc.text(descLines, MX + 32, currentY);
        currentY += descLines.length * 4.5 + 1;

        if (medicionStr) {
          doc.setFillColor(...COLOR_AZUL_L);
          doc.roundedRect(MX + 32, currentY, CW - 35, 5, 1, 1, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(...COLOR_VERDE);
          doc.text(medicionStr, MX + 34, currentY + 3.5);
          currentY += 7;
        }

        if (punto.bombasQuimicas?.length) {
          const bH = punto.bombasQuimicas.length * 6 + 2;
          doc.setFillColor(...COLOR_WARN);
          doc.roundedRect(MX + 32, currentY, CW - 35, bH, 1, 1, 'F');
          let by = currentY + 4.5;
          for (const b of punto.bombasQuimicas) {
            const txt = `${b.nombre}: ${b.amperios || 'â€”'} A / ${b.porcentaje || 'â€”'} %`;
            doc.setFontSize(7.5);
            doc.setTextColor(154, 90, 0);
            doc.text(txt, MX + 34, by);
            by += 6;
          }
          currentY += bH + 2;
        }

        if (noteLines.length > 0) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8);
          doc.setTextColor(80, 80, 80);
          doc.text(noteLines, MX + 32, currentY + 1);
        }

        y += filaH;
      }

      if (seccion.observaciones?.trim()) {
        const obsLines = doc.splitTextToSize(seccion.observaciones, CW - 10);
        const obsH = obsLines.length * 4.5 + 10;
        checkEspacio(obsH + 5);
        doc.setFillColor(248, 249, 248);
        doc.rect(MX, y, CW, obsH, 'F');
        doc.setDrawColor(...COLOR_BORDE);
        doc.rect(MX, y, CW, obsH, 'S');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...COLOR_GRIS);
        doc.text('OBSERVACIONES:', MX + 3, y + 5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLOR_TEXT);
        doc.text(obsLines, MX + 3, y + 10);
        y += obsH + 5;
      } else {
        y += 5;
      }

      const fotos = seccion.fotosBase64?.filter(f => !!f) ?? [];
      if (fotos.length > 0) {
        checkEspacio(55);
        doc.setFillColor(240, 242, 241);
        doc.rect(MX, y, CW, 6, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...COLOR_GRIS);
        doc.text('FOTOS DE LA SECCIÃ“N', MX + 3, y + 4.2);
        y += 8;

        const fotoCols = 3;
        const fotoW = (CW - (fotoCols - 1) * 4) / fotoCols;
        const fotoH = 45;

        for (let fi = 0; fi < fotos.length; fi++) {
          const col = fi % fotoCols;
          if (col === 0 && fi > 0) {
            y += fotoH + 5;
            checkEspacio(fotoH + 5);
          }
          const posX = MX + col * (fotoW + 4);

          try {
            const base64 = fotos[fi];
            const formato = base64.startsWith('data:image/png') ? 'PNG' : 'JPEG';
            doc.setDrawColor(...COLOR_BORDE);
            doc.rect(posX, y, fotoW, fotoH, 'S');
            doc.addImage(base64, formato, posX + 1, y + 1, fotoW - 2, fotoH - 2, undefined, 'FAST');
          } catch (e) {
            console.warn('Error aÃ±adiendo foto al PDF:', e);
            doc.setFillColor(220, 220, 220);
            doc.rect(posX + 1, y + 1, fotoW - 2, fotoH - 2, 'F');
            doc.setFontSize(7);
            doc.setTextColor(150, 150, 150);
            doc.text('Sin imagen', posX + fotoW / 2, y + fotoH / 2, { align: 'center' });
          }
        }
        y += fotoH + 8;
      }
    }

    if (datos.conclusiones?.trim()) {
      const concLines = doc.splitTextToSize(datos.conclusiones, CW - 10);
      const concH = concLines.length * 4.5 + 12;
      checkEspacio(concH + 10);
      doc.setFillColor(...COLOR_VERDE_L);
      doc.roundedRect(MX, y, CW, concH, 2, 2, 'F');
      doc.setDrawColor(...COLOR_VERDE);
      doc.roundedRect(MX, y, CW, concH, 2, 2, 'S');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...COLOR_VERDE);
      doc.text('CONCLUSIONES GENERALES', MX + 4, y + 7);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...COLOR_TEXT);
      doc.text(concLines, MX + 4, y + 13);
      y += concH + 10;
    }

    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFillColor(...COLOR_VERDE);
      doc.rect(0, 289, PW, 8, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(255, 255, 255);
      doc.text(`Mantenimiento Preventivo â€” ${datos.nombreObra}`, MX, 294);
      doc.text(`PÃ¡g. ${i} / ${totalPages}`, PW - MX, 294, { align: 'right' });
    }

    const nombreFichero = `Informe_${datos.nombreObra}_${datos.fecha}.pdf`.replace(/\s+/g, '_');
    doc.save(nombreFichero);
  }

  private dibujarEncabezadoMini(doc: any, datos: DatosPDF, mx: number, pw: number): void {
    // Fondo del encabezado: BLANCO (antes azul)
    doc.setFillColor(...COLOR_BLANCO);
    doc.rect(0, 0, pw, 12, 'F');
    if (this.logoBase64) {
      const logoW = 12;
      const logoH = 12;
      doc.addImage(this.logoBase64, 'PNG', pw - mx - logoW, 2, logoW, logoH, undefined, 'FAST');
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    // Texto del encabezado: NEGRO (antes blanco)
    doc.setTextColor(...COLOR_NEGRO);
    doc.text(`INFORME â€” ${datos.nombreObra}`, mx, 8);
    doc.text(`${datos.tecnico} | ${datos.fecha}`, pw - mx - (this.logoBase64 ? 24 : 0), 8, { align: 'right' });
  }

  private dibujarCheck(doc: any, x: number, y: number, marcado: boolean, color: [number, number, number]): void {
    const S = 4;
    if (marcado) {
      doc.setFillColor(...color);
      doc.roundedRect(x, y, S, S, 0.8, 0.8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6);
      doc.text('âœ“', x + 0.8, y + 3.2);
    } else {
      doc.setDrawColor(...COLOR_BORDE);
      doc.setFillColor(248, 249, 248);
      doc.roundedRect(x, y, S, S, 0.8, 0.8, 'FD');
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

