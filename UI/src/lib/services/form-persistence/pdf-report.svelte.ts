declare const pdfMake: any;

export interface DatosPDF {
  nombreObra: string;
  tecnico: string;
  fecha: string;
  conclusiones: string;
  secciones: SeccionPDF[];
}

export interface FotoPDF {
  base64: string;
  descripcion?: string;
}

export interface SeccionPDF {
  tituloSeccion: string;
  tipoSeccion: string;
  observaciones: string;
  puntos: PuntoPDF[];
  fotos?: FotoPDF[];
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

// --- ESTILOS GLOBALES ---
const estilos = {
  header: {
    fontSize: 22,
    bold: true,
    color: '#1e40af',
    margin: [0, 0, 0, 10]
  },
  subheader: {
    fontSize: 14,
    bold: true,
    color: '#475569',
    margin: [0, 10, 0, 5]
  },
  sectionTitle: {
    fontSize: 14,
    bold: true,
    color: '#1e3a5f',
    margin: [0, 22, 0, 14]
  },
  tableHeader: {
    bold: true,
    fontSize: 8,
    color: 'white',
    fillColor: '#334155',
    margin: [0, 6, 0, 6]
  },
  textoTarea: {
    fontSize: 10,
    margin: [0, 3, 0, 3]
  },
  textoNota: {
    fontSize: 8,
    italics: true,
    color: '#64748b',
    margin: [0, 2, 0, 2]
  },
  observaciones: {
    fontSize: 9,
    color: '#475569',
    margin: [0, 5, 0, 5]
  },
  conclusiones: {
    fontSize: 11,
    color: '#1e293b',
    margin: [0, 10, 0, 10]
  },
  footer: {
    fontSize: 8,
    color: '#64748b',
    margin: [0, 5, 0, 0]
  }
};

class ServicioReporteDocumento {
  private logoCompletoBase64: string = '';
  private logoMedBase64: string = '';

  async generarPDF(datos: DatosPDF): Promise<void> {
    if (!this.logoCompletoBase64) {
      try {
        this.logoCompletoBase64 = await this.convertImageToBase64('/gtmCompleto.png');
      } catch {
        this.logoCompletoBase64 = '';
      }
    }
    if (!this.logoMedBase64) {
      try {
        this.logoMedBase64 = await this.convertImageToBase64('/gtmMed.png');
      } catch {
        this.logoMedBase64 = '';
      }
    }

    const content: any[] = [];
    content.push(this.buildPortada(datos));
    content.push(this.buildMetadata(datos));
    content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: '#1e40af' }], margin: [0, 5, 0, 15] });

    for (let i = 0; i < datos.secciones.length; i++) {
      content.push(this.buildSeccion(datos.secciones[i]));
    }

    if (datos.conclusiones?.trim()) {
      content.push(this.buildConclusiones(datos.conclusiones));
    }

    const docDefinition = {
      content: content,
      styles: estilos,
      defaultStyle: { font: 'Roboto' },
      pageMargins: [40, 100, 40, 30],
      header: (currentPage: number) => {
        if (currentPage === 1) return {};
        return {
          columns: [
            { text: '', width: '*' },
            this.logoMedBase64 ? { image: this.logoMedBase64, width: 60, margin: [0, 5, 0, 0], alignment: 'right' } : {}
          ],
          margin: [40, 10, 40, 0]
        };
      },
      footer: (currentPage: number, pageCount: number) => {
        return {
          columns: [
            { text: `GTM Mantenimiento · ${datos.nombreObra}`, style: 'footer', width: '*' },
            { text: `Página ${currentPage} de ${pageCount}`, style: 'footer', alignment: 'right' }
          ],
          margin: [40, 5, 40, 0]
        };
      }
    };

    pdfMake.createPdf(docDefinition as any).download(`Informe_${datos.nombreObra}_${datos.fecha}.pdf`);
  }

  private buildPortada(datos: DatosPDF): any {
    const leftCol = {
      stack: [
        { text: 'INFORME TÉCNICO', style: 'header' },
        { text: 'Mantenimiento Preventivo de Instalaciones', fontSize: 10, color: '#64748b', margin: [0, 0, 0, 20] },
        { text: datos.nombreObra.toUpperCase(), fontSize: 18, bold: true, color: '#0f172a', margin: [0, 0, 0, 10] }
      ]
    };
    const rightCol = this.logoCompletoBase64
      ? { image: this.logoCompletoBase64, width: 180, alignment: 'right', margin: [0, -80, 0, 0] }
      : {};
    return { columns: [leftCol, rightCol], columnGap: 20, margin: [0, 0, 0, 30] };
  }
  
  private buildMetadata(datos: DatosPDF): any {
    return {
      table: {
        body: [
          [
            { text: 'TÉCNICO RESPONSABLE', bold: true, fontSize: 8, color: '#1e40af' },
            { text: 'FECHA DEL INFORME', bold: true, fontSize: 8, color: '#1e40af' }
          ],
          [
            { text: datos.tecnico || 'No especificado', fontSize: 10 },
            { text: datos.fecha || 'No especificada', fontSize: 10 }
          ]
        ],
        widths: ['*', '*']
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 20]
    };
  }

  private buildSeccion(seccion: SeccionPDF): any {
    const content: any[] = [{ text: seccion.tituloSeccion.toUpperCase(), style: 'sectionTitle' }];

    if (seccion.puntos.length > 0) {
      const tableBody = [
        [
          { text: 'ESTADO', style: 'tableHeader', alignment: 'center' },
          { text: 'DESCRIPCIÓN DE LA TAREA', style: 'tableHeader' }
        ]
      ];

      for (const punto of seccion.puntos) {
        tableBody.push([
          {
            margin: [0, 3, 0, 0],
            stack: [{
              text: punto.ok ? 'OK' : punto.noOk ? 'NO OK' : 'PENDIENTE',
              color: punto.ok ? '#059669' : punto.noOk ? '#dc2626' : '#94a3b8',
              bold: true,
              fontSize: 9,
              alignment: 'center'
            }]
          },
          this.buildPuntoContent(punto)
        ]);
      }

      content.push({
        table: { headerRows: 1, widths: [48, '*'], body: tableBody },
        layout: {
          hLineWidth: (i: number) => i === 0 ? 0 : 0.5,
          vLineWidth: () => 0,
          hLineColor: () => '#e2e8f0',
          paddingLeft: () => 8, paddingRight: () => 8, paddingTop: () => 6, paddingBottom: () => 6
        }
      });
    }

    if (seccion.observaciones?.trim()) {
      content.push({
        stack: [
          { text: 'OBSERVACIONES DE SECCIÓN', bold: true, fontSize: 8, color: '#64748b', margin: [0, 0, 0, 4] },
          { text: seccion.observaciones, fontSize: 9, color: '#475569' }
        ],
        margin: [0, 22, 0, 15]
      });
    }

    if (seccion.fotos && seccion.fotos.length > 0) {
      content.push({
        stack: [
          { text: 'REGISTRO FOTOGRÁFICO', style: 'subheader', margin: [0, 20, 0, 10] },
          this.buildFotosGrid(seccion.fotos)
        ]
      });
    }

    content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#e2e8f0' }], margin: [0, 25, 0, 5] });

    return { stack: content, margin: [0, 0, 0, 15] };
  }

  private buildPuntoContent(punto: PuntoPDF): any {
    const content: any[] = [{ text: punto.descripcionManual, style: 'textoTarea' }];
    const medidas: string[] = [];
    if (punto.amperios) medidas.push(`${punto.amperios} A`);
    if (punto.hz) medidas.push(`${punto.hz} Hz`);
    if (punto.bar) medidas.push(`${punto.bar} Bar`);
    if (punto.porcentaje) medidas.push(`${punto.porcentaje}%`);

    if (medidas.length > 0) {
      content.push({ text: medidas.join(' · '), fontSize: 8, color: '#1e40af', margin: [0, 1, 0, 1] });
    }

    if (punto.bombasQuimicas?.length > 0) {
      for (const bomba of punto.bombasQuimicas) {
        content.push({ text: `• ${bomba.nombre}: ${bomba.amperios || '0'} A / ${bomba.porcentaje || '0'}%`, fontSize: 8, color: '#f59e0b', margin: [0, 1, 0, 1] });
      }
    }

    if (punto.notaPunto?.trim()) {
      content.push({ text: `Nota: ${punto.notaPunto}`, style: 'textoNota' });
    }

    return { stack: content };
  }

  private buildFotosGrid(fotos: FotoPDF[]): any {
    const rows: any[] = [];
    for (let i = 0; i < fotos.length; i += 2) {
      const cols: any[] = [];
      const desc1 = fotos[i].descripcion?.trim();
      cols.push({
        stack: [
          { image: fotos[i].base64, width: 240, alignment: 'left', margin: [0, 0, 0, 4] },
          { text: desc1 || '', fontSize: 9, color: '#1e40af', bold: true, margin: [0, 0, 0, 12] }
        ]
      });

      if (i + 1 < fotos.length) {
        const desc2 = fotos[i + 1].descripcion?.trim();
        cols.push({
          stack: [
            { image: fotos[i + 1].base64, width: 240, alignment: 'left', margin: [0, 0, 0, 4] },
            { text: desc2 || '', fontSize: 9, color: '#1e40af', bold: true, margin: [0, 0, 0, 12] }
          ]
        });
      }
      rows.push({ columns: cols, columnGap: 10, margin: [0, 0, 0, 6] });
    }
    return { stack: rows };
  }

  private buildConclusiones(conclusiones: string): any {
    return {
      stack: [
        { text: 'CONCLUSIONES GENERALES', bold: true, fontSize: 12, color: '#1e40af', margin: [0, 0, 0, 8] },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#e2e8f0' }], margin: [0, 0, 0, 10] },
        { text: conclusiones, fontSize: 10, color: '#334155', margin: [0, 0, 0, 10] }
      ],
      margin: [0, 25, 0, 20]
    };
  }

  private async convertImageToBase64(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = 2;
        canvas.width = (img.width || 400) * scale;
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

export const pdfReportService = new ServicioReporteDocumento();
