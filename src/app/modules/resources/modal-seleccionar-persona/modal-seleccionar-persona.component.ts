import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { PersonaPaginacion } from 'src/app/core/interfaces/Compras/PersonaPaginacion';
import { PersonaService } from 'src/app/core/services/Compras/persona.service';

// Modal generico "Seleccionar persona" (Proveedores/Clientes): reemplaza al
// buscador aparte (combo-persona) para esos dos modulos - el usuario decide
// por su cuenta si va a buscar una persona ya creada, en vez de que el sistema
// se lo pregunte antes de dejarlo escribir. Sin seleccion -> se entiende que
// es una persona nueva.
@Component({
  selector: 'modal-seleccionar-persona',
  imports: [modules_depencias, MatDialogModule, ReactiveFormsModule],
  templateUrl: './modal-seleccionar-persona.component.html',
  styleUrl: './modal-seleccionar-persona.component.scss'
})
export class ModalSeleccionarPersonaComponent implements OnInit {

  lista_personas: PersonaPaginacion[] = [];
  dataSource!: MatTableDataSource<PersonaPaginacion>;
  displayedColumns: string[] = ['codTit', 'nombreCompleto', 'actions'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Buscador (filtra por documento o nombre en el backend)
  buscadorControl = new FormControl('');

  totalRegistros = 0;
  paginaActual = 0;
  pageSize = 100;
  pageSizeOptions: number[] = [25, 50, 100];

  constructor(
    private personaService: PersonaService,
    public dialogRef: MatDialogRef<ModalSeleccionarPersonaComponent>
  ) { }

  ngOnInit(): void {
    this.cargarPersonasPaginadas();

    // Espera a que el usuario deje de escribir antes de consultar el backend.
    this.buscadorControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.paginaActual = 0;
      this.cargarPersonasPaginadas();
    });
  }

  cargarPersonasPaginadas(): void {
    const texto = this.buscadorControl.value?.trim() || undefined;

    this.personaService.listPaginacion(this.paginaActual, this.pageSize, texto).subscribe(data => {
      this.lista_personas = data.content;
      this.totalRegistros = data.totalElements;
      this.dataSource = new MatTableDataSource<PersonaPaginacion>(this.lista_personas);
    });
  }

  cambiarPagina(event: PageEvent): void {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarPersonasPaginadas();
  }

  // El usuario eligio una persona: se cierra el modal devolviendola.
  seleccionar(persona: PersonaPaginacion): void {
    this.dialogRef.close(persona);
  }

  // Cierra sin elegir nada - el formulario que abrio el modal lo entiende
  // como "persona nueva".
  cerrar(): void {
    this.dialogRef.close();
  }

}
