import { FormArray, FormGroup } from '@angular/forms';

export function calcularProgresoFormulario(obraForm: FormGroup | null | undefined): number {
  if (!obraForm) return 0;
  const secciones = obraForm.get('secciones') as FormArray | null;
  if (!secciones) return 0;

  let total = 0;
  let completadas = 0;

  secciones.controls.forEach((sec: any) => {
    const tareas = sec.get('tareas') as FormArray | null;
    tareas?.controls.forEach((tarea: any) => {
      total++;
      const valor = tarea.value;
      if (valor.ok || valor.noOk) completadas++;
    });
  });

  return total ? Math.round((completadas / total) * 100) : 0;
}
