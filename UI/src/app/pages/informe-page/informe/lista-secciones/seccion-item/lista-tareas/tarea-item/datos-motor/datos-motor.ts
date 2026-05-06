import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-datos-motor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './datos-motor.html',
  styleUrls: ['./datos-motor.css']
})
export class DatosMotorComponent {
  bombasArray = input.required<FormArray>();

  get bombasGroups(): FormGroup[] {
    return this.bombasArray().controls as FormGroup[];
  }

  getCamposBomba(bombaGroup: FormGroup): { clave: string; sufijo: string }[] {
    const claves = Object.keys(bombaGroup.controls).filter(k => k !== 'nombre');
    const sufijosMap: Record<string, string> = {
      amperios: 'A', porcentaje: '%', caudal: 'l/h', hz: 'Hz', bar: 'Bar'
    };
    return claves.map(clave => ({ clave, sufijo: sufijosMap[clave] || clave }));
  }
}
