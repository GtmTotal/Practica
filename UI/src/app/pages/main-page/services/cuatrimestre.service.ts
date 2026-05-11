import { Injectable, inject } from '@angular/core';
import { ServicioBaseDeDatos } from './database.service';
import { GrupoCuatrimestre, InformeGuardado } from '../../informe.interface';
import { ServicioConfiguracionCentros } from '../../services/config-centros.service';
import { UIService } from '../../../shared/services/ui.service';

@Injectable({ providedIn: 'root' })
export class ServicioCuatrimestre {
  private dbService = inject(ServicioBaseDeDatos);
  private servicioConfiguracionCentros = inject(ServicioConfiguracionCentros);
  private ui = inject(UIService);

  // Obtiene los informes agrupados por cuatrimestre (para la vista de inicio)
  getInformesPorCuatrimestre(informesGuardados: InformeGuardado[]): GrupoCuatrimestre[] {
    const grupos = new Map<string, { clave: string; label: string; orden: number; informes: InformeGuardado[] }>();
    for (const inf of informesGuardados) {
      const clave = inf.cuatrimestre || 'sin-cuatri';
      const label = inf.cuatrimestre
        ? `Cuatrimestre ${inf.cuatrimestre.split('-C')[1]}º - ${inf.cuatrimestre.split('-')[0]}`
        : 'Sin cuatrimestre';
      const orden = inf.cuatrimestre ? parseInt(inf.cuatrimestre.replace('-C', '')) : -1;
      if (!grupos.has(clave)) grupos.set(clave, { clave, label, orden, informes: [] });
      const grupo = grupos.get(clave);
      if (grupo) grupo.informes.push(inf);
    }
    return Array.from(grupos.values()).sort((a, b) => b.orden - a.orden);
  }

  // Metodo principal para crear un cuatrimestre (con UI: prompt y confirm)
  async crearCuatrimestreConUI(informesGuardados: InformeGuardado[]): Promise<void> {
    const datos = await this.obtenerDatosCuatrimestre();
    if (!datos) return;

    const { fechaBase, claveCuatri } = datos;

    const existe = informesGuardados.some(i => i.cuatrimestre === claveCuatri);
    if (existe) {
      await this.ui.alert('Error', `El cuatrimestre ${claveCuatri} ya existe. No se puede duplicar.`, 'error');
      return;
    }

    const configsPorCentro = await this.servicioConfiguracionCentros.getAll();
    const nombresCentros = Object.keys(configsPorCentro);

    for (const centro of nombresCentros) {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      const config = configsPorCentro[centro];
      if (!config) continue;

      const seccionesVacias = config.secciones.map((secTemplate: any) => {
        const bombasUsar = (secTemplate.bombasQuimicas && secTemplate.bombasQuimicas.length)
          ? secTemplate.bombasQuimicas
          : (config.bombasQuimicas || []);
        const camposDefecto = [{ clave: 'amperios', sufijo: 'A' }, { clave: 'porcentaje', sufijo: '%' }];
        const camposUsar = (secTemplate.camposBombas && secTemplate.camposBombas.length)
          ? secTemplate.camposBombas
          : camposDefecto;

        const tareasConBombas = secTemplate.tareas.map((tareaTemplate: any, tareaIdx: number) => {
          const baseTarea = {
            descripcion: tareaTemplate.descripcion,
            rev: false,
            ok: false,
            noOk: false,
            notaTarea: '',
            campos: (tareaTemplate.campos || []).map((campo: any) => ({
              clave: campo.clave,
              valor: null,
              sufijo: campo.sufijo
            }))
          };
          if (secTemplate.tipo === 'quimicos' && tareaIdx === 0 && bombasUsar.length) {
            const bombasVacias = bombasUsar.map((nombre: string) => {
              const bomba: any = { nombre };
              camposUsar.forEach((campo: any) => (bomba[campo.clave] = null));
              return bomba;
            });
            return { ...baseTarea, bombasQuimicas: bombasVacias };
          }
          return baseTarea;
        });

        return {
          titulo: secTemplate.titulo,
          tipo: secTemplate.tipo,
          prefijo: secTemplate.prefijo,
          observaciones: '',
          fotos: [],
          tareas: tareasConBombas
        };
      });

      const informe = {
        id,
        nombreObra: centro,
        tecnico: '',
        fecha: fechaBase,
        cuatrimestre: claveCuatri,
        protegido: true,
        secciones: seccionesVacias,
        conclusiones: '',
        ultimaModificacion: new Date().toLocaleString()
      };
      await this.dbService.guardar(informe);
      await new Promise(r => setTimeout(r, 20));
    }
    this.ui.success(`Cuatrimestre ${claveCuatri} creado con todos los informes`);
  }

  // Elimina un cuatrimestre completo (con confirmacion UI)
  async eliminarCuatrimestreConUI(cuatrimestre: string): Promise<boolean> {
    const ok = await this.ui.confirm('Eliminar Cuatrimestre', `¿Estás seguro de que deseas eliminar TODO el cuatrimestre ${cuatrimestre}?`, 'Eliminar', 'Cancelar');
    if (!ok) return false;
    
    try {
      this.ui.toast('Eliminando cuatrimestre...', 'warning');
      await this.dbService.eliminarCuatrimestre(cuatrimestre);
      this.ui.success('Cuatrimestre eliminado');
      return true;
    } catch (error) {
      console.error(error);
      this.ui.error('No se pudo eliminar el cuatrimestre');
      return false;
    }
  }

  // Auxiliar privado: pide los datos al usuario
  private async obtenerDatosCuatrimestre(): Promise<{ fechaBase: string; claveCuatri: string } | null> {
    const ahora = new Date();
    const yearDef = ahora.getFullYear();
    const mes = ahora.getMonth() + 1;
    const cDef = mes <= 4 ? 1 : mes <= 8 ? 2 : 3;
    
    const entrada = await this.ui.prompt('Nuevo Cuatrimestre', `Introduce el periodo (AÑO-C1/C2/C3).\nEjemplo: ${yearDef}-C${cDef}`, `${yearDef}-C${cDef}`);
    if (!entrada) return null;
    
    const match = entrada.trim().toUpperCase().match(/^(\d{4})-C([1-3])$/);
    if (!match) {
      await this.ui.alert('Formato inválido', 'Por favor usa el formato AÑO-C1, AÑO-C2 o AÑO-C3', 'warning');
      return null;
    }
    const year = match[1], cNum = match[2];
    const claveCuatri = `${year}-C${cNum}`;
    const fechaBase = cNum === '1' ? `${year}-01-15` : cNum === '2' ? `${year}-05-15` : `${year}-09-15`;
    return { fechaBase, claveCuatri };
  }
}
