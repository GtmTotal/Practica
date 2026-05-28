import { configCentrosService } from '../stores/config-centros.svelte';
import type { CampoMedicion } from '$lib/types/config.interface';
import type { Foto } from '$lib/types/foto.interface';

export interface CampoState {
  clave: string;
  valor: string | number | null;
  sufijo: string;
}

export interface BombaState {
  nombre: string;
  [key: string]: any;
}

export interface TareaState {
  descripcion: string;
  titulo?: string;
  rev: boolean;
  ok: boolean;
  noOk: boolean;
  notaTarea: string;
  tecnico: string;
  orden?: number;
  campos: CampoState[];
  bombasQuimicas?: BombaState[];
  grupo?: string;
  subtareas?: SubTareaState[];
  indice?: string;
  sinCheck?: boolean;
}

export interface SubTareaState {
  descripcion: string;
  ok: boolean;
  noOk: boolean;
  notaTarea: string;
  tecnico: string;
  sinCheck?: boolean;
}

export interface SeccionState {
  titulo: string;
  tipo: string;
  prefijo: string;
  tareas: TareaState[];
  observaciones: string;
}

export interface FormState {
  id: number | null;
  tipo: string;
  nombreObra: string;
  tecnico: string;
  fecha: string;
  secciones: SeccionState[];
  conclusiones: string;
  cuatrimestre: string | null;
  protegido: boolean;
  nProy?: string;
  nOrdenCuadro?: string;
  nOrdenInstalacion?: string;
}

class ServicioInicializacionFormulario {
  obraForm = $state<FormState | null>(null);
  fotosPorSeccionBase64 = $state<Foto[][]>([]);
  seccionesColapsadas = $state<boolean[]>([]);

  async inicializarFormulario(nombre: string, cuatrimestre: string | null = null): Promise<void> {
    const centroConfig = await configCentrosService.getByCentro(nombre);

    if (!centroConfig) {
      throw new Error(`El centro '${nombre}' no existe.`);
    }

    const form: FormState = {
      id: null,
      tipo: 'mantenimiento',
      nombreObra: centroConfig.nombre || nombre,
      tecnico: '',
      fecha: new Date().toISOString().split('T')[0],
      secciones: [],
      conclusiones: '',
      cuatrimestre,
      protegido: false
    };

    this.obraForm = form;
    this.fotosPorSeccionBase64 = [];
    this.seccionesColapsadas = [];

    if (centroConfig.secciones) {
      const bombas = centroConfig.bombasQuimicas || [];
      
      form.secciones = centroConfig.secciones.map((seccionTemplate: any) => {
        this.fotosPorSeccionBase64.push(seccionTemplate.fotos || []);
        this.seccionesColapsadas.push(true);
        return this.agregarSeccion(seccionTemplate, bombas);
      });
    }
  }

  setFormData(
    obraForm: FormState,
    fotosPorSeccionBase64: Foto[][],
    seccionesColapsadas: boolean[]
  ): void {
    this.obraForm = obraForm;
    this.fotosPorSeccionBase64 = fotosPorSeccionBase64;
    this.seccionesColapsadas = seccionesColapsadas;
  }

  private agregarSeccion(conf: any, bombasQuimicasGlobal: string[] = []): SeccionState {
    const tareas: TareaState[] = conf.tareas.map((tareaTemplate: any, idx: number) => {
      let tareaGroup: TareaState;
      
      if (conf.tipo === 'quimicos' && idx === 0) {
        const bombasUsar = (conf.bombasQuimicas && conf.bombasQuimicas.length)
          ? conf.bombasQuimicas
          : bombasQuimicasGlobal;
          
        const camposPorDefecto: CampoMedicion[] = [
          { clave: 'amperios', sufijo: 'A' },
          { clave: 'porcentaje', sufijo: '%' }
        ];
        
        const camposUsar = (conf.camposBombas && conf.camposBombas.length)
          ? conf.camposBombas
          : camposPorDefecto;
          
        const bombasQuimicas = bombasUsar.map((nombre: string) => {
          const grupoBomba: any = { nombre };
          camposUsar.forEach((campo: CampoMedicion) => (grupoBomba[campo.clave] = null));
          return grupoBomba;
        });
        
          tareaGroup = {
            descripcion: tareaTemplate.descripcion,
            titulo: tareaTemplate.titulo,
            rev: false, ok: false, noOk: false, notaTarea: '',
            tecnico: '',
            grupo: tareaTemplate.grupo,
            campos: (tareaTemplate.campos || []).map((c: any) => this.crearCampo(c)),
            bombasQuimicas,
            subtareas: (tareaTemplate.subtareas || []).map((st: any) => ({
              descripcion: st.descripcion,
              ok: false,
              noOk: false,
              notaTarea: '',
              tecnico: '',
              sinCheck: st.sinCheck
            })),
            indice: tareaTemplate.indice,
            sinCheck: tareaTemplate.sinCheck
          };
      } else {
        tareaGroup = {
          descripcion: tareaTemplate.descripcion,
          titulo: tareaTemplate.titulo,
          rev: false, ok: false, noOk: false, notaTarea: '',
          tecnico: '',
          grupo: tareaTemplate.grupo,
          campos: (tareaTemplate.campos || []).map((c: any) => this.crearCampo(c)),
          subtareas: (tareaTemplate.subtareas || []).map((st: any) => ({
            descripcion: st.descripcion,
            ok: false,
            noOk: false,
            notaTarea: '',
            sinCheck: st.sinCheck
          })),
          indice: tareaTemplate.indice,
          sinCheck: tareaTemplate.sinCheck
        };
      }
      return tareaGroup;
    });

    return {
      titulo: conf.titulo,
      tipo: conf.tipo,
      prefijo: conf.prefijo,
      tareas,
      observaciones: conf.observaciones || ''
    };
  }

  private crearCampo(conf: CampoMedicion): CampoState {
    return {
      clave: conf.clave,
      valor: null,
      sufijo: conf.sufijo
    };
  }
}

export const formInitService = new ServicioInicializacionFormulario();
