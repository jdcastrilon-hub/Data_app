import { Component } from '@angular/core';
import { modules_depencias } from '../../../dependencias/modules_depencias.module';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MotivosAjuste } from '../../../../core/models/Bodega/MotivosAjuste';
import { MotivosAjusteService } from '../../../../core/services/Bodega/motivos-ajuste.service';
import { MatRadioModule } from '@angular/material/radio';
import { AuditoriaService } from '../../../../core/services/core/auditoria.service';

@Component({
  selector: 'form-motivo',
  imports: [modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule, RouterModule, MatRadioModule],
  templateUrl: './form-motivo.component.html',
  styleUrl: './form-motivo.component.scss'
})
export class FormMotivoComponent {

  formulario!: FormGroup;

  //parametros de entrada
  objeto!: MotivosAjuste;
  isEditMode: boolean = false;

  constructor(
    private fb: FormBuilder,
    private motivoService: MotivosAjusteService,
    private logAuditoria: AuditoriaService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.objeto = new MotivosAjuste();
  }

  ngOnInit(): void {

    //Se instancias las variables para el formulario
    this.formulario = this.fb.group({
      codMotivo: [this.objeto.codMotivo, Validators.required],
      nomMotivo: [this.objeto.nomMotivo, Validators.required],
      signo: [this.objeto.signo, Validators.required],
      logs: this.fb.array([]),
      idMotivo: [this.objeto.idMotivo],
      activo: [this.objeto.activo],
      ctaInventario: [this.objeto.ctaInventario],
      fechaMod: [this.objeto.fechaMod]
    });

  }

  // Método para agregar el log al FormArray
  agregarLogAuditoria() {
    // 1. Obtienes el objeto de log ya completo y formateado del servicio
    const logData = this.logAuditoria.generarLog(!this.isEditMode ? 'Nuevo' : 'Edicion');

    // 2. Creas un nuevo FormGroup usando la data
    const auditoriaGroup = this.fb.group({
      operacion: [logData.operacion],
      usuario_mod: [logData.usuario_mod],
      fecha_mod: [logData.fecha_mod]
    });

    // 3. Lo añades al FormArray
    const logsArray = this.formulario.get('logs') as FormArray;
    logsArray.push(auditoriaGroup);
  }

  //Enviar Datos al formulario prinicipal para consumir el API
  enviarFormulario() {
    //Asignacion de campos en cabezal
    this.formulario.patchValue({
      activo: 'A',
      fechaMod: new Date().toISOString(),
      ctaInventario: '1310'
    });
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched(); // Para mostrar errores visualmente
      return; // Detiene la ejecución si el formulario no es válido
    }
    //Auditoria
    this.agregarLogAuditoria();
    console.log("OBJECTO");
    console.log(this.formulario.value);

    if (this.isEditMode) {
      //Evento Edicion
      console.log("Edit");
    } else {
      //Evento nuevo
      this.motivoService.save(this.formulario.value).subscribe({
        next: (objectoResponse) => {
          console.log(objectoResponse);
          this.router.navigate(['/motivosajuste']);
        },
        error: (err) => {
          console.error('Error al guardar:', err);
        }
      });
    }

  }

  salirSinGuardar(): void {
    console.log("salir");
    this.router.navigate(['/motivosajuste']);
  }

}
