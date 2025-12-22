import { Component, ViewChild } from '@angular/core';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Empresas } from '../../../core/models/core/Empresas';
import { Sucursal } from '../../../core/models/General/Sucursal';
import { EmpresaServiceService } from '../../../core/services/core/empresa-service.service';
import { SucursalServiceService } from '../../../core/services/General/sucursal-service.service';
import { ReporteInventarioServiceService } from '../../../core/services/Bodega/reporte-inventario-service.service';
import { EmpresaSucursalBodegas } from '../../../core/models/Bodega/EmpresaSucursalBodegas';
import { FlexLayoutModule } from '@angular/flex-layout';
import { Bodega } from '../../../core/models/Bodega/Bodega';
import { Negocio } from '../../../core/models/General/Negocio';
import { MatTableDataSource } from '@angular/material/table';
import { ReporteInventarioxBodega } from '../../../core/models/Bodega/Reportes/ReporteInventarioxBodega';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'inventario-stock',
  imports: [modules_depencias, RouterModule, FormsModule, ReactiveFormsModule, FlexLayoutModule],
  templateUrl: './inventario-stock.component.html',
  styleUrl: './inventario-stock.component.scss'
})
export class InventarioStockComponent {

  //Variables Generales
  formulario!: FormGroup;

  //

  //Empresas
  list_empresas: EmpresaSucursalBodegas[] = [];
  SelectEmpresaControl = new FormControl<EmpresaSucursalBodegas | null>(null, Validators.required);

  //Sucursal
  list_sucursal: Sucursal[] = [];
  SelectSucursalControl = new FormControl<Sucursal | 'TODOS' | null>('TODOS', Validators.required);

  //Bodegas
  list_bodegas: Bodega[] = [];
  SelectBodegasControl = new FormControl<Bodega | 'TODOS' | null>('TODOS', Validators.required);


  //Negocios
  list_negocios: Negocio[] = [];
  SelectNegociosControl = new FormControl<Negocio | 'TODOS' | null>('TODOS', Validators.required);

  //Formatos de salida para reporte.
  opcionesFormato: string[] = ['PANTALLA', 'PDF', 'EXCEL'];
  formatoSeleccionado: string = 'PANTALLA';
  SelectFormatoControl = new FormControl<string | null>(this.formatoSeleccionado, Validators.required);

  //Tabla de articulos
  lista_articulos: ReporteInventarioxBodega[] = [];
  dataSource!: MatTableDataSource<ReporteInventarioxBodega>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  //Datos generales de paginacion
  totalRegistros: number = 0;
  paginaActual: number = 0;
  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  //constructor
  constructor(private fb: FormBuilder,
    private sucursalService: SucursalServiceService,
    private reporteService: ReporteInventarioServiceService,
    private router: Router) {
  }

  ngOnInit(): void {

    this.formulario = this.fb.group({
      idEmpresa: ['', Validators.required]
    });

    this.cargarEmpresas();

    //Eventos
    //Subcribir los cambios al selecionar la empresa
    this.SelectEmpresaControl.valueChanges.subscribe(objectoEmpresa => {
      if (objectoEmpresa) {
        this.list_sucursal = objectoEmpresa.sucursales!;
        this.list_negocios = objectoEmpresa.negocios!;
      } else {
        this.list_sucursal = []; // Limpiar si no hay categoría seleccionada
        this.list_negocios = [];
      }
    });

    //Subcribir los cambios al selecionar la sucursal

    this.SelectSucursalControl.valueChanges.subscribe(bodegas => {
      //Si la seleccion de la sucursal es 'TODOS' , limpiamos el arreglo de las bodegas
      if (bodegas === 'TODOS') {
        this.list_bodegas = [];
      } else {
        if (bodegas) {
          this.list_bodegas = bodegas.list_bodegas!;
        } else {
          this.list_bodegas = [];
        }
      }
    });

    this.SelectFormatoControl.setValue(this.formatoSeleccionado);
    this.SelectFormatoControl.valueChanges.subscribe(nuevoValor => {
      if (nuevoValor) {
        this.formatoSeleccionado = nuevoValor;
        // Opcional: Para verificar que se actualiza
        console.log('Nuevo formato seleccionado:', this.formatoSeleccionado);
      }
    });

  }

  //Metodo para cargar lista de empresa.
  cargarEmpresas(): void {
    this.reporteService.list().subscribe({
      next: (data) => {

        //Cargamos lista de empresas
        this.list_empresas = data;
        console.log(data);
        const objectoInicial = this.list_empresas[0];

        // Asigna automáticamente el único objeto de empresa al FormControl
        this.SelectEmpresaControl.setValue(objectoInicial);
      },
      error: (err) => {
        console.error('Error cargando empresas', err);
      }
    });
  }

  cargarReporte() {
    // Convierte a minúsculas para coincidir con tu backend (ej. 'PDF' -> 'pdf')

    const formato = this.formatoSeleccionado;
    console.log(formato);
    if (formato.toLowerCase() === 'pdf') {
      console.log("entro a reporte PDF");
      this.reportexBodegaPDF();
    } else if (formato.toLowerCase() === 'pantalla') {
      console.log("entro a reporte Pantalla");
      this.reportexBodegaPage();
    }
  }

  //Reporte Agrupado por bodega por pantalla
  reportexBodegaPage() {
    console.log(`Cargando página: ${this.paginaActual}, tamaño: ${this.pageSize}`);

    // Llama al servicio con los parámetros actuales
    this.reporteService.generarReportexBodegaPage(this.paginaActual, this.pageSize).subscribe(data => {

      // Mapea la respuesta Page
      this.lista_articulos = data.content; //  Solo el contenido para la tabla
      this.totalRegistros = data.totalElements; //  El total de registros en el DB

      // Actualiza el dataSource con la data de la página actual
      this.dataSource = new MatTableDataSource<ReporteInventarioxBodega>(this.lista_articulos);
    });
  }

  // 2. Método para manejar el cambio de página/tamaño
  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.pageSize = event.pageSize;
    this.reportexBodegaPage(); // Llama al API con los nuevos parámetros
  } 

  //Reporte Agrupado por bodega PDF
  reportexBodegaPDF() {
    this.reporteService.generarReportexBodega().subscribe({
      next: (blobData: Blob) => {
        // 1. Crear una URL local para el Blob
        const blobUrl = window.URL.createObjectURL(blobData);

        window.open(blobUrl, '_blank');

        // Opcional: Liberar la URL del Blob después de un breve retraso
        // (Algunos navegadores lo necesitan para cargar primero)
        setTimeout(() => {
          window.URL.revokeObjectURL(blobUrl);
        }, 100);
        /*
        // 2. Determinar el nombre del archivo y tipo MIME
        const fileExtension = formato === 'pdf' ? 'pdf' : 'xlsx';
        const fileName = `Inventario_${Date.now()}.${fileExtension}`;

        // 3. Crear un elemento 'a' oculto para forzar la descarga
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName; // Nombre que tendrá el archivo

        // 4. Simular el clic y limpiar
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl); // Liberar la URL del Blob
        a.remove();

        */

        //alert('Descarga iniciada exitosamente.');
      },
      error: (error) => {
        // Manejo de errores: Si el API devuelve un 500
        console.error('Error al generar el reporte:', error);
        alert('Ocurrió un error al generar el reporte. Revisa la consola.');
      }
    });
  }

  enviarFormulario() {
  }

}
