export interface DocumentDto {
    Id: number;
    NombreObra: string;
    Tecnico: string | null;
    Fecha: string | null;
    Cuatrimestre: string | null;
    Protegido: boolean;
    Conclusiones: string | null;
    UltimaModificacion: string | null;
    Datos: any;
}

export interface UpdateDocumentDto {
    Tecnico?: string | null;
    Fecha?: string | null;
    Cuatrimestre?: string | null;
    Protegido?: boolean;
    Conclusiones?: string | null;
    Datos?: any;
}
