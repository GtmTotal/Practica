import { Injectable, signal, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Foto } from '../foto.interface';
import { ServicioConfiguracionCentros } from '../../services/config-centros.service';
import { CampoMedicion } from '../../config.interface';

@Injectable({ providedIn: 'root' })
export class ServicioInicializacionFormulario {
  obraForm = signal<FormGroup | null>(null);
  fotosPorSeccionBase64: WritableSignal<Foto[]>[] = [];
  seccionesColapsadas: boolean[] = [];

  constructor(
    private fb: FormBuilder,
    private servicioConfiguracionCentros: ServicioConfiguracionCentros,
  ) { }

  async inicializarFormulario(nombre: string, cuatrimestre: string | null = null): Promise<void> {
    const centroConfig = await this.servicioConfiguracionCentros.getByCentro(nombre);
    
    if (!centroConfig) {
      throw new Error(`El centro '${nombre}' no existe.`);
    }

    const form = this.fb.group({
      id: [null],
      nombreObra: [centroConfig.nombre || nombre, Validators.required],
      tecnico: ['', Validators.required],
      fecha: [new Date().toISOString().split('T')[0], Validators.required],
      secciones: this.fb.array([]),
      conclusiones: [''],
      cuatrimestre: [cuatrimestre],
      protegido: [false]
    });

    this.obraForm.set(form);

    this.fotosPorSeccionBase64 = [];
    this.seccionesColapsadas = [];

    if (centroConfig.secciones) {
      const bombas = centroConfig.bombasQuimicas || [];
      centroConfig.secciones.forEach((seccionTemplate: any) => {
        const seccionGroup = this.agregarSeccion(seccionTemplate, bombas);
        const form = this.obraForm();
        if (form) {
          (form.get('secciones') as FormArray).push(seccionGroup);
        }
        this.fotosPorSeccionBase64.push(signal(seccionTemplate.fotos || []));
        this.seccionesColapsadas.push(false);
      });
    }
  }

  setFormData(
    obraForm: FormGroup,
    fotosPorSeccionBase64: WritableSignal<Foto[]>[],
    seccionesColapsadas: boolean[]
  ): void {
    this.obraForm.set(obraForm);
    this.fotosPorSeccionBase64 = fotosPorSeccionBase64;
    this.seccionesColapsadas = seccionesColapsadas;
  }

  private agregarSeccion(conf: any, bombasQuimicasGlobal: string[] = []): FormGroup {
    const seccionGroup = this.fb.group({
      titulo: [conf.titulo],
      tipo: [conf.tipo],
      prefijo: [conf.prefijo],
      tareas: this.fb.array([]),
      observaciones: [conf.observaciones || '']
    });
    const tareasArray = seccionGroup.get('tareas') as FormArray;

    conf.tareas.forEach((tareaTemplate: any, idx: number) => {
      let tareaGroup: FormGroup;
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
        const bombasFormArray = this.fb.array(
          bombasUsar.map((nombre: string) => {
            const grupoBomba: any = { nombre: [nombre] };
            camposUsar.forEach((campo: CampoMedicion) => (grupoBomba[campo.clave] = [null]));
            return this.fb.group(grupoBomba);
          })
        );
        tareaGroup = this.fb.group({
          descripcion: [tareaTemplate.descripcion],
          rev: [false], ok: [false], noOk: [false], notaTarea: [''],
          campos: this.fb.array((tareaTemplate.campos || []).map((c: any) => this.crearCampo(c))),
          bombasQuimicas: bombasFormArray
        });
      } else {
        tareaGroup = this.fb.group({
          descripcion: [tareaTemplate.descripcion],
          rev: [false], ok: [false], noOk: [false], notaTarea: [''],
          campos: this.fb.array((tareaTemplate.campos || []).map((c: any) => this.crearCampo(c)))
        });
      }

      tareasArray.push(tareaGroup);
    });
    return seccionGroup;
  }

  private crearCampo(conf: CampoMedicion): FormGroup {
    return this.fb.group({
      clave: [conf.clave],
      valor: [null],
      sufijo: [conf.sufijo]
    });
  }
}