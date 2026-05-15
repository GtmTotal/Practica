export interface InformeGuardado {
  id?: number;
  nombreObra: string;
  tecnico?: string;
  fecha?: string;
  cuatrimestre?: string;
  protegido?: boolean;
  secciones?: any[];
  conclusiones?: string;
  ultimaModificacion?: string;
  progreso?: number;
  [key: string]: any;
}

export interface GrupoCuatrimestre {
  clave: string;
  label: string;
  informes: InformeGuardado[];
}
