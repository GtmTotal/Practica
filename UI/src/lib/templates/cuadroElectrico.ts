export const CUADRO_ELECTRICO_TEMPLATE = {
  secciones: [
    {
      titulo: "0. PREPARACIÓN DOCUMENTACIÓN",
      tipo: "simple",
      prefijo: 0,
      tareas: [
        { descripcion: "Crear espacio - CHAT", ok: false, noOk: false, notaTarea: '', indice: "0.0" },
        { descripcion: "Crear orden de fabricación para sinóptico", ok: false, noOk: false, notaTarea: '', indice: "0.1" },
        { descripcion: "Sinóptico", ok: false, noOk: false, notaTarea: '', indice: "0.2" },
        { descripcion: "Revisión sinóptico", ok: false, noOk: false, notaTarea: '', indice: "0.3" },
        { descripcion: "Subir sinóptico al chat", ok: false, noOk: false, notaTarea: '', indice: "0.4" },
        { descripcion: "Actualizar estado proyecto-Excel de seguimiento", ok: false, noOk: false, notaTarea: '', indice: "0.5" },
        { descripcion: "Entregar sinóptico a Pascual", ok: false, noOk: false, notaTarea: '', indice: "0.6" },
        { descripcion: "Anotar si reutilizamos materiales", ok: false, noOk: false, notaTarea: '', indice: "0.7" },
      ]
    },
    {
      titulo: "1. DOCUMENTACIÓN",
      tipo: "simple",
      prefijo: 1,
      tareas: [
        { descripcion: "Crear carpeta (Cuadro eléctrico)", ok: false, noOk: false, notaTarea: '', indice: "1.0" },
        {
          descripcion: "Esquemas (Cuadro eléctrico)",
          ok: false,
          noOk: false,
          notaTarea: '',
          indice: "1.1",
          subtareas: [
            { descripcion: "Revisión esquemas", ok: false, noOk: false, notaTarea: '' }
          ]
        },
        { descripcion: "Subir esquemas al chat", ok: false, noOk: false, notaTarea: '', indice: "1.2" },
        {
          descripcion: "Diseño cuadro",
          ok: false,
          noOk: false,
          notaTarea: '',
          indice: "1.3",
          sinCheck: true,
          subtareas: [
            { descripcion: "Configuración cuadro (Cuadro eléctrico)", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Diseño puerta (Cuadro eléctrico)", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Revisión configuración", ok: false, noOk: false, notaTarea: '' }
          ]
        },
        {
          descripcion: "Revisión de stock (PYME)",
          ok: false,
          noOk: false,
          notaTarea: '',
          indice: "1.4",
          sinCheck: true,
          subtareas: [
            { descripcion: "Comprobar stock armarios", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Comprobar stock variadores", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Comprobar stock artículos (Actualizar Stock Pyme)", ok: false, noOk: false, notaTarea: '' }
          ]
        },
        {
          descripcion: "Todo OK",
          ok: false,
          noOk: false,
          notaTarea: '',
          indice: "1.5",
          subtareas: [
            { descripcion: "Pedir soporte (Chat y Correo)", ok: false, noOk: false, notaTarea: '' }
          ]
        },
        { descripcion: "Material cuadro (Previstos + Pedido)", ok: false, noOk: false, notaTarea: '', indice: "1.6" },
        {
          descripcion: "IMPRIMIR",
          ok: false,
          noOk: false,
          notaTarea: '',
          indice: "1.7",
          sinCheck: true,
          subtareas: [
            { descripcion: "Esquemas", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Sinóptico", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Configuración cuadro", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Lista materiales cuadro", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Parte horas cuadro (poner horas)", ok: false, noOk: false, notaTarea: '' }
          ]
        },
        {
          descripcion: "Archivo etiquetas (Cuadro eléctrico)",
          ok: false,
          noOk: false,
          notaTarea: '',
          indice: "1.8",
          sinCheck: true,
          subtareas: [
            { descripcion: "Etiqueta maniobra(2,9)", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Etiqueta fuerza(3,5)", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Amarillas (15x9)", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Blancas (40x25)", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Pulsantería (26,5x17,5)", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Rombo (29x8)", ok: false, noOk: false, notaTarea: '' }
          ]
        },
        { descripcion: "Crear acceso directo (Obras en proceso)", ok: false, noOk: false, notaTarea: '', indice: "1.9" },
        { descripcion: "Poner obra en código de cuadros (Excel)", ok: false, noOk: false, notaTarea: '', indice: "1.10" }
      ]
    },
    {
      titulo: "2. PREPARACIÓN MATERIALES",
      tipo: "simple",
      prefijo: 2,
      tareas: [
        { descripcion: "Comprobar documentación", ok: false, noOk: false, notaTarea: '', indice: "2.0" },
        { descripcion: "Comprobar si lleva soporte/orejas/anclado", ok: false, noOk: false, notaTarea: '', indice: "2.1" },
        { descripcion: "Llevar puerta a corte + USB (Archivo DXF)", ok: false, noOk: false, notaTarea: '', indice: "2.2" },
        { descripcion: "Hacer caja preparación materiales", ok: false, noOk: false, notaTarea: '', indice: "2.3" },
        {
          descripcion: "Imprimir etiquetas",
          ok: false,
          noOk: false,
          notaTarea: '',
          indice: "2.4",
          sinCheck: true,
          subtareas: [
            { descripcion: "Amarillas (15x9)", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Blancas (40x25)", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Pulsantería (26,5x17,5)", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Bornas", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Rombo (29x8)", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Etiqueta maniobra(2,9)", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Etiqueta fuerza(3,5)", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Relé", ok: false, noOk: false, notaTarea: '' }
          ]
        }
      ]
    },
    {
      titulo: "3. CABLEADO CUADRO",
      tipo: "simple",
      prefijo: 3,
      tareas: [
        { descripcion: "Comprobar materiales", ok: false, noOk: false, notaTarea: '', indice: "3.0" },
        { descripcion: "Corregir a mano esquemas eléctricos", ok: false, noOk: false, notaTarea: "3.0", indice: "3.1" },
        { descripcion: "Corte máquina agua (Archivo DXF)", ok: false, noOk: false, notaTarea: '', indice: "3.2" },
        { descripcion: "Montaje canaleta + carril DIN", ok: false, noOk: false, notaTarea: '', indice: "3.3" },
        { descripcion: "Instalar componentes + pegatinas", ok: false, noOk: false, notaTarea: '', indice: "3.4" },
        { descripcion: "Cablear fuerza", ok: false, noOk: false, notaTarea: '', indice: "3.5" },
        { descripcion: "Dejar regulado los guardamotores a In", ok: false, noOk: false, notaTarea: '', indice: "3.6" },
        { descripcion: "Cablear maniobra/comunicación", ok: false, noOk: false, notaTarea: '', indice: "3.7" },
        { descripcion: "Puerta + otros elementos externos", ok: false, noOk: false, notaTarea: '', indice: "3.8" },
        { descripcion: "Realizar agujero para seccionador", ok: false, noOk: false, notaTarea: '', indice: "3.9" },
        { descripcion: "Tapa canaletas + Pega. blancas(40x25)", ok: false, noOk: false, notaTarea: '', indice: "3.10" },
        {
          descripcion: "Elementos conexionado externo",
          ok: false,
          noOk: false,
          notaTarea: '',
          indice: "3.10",
          sinCheck: true,
          subtareas: [
            { descripcion: "Barra de tierras (pletina cobre)", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Grapas apantallado", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Canal entrada cables/prensaestopa/pasamuros", ok: false, noOk: false, notaTarea: '' }
          ]
        },
        { descripcion: "Pegatinas GTM y Riesgo eléctrico", ok: false, noOk: false, notaTarea: '', indice: "3.11" },
        { descripcion: "Actualizar esquemas eléctricos (Autocad)", ok: false, noOk: false, notaTarea: '', indice: "3.12" },
        { descripcion: "Soporte/fijación cuadro", ok: false, noOk: false, notaTarea: '', indice: "3.13" },
        { descripcion: "Comprobar cuadro (sin tensión)", ok: false, noOk: false, notaTarea: '', indice: "3.14" },
        { descripcion: "Comprobar cuadro (con tensión)", ok: false, noOk: false, notaTarea: '', indice: "3.15" },
        { descripcion: "Limpieza cuadro", ok: false, noOk: false, notaTarea: '', indice: "3.16" },
        {
          descripcion: "A dejar dentro cuadro",
          ok: false,
          noOk: false,
          notaTarea: '',
          indice: "3.17",
          sinCheck: true,
          subtareas: [
            { descripcion: "Esquemas", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Manuales (variador, controlador...)", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Etiquetas rombos + bridas", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Sinóptico", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Materiales (Alarma, sensores...)", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Parte materiales obras", ok: false, noOk: false, notaTarea: '' }
          ]
        },
        { descripcion: "Rellenar orden y parte horas (PYME)", ok: false, noOk: false, notaTarea: '', indice: "3.18" },
        { descripcion: "Fotos cuadro eléctrico (Subir a su carpeta)", ok: false, noOk: false, notaTarea: '', indice: "3.19" },
        { descripcion: "Guardar fotos cuadro + documentación", ok: false, noOk: false, notaTarea: '', indice: "3.20" },
        { descripcion: "Envolver/empaquetar cuadro (poner nombre obra)", ok: false, noOk: false, notaTarea: '', indice: "3.21" },
        { descripcion: "Escanear documentos (Subir a oficina)", ok: false, noOk: false, notaTarea: '', indice: "3.22" },
        { descripcion: "Imprimir cartel de sacar albarán" , ok: false, noOk: false, notaTarea: '', indice: "3.23" }
      ]
    },
    {
      titulo: "4. COSAS A TENER EN CUENTA (EN TALLER)",
      tipo: "simple",
      prefijo: 4,
      tareas: [
        { descripcion: "Ubicación cuadro eléctrico", ok: false, noOk: false, notaTarea: '', indice: "4.0" },
        { descripcion: "Acometida eléctrica", ok: false, noOk: false, notaTarea: '', indice: "4.1" },
        { descripcion: "Cable ethernet/comunicaciones", ok: false, noOk: false, notaTarea: '', indice: "4.2" },
        { descripcion: "Tubos enterrados", ok: false, noOk: false, notaTarea: '', indice: "4.3" },
        { descripcion: "Reutilización de canalización", ok: false, noOk: false, notaTarea: '', indice: "4.4" },
        { descripcion: "Reutilización materiales", ok: false, noOk: false, notaTarea: '', indice: "4.5" }
      ]
    },
    {
      titulo: "5. PREPARACIÓN MATERIALES PARA LLEVAR A OBRA (EN TALLER)",
      tipo: "simple",
      prefijo: 5,
      tareas: [
        { descripcion: "Cuadro auxiliares/caja empalmes", ok: false, noOk: false, notaTarea: '', indice: "5.0" },
        { descripcion: "Mangueras", ok: false, noOk: false, notaTarea: '', indice: "5.1" },
        { descripcion: "Rejiband+ soportes", ok: false, noOk: false, notaTarea: '', indice: "5.2" },
        { descripcion: "Tubos+soportes", ok: false, noOk: false, notaTarea: '', indice: "5.3" },
        { descripcion: "Sensores", ok: false, noOk: false, notaTarea: '', indice: "5.4" }
      ]
    },
    {
      titulo: "6. PROCESO INSTALACIÓN (EN OBRA)",
      tipo: "simple",
      prefijo: 6,
      tareas: [
        { descripcion: "Comprobar 5.0 Preparación materiales", ok: false, noOk: false, notaTarea: '', indice: "6.0" },
        {
          descripcion: "Trabajos a realizar por cuenta cliente",
          ok: false,
          noOk: false,
          notaTarea: '',
          indice: "6.1",
          sinCheck: true,
          subtareas: [
            { descripcion: "Cable ethernet", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Acometidas", ok: false, noOk: false, notaTarea: '' }
          ]
        },
        { descripcion: "Planificación canalización", ok: false, noOk: false, notaTarea: '', indice: "6.2" },
        { descripcion: "Instalar cuadro", ok: false, noOk: false, notaTarea: '', indice: "6.3" },
        { descripcion: "Instalar canalización", ok: false, noOk: false, notaTarea: '', indice: "6.4" },
        { descripcion: "Cajas empalmes", ok: false, noOk: false, notaTarea: '', indice: "6.5" },
        { descripcion: "Tirar cables", ok: false, noOk: false, notaTarea: '', indice: "6.6" },
        {
          descripcion: "Conexión cables",
          ok: false,
          noOk: false,
          notaTarea: '',
          indice: "6.7",
          sinCheck: true,
          subtareas: [
            { descripcion: "Conexión cuadro", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Conexión equipos", ok: false, noOk: false, notaTarea: '' }
          ]
        },
        { descripcion: "Reapriete cuadro eléctrico", ok: false, noOk: false, notaTarea: '', indice: "6.8" },
        { descripcion: "Verificar tensión cuadro eléctrico", ok: false, noOk: false, notaTarea: '', indice: "6.9" },
        { descripcion: "Desbloquear bombas (Ventilador)", ok: false, noOk: false, notaTarea: '', indice: "6.10" },
        {
          descripcion: "Comprobar conexionado",
          ok: false,
          noOk: false,
          notaTarea: '',
          indice: "6.11",
          sinCheck: true,
          subtareas: [
            { descripcion: "Sensores / Entradas PLC", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Electroválvulas", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Instalar sirena", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Motores/Bombas (intensidad en vacío)", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Comprobar intensidad motores en vacio", ok: false, noOk: false, notaTarea: '' }
          ]
        },
        { descripcion: "Rellenar 'Parte materiales obra'", ok: false, noOk: false, notaTarea: '', indice: "6.12" },
        { descripcion: "Fotos cajas empalme y cuadro", ok: false, noOk: false, notaTarea: '', indice: "6.13" },
        { descripcion: "Subir a carpeta obra las fotos", ok: false, noOk: false, notaTarea: '', indice: "6.14" }
      ]
    },
    {
      titulo: "7. PARAMETRIZAR EQUIPOS (EN OBRA)",
      tipo: "simple",
      prefijo: 7,
      tareas: [
        { descripcion: "Comprobar 6 procesos de instalación", ok: false, noOk: false, notaTarea: '', indice: "7.0" },
        { descripcion: "Config. parámetros analógicos", ok: false, noOk: false, notaTarea: '', indice: "7.1" },
        { descripcion: "Config. parámetros variadores", ok: false, noOk: false, notaTarea: '', indice: "7.2" },
        { descripcion: "Config. Hora en plc y hmi", ok: false, noOk: false, notaTarea: '', indice: "7.3" },
        { descripcion: "Prueba en manual equipos (HMI)", ok: false, noOk: false, notaTarea: '', indice: "7.4" },
        { descripcion: "Prueba en auto por zonas", ok: false, noOk: false, notaTarea: '', indice: "7.5" },
        { descripcion: "Prueba AUTO 100%", ok: false, noOk: false, notaTarea: '', indice: "7.6" },
        { descripcion: "Comprobar alarmas", ok: false, noOk: false, notaTarea: '', indice: "7.7" },
        { descripcion: "Ajustar parámetros si precisa", ok: false, noOk: false, notaTarea: '', indice: "7.8" },
        {
          descripcion: "Copiar o foto de parámetros:",
          ok: false,
          noOk: false,
          notaTarea: '',
          indice: "7.9",
          sinCheck: true,
          subtareas: [
            { descripcion: "HMI/PLC", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Variadores", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Esquemas eléctricos", ok: false, noOk: false, notaTarea: '' }
          ]
        },
        { descripcion: "Explicación cliente", ok: false, noOk: false, notaTarea: '', indice: "7.10" },
        { descripcion: "Rellenar parte albarán y materiales", ok: false, noOk: false, notaTarea: '', indice: "7.11" },
        {
          descripcion: "Verificar que esté archivado:",
          ok: false,
          noOk: false,
          notaTarea: '',
          indice: "7.12",
          sinCheck: true,
          subtareas: [
            { descripcion: "Programa PLC+HMI", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Párametros variador + HMI", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Fotos caja empalmes y cuadro", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Esquemas actualizados", ok: false, noOk: false, notaTarea: '' },
            { descripcion: "Acceso directo borrado de 0000 obras", ok: false, noOk: false, notaTarea: '' }
          ]
        }
      ]
    },
    {
      titulo: "8. IMPORTANTE PUESTA EN MARCHA BOMBAS",
      tipo: "simple",
      prefijo: 8,
      tareas: [
        { descripcion: "Todas las bombas con ventilador hay que moverlas del ventilador o eje para desbloquear el cierre mecánico", ok: false, noOk: false, notaTarea: '', indice: "8.0" },
        { descripcion: "Las bombas sobre bancada antes de ponerlas en marcha hay que grabar un video donde se vea alineado el acoplamiento de los ejes", ok: false, noOk: false, notaTarea: '', indice: "8.1" }
      ]
    }
  ]
};
