import { Injectable } from '@angular/core';

// pdfMake cargado via CDN en index.html
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
    fontSize: 13,
    bold: true,
    color: '#1e40af',
    margin: [0, 15, 0, 8],
    background: '#f1f5f9'
  },
  tableHeader: {
    bold: true,
    fontSize: 9,
    color: 'white',
    fillColor: '#475569',
    margin: [0, 5, 0, 5]
  },
  textoTarea: {
    fontSize: 10,
    margin: [0, 5, 0, 5]
  },
  textoNota: {
    fontSize: 8,
    italics: true,
    color: '#64748b',
    margin: [0, 3, 0, 3]
  },
  observaciones: {
    fontSize: 9,
    color: '#475569',
    margin: [0, 5, 0, 5],
    background: '#f8fafc'
  },
  conclusiones: {
    fontSize: 11,
    color: 'white',
    margin: [0, 10, 0, 10]
  },
  footer: {
    fontSize: 8,
    color: '#64748b',
    margin: [0, 5, 0, 0]
  }
};

@Injectable({ providedIn: 'root' })
export class ServicioReporteDocumento {
  private logoBase64: string = '';

  async generarPDF(datos: DatosPDF): Promise<void> {
    // Cargar logo si no está cargado
    if (!this.logoBase64) {
      try {
        this.logoBase64 = await this.convertImageToBase64('/logoNoOficial.svg');
      } catch {
        this.logoBase64 = '';
      }
    }

    // Construir contenido del documento
    const content: any[] = [];

    // 1. Portada
    content.push(this.buildPortada(datos));

    // 2. Metadata
    content.push(this.buildMetadata(datos));
    content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: '#1e40af' }], margin: [0, 5, 0, 15] });

    // 3. Secciones
    for (let i = 0; i < datos.secciones.length; i++) {
      content.push(this.buildSeccion(datos.secciones[i], i > 0));
    }

    // 4. Conclusiones
    if (datos.conclusiones?.trim()) {
      content.push(this.buildConclusiones(datos.conclusiones));
    }

    // Definición del documento
    const docDefinition = {
      content: content,
      styles: estilos,
      defaultStyle: {
        font: 'Roboto'
      },
      pageMargins: [40, 30, 40, 30],
      footer: (currentPage: number, pageCount: number) => {
        return {
          columns: [
            this.logoBase64 ? { image: this.logoBase64, width: 30, margin: [0, 5, 5, 0] } : {},
            {
              text: `GTM Mantenimiento · ${datos.nombreObra}`,
              style: 'footer',
              width: '*'
            },
            {
              text: `Página ${currentPage} de ${pageCount}`,
              style: 'footer',
              alignment: 'right'
            }
          ],
          margin: [20, 10, 20, 0]
        };
      }
    };

    // Generar y descargar
    pdfMake.createPdf(docDefinition as any).download(`Informe_${datos.nombreObra}_${datos.fecha}.pdf`);
  }

  private buildPortada(datos: DatosPDF): any {
    return {
      stack: [
        { text: 'INFORME TÉCNICO', style: 'header' },
        { text: 'Mantenimiento Preventivo de Instalaciones', fontSize: 10, color: '#64748b', margin: [0, 0, 0, 20] },
        { text: datos.nombreObra.toUpperCase(), fontSize: 18, bold: true, color: '#0f172a', margin: [0, 0, 0, 10] },
        { text: `${datos.fecha} · ${datos.tecnico}`, fontSize: 9, color: '#475569' }
      ],
      margin: [0, 0, 0, 30]
    };
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

  private buildSeccion(seccion: SeccionPDF, conSalto: boolean = false): any {
    const content: any[] = [
      { text: seccion.tituloSeccion.toUpperCase(), style: 'sectionTitle' }
    ];

    // Tabla de tareas
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
            text: punto.ok ? 'OK' : punto.noOk ? 'NO OK' : 'PENDIENTE',
            color: punto.ok ? '#10b981' : punto.noOk ? '#ef4444' : '#94a3b8',
            bold: true,
            fontSize: 8,
            alignment: 'center',
            valign: 'middle'
          },
          this.buildPuntoContent(punto)
        ]);
      }

      content.push({
        table: {
          headerRows: 1,
          widths: [40, '*'],
          body: tableBody
        },
        layout: 'lightHorizontalLines'
      });
    }

    // Observaciones
    if (seccion.observaciones?.trim()) {
      content.push({
        text: [
          { text: 'OBSERVACIONES DE SECCIÓN:', bold: true, fontSize: 8 },
          { text: seccion.observaciones, fontSize: 9, margin: [0, 5, 0, 0] }
        ],
        style: 'observaciones',
        margin: [0, 15, 0, 15]
      });
    }

    // Fotos
    if (seccion.fotos && seccion.fotos.length > 0) {
      content.push({
        text: 'REGISTRO FOTOGRÁFICO',
        style: 'subheader',
        margin: [0, 20, 0, 10]
      });
      content.push(this.buildFotosGrid(seccion.fotos));
    }

    return {
      stack: content,
      pageBreak: conSalto ? 'before' : undefined,
      margin: [0, 0, 0, 20]
    };
  }

  private buildPuntoContent(punto: PuntoPDF): any {
    const content: any[] = [
      { text: punto.descripcionManual, style: 'textoTarea' }
    ];

    // Medidas
    const medidas: string[] = [];
    if (punto.amperios) medidas.push(`${punto.amperios} A`);
    if (punto.hz) medidas.push(`${punto.hz} Hz`);
    if (punto.bar) medidas.push(`${punto.bar} Bar`);
    if (punto.porcentaje) medidas.push(`${punto.porcentaje}%`);

    if (medidas.length > 0) {
      content.push({
        text: medidas.join(' · '),
        fontSize: 8,
        color: '#1e40af',
        margin: [0, 3, 0, 3]
      });
    }

    // Bombas químicas
    if (punto.bombasQuimicas?.length > 0) {
      for (const bomba of punto.bombasQuimicas) {
        content.push({
          text: `• ${bomba.nombre}: ${bomba.amperios || '0'} A / ${bomba.porcentaje || '0'}%`,
          fontSize: 8,
          color: '#f59e0b',
          margin: [0, 2, 0, 2]
        });
      }
    }

    // Notas
    if (punto.notaPunto?.trim()) {
      content.push({
        text: `Nota: ${punto.notaPunto}`,
        style: 'textoNota'
      });
    }

    return { stack: content };
  }

  private buildFotosGrid(fotos: FotoPDF[]): any {
    const items: any[] = [];

    for (let i = 0; i < fotos.length; i++) {
      const desc = fotos[i].descripcion?.trim();
      items.push({
        image: fotos[i].base64,
        width: 260,
        alignment: 'left',
        margin: [0, 0, 0, 4]
      });
      items.push({
        text: desc || `Foto ${i + 1} / ${fotos.length}`,
        fontSize: 9,
        color: desc ? '#1e40af' : '#64748b',
        bold: !!desc,
        italics: !desc,
        margin: [0, 0, 0, 18]
      });
    }

    return { stack: items };
  }

  private buildConclusiones(conclusiones: string): any {
    return {
      stack: [
        {
          text: 'CONCLUSIONES GENERALES',
          bold: true,
          fontSize: 11,
          color: 'white',
          background: '#1e40af',
          margin: [0, 0, 0, 10]
        },
        {
          text: conclusiones,
          fontSize: 10,
          color: 'white',
          margin: [0, 0, 0, 10]
        }
      ],
      background: '#1e40af',
      margin: [0, 20, 0, 20],
      borderRadius: 5
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
