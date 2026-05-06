export type TipoSeccion =
  | 'simple'
  | 'bombeo'
  | 'soplantes'
  | 'quimicos'
  | 'homogeneizador'
  | 'neutralizador';

export interface CampoMedicion {
  clave: string;
  sufijo: string;
}

export interface TareaConfig {
  descripcion: string;
  campos?: CampoMedicion[];
}

export interface ConfigSeccion {
  titulo: string;
  tipo: TipoSeccion;
  prefijo: number;
  tareas: TareaConfig[];
  camposBombas?: CampoMedicion[];
  bombasQuimicas?: string[];
}

export interface ConfigCentro {
  nombre: string;
  secciones: ConfigSeccion[];
  bombasQuimicas?: string[];
}
