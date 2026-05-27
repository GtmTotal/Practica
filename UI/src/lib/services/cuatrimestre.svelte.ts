import { databaseService } from './database.svelte';
import { configCentrosService } from './config-centros.svelte';
import { ui } from './ui.svelte';
import type { GrupoCuatrimestre, InformeGuardado } from '$lib/types/informe.interface';
import type { ConfigSeccion, TareaConfig, CampoMedicion } from '$lib/types/config.interface';

class ServicioCuatrimestre {
  getInformesPorCuatrimestre(informesGuardados: InformeGuardado[]): GrupoCuatrimestre[] {
    const grupos = new Map<string, { clave: string; label: string; orden: number; informes: InformeGuardado[] }>();
    for (const inf of informesGuardados) {
      const clave = inf.cuatrimestre || 'sin-cuatri';
      const label = inf.cuatrimestre
        ? `Cuatrimestre ${inf.cuatrimestre.split('-C')[1]}º - ${inf.cuatrimestre.split('-')[0]}`
        : 'Sin cuatrimestre';
      const orden = inf.cuatrimestre ? parseInt(inf.cuatrimestre.replace('-C', '')) : -1;
      
      if (!grupos.has(clave)) {
        grupos.set(clave, { clave, label, orden, informes: [] });
      }
      grupos.get(clave)!.informes.push(inf);
    }
    return Array.from(grupos.values()).sort((a, b) => b.orden - a.orden);
  }

  async crearCuatrimestreConUI(informesGuardados: InformeGuardado[]): Promise<void> {
    const datos = await this.obtenerDatosCuatrimestre();
    if (!datos) return;

    const { claveCuatri } = datos;

    const existeEnBD = await databaseService.existeCuatrimestre(claveCuatri);
    const existeEnMemoria = informesGuardados.some(i => i.cuatrimestre === claveCuatri);
    
    if (existeEnBD || existeEnMemoria) {
      ui.error(`El cuatrimestre ${claveCuatri} ya existe. No se puede duplicar.`);
      return;
    }

    const configsPorCentro = await configCentrosService.getAll();
    const nombresCentros = Object.keys(configsPorCentro);
    const totalCentros = nombresCentros.length;

    if (totalCentros === 0) {
      ui.warning('No hay centros configurados para crear informes');
      return;
    }

    ui.toast(`Creando cuatrimestre con ${totalCentros} informes...`, 'info');

    let creados = 0;
    const baseTimestamp = Date.now();

    for (let i = 0; i < nombresCentros.length; i++) {
      const centro = nombresCentros[i];
      const id = baseTimestamp + i;
      const config = configsPorCentro[centro];
      if (!config) continue;

      try {
        const seccionesVacias = config.secciones.map((secTemplate: ConfigSeccion) => {
          const bombasUsar = (secTemplate.bombasQuimicas && secTemplate.bombasQuimicas.length)
            ? secTemplate.bombasQuimicas
            : (config.bombasQuimicas || []);
          const camposDefecto: CampoMedicion[] = [{ clave: 'amperios', sufijo: 'A' }, { clave: 'porcentaje', sufijo: '%' }];
          const camposUsar = (secTemplate.camposBombas && secTemplate.camposBombas.length)
            ? secTemplate.camposBombas
            : camposDefecto;

          const tareasConBombas = secTemplate.tareas.map((tareaTemplate: TareaConfig, tareaIdx: number) => {
            const baseTarea = {
              descripcion: tareaTemplate.descripcion,
              ok: false,
              noOk: false,
              notaTarea: '',
              campos: (tareaTemplate.campos || []).map((campo: CampoMedicion) => ({
                clave: campo.clave,
                valor: null,
                sufijo: campo.sufijo
              }))
            };
            if (secTemplate.tipo === 'quimicos' && tareaIdx === 0 && bombasUsar.length) {
              const bombasVacias = bombasUsar.map((nombre: string) => {
                const bomba: Record<string, string | null> = { nombre };
                camposUsar.forEach((campo: CampoMedicion) => (bomba[campo.clave] = null));
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

        const hoy = new Date().toISOString().split('T')[0];
        const informe = {
          id,
          nombreObra: centro,
          tecnico: '',
          fecha: hoy,
          cuatrimestre: claveCuatri,
          protegido: true,
          secciones: seccionesVacias,
          conclusiones: '',
          ultimaModificacion: new Date().toLocaleString()
        };
        
        await databaseService.guardar(informe);
        creados++;
        
        await new Promise(r => setTimeout(r, 50));
      } catch (error) {
        console.error(`Error creando informe para ${centro}:`, error);
        ui.error(`Error creando informe para ${centro}`);
      }
    }

    if (creados === totalCentros) {
      ui.success(`Cuatrimestre ${claveCuatri} creado con ${creados} informes`);
    } else if (creados > 0) {
      ui.warning(`Cuatrimestre creado parcialmente: ${creados} de ${totalCentros} informes`);
    } else {
      ui.error('No se pudo crear el cuatrimestre');
    }
  }

  async eliminarCuatrimestreConUI(cuatrimestre: string): Promise<boolean> {
    const esHuerfano = cuatrimestre === 'sin-cuatri';
    const mensaje = esHuerfano
      ? '¿Estás seguro de que deseas eliminar TODOS los informes sin cuatrimestre?'
      : `¿Estás seguro de que deseas eliminar TODO el cuatrimestre ${cuatrimestre}?`;

    const ok = await ui.confirm(
      esHuerfano ? 'Eliminar Informes Huérfanos' : 'Eliminar Cuatrimestre',
      mensaje,
      'Eliminar',
      'Cancelar'
    );
    if (!ok) return false;

    try {
      if (esHuerfano) {
        const huerfanos = await databaseService.obtenerSinCuatrimestre();
        for (const inf of huerfanos) {
          await databaseService.eliminar(inf.id!);
        }
      } else {
        await databaseService.eliminarCuatrimestre(cuatrimestre);
      }
      ui.success(esHuerfano ? 'Informes huérfanos eliminados' : 'Cuatrimestre eliminado');
      return true;
    } catch (error) {
      console.error(error);
      ui.error(esHuerfano ? 'No se pudieron eliminar los informes huérfanos' : 'No se pudo eliminar el cuatrimestre');
      return false;
    }
  }

  private async obtenerDatosCuatrimestre(): Promise<{ fechaBase: string; claveCuatri: string } | null> {
    const ahora = new Date();
    const yearDef = ahora.getFullYear();
    const mes = ahora.getMonth() + 1;
    const cDef = mes <= 4 ? 1 : mes <= 8 ? 2 : 3;
    
    const entrada = await ui.prompt('Nuevo Cuatrimestre', `Introduce el periodo (AÑO-C1/C2/C3).\nEjemplo: ${yearDef}-C${cDef}`, `${yearDef}-C${cDef}`);
    if (!entrada) return null;
    
    const match = entrada.trim().toUpperCase().match(/^(\d{4})-C([1-3])$/);
    if (!match) {
      await ui.alert('Formato inválido', 'Por favor usa el formato AÑO-C1, AÑO-C2 o AÑO-C3', 'warning');
      return null;
    }
    const year = match[1], cNum = match[2];
    const claveCuatri = `${year}-C${cNum}`;
    const fechaBase = cNum === '1' ? `${year}-01-15` : cNum === '2' ? `${year}-05-15` : `${year}-09-15`;
    return { fechaBase, claveCuatri };
  }
}

export const cuatrimestreService = new ServicioCuatrimestre();
