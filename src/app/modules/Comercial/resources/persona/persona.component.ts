import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatRadioModule } from '@angular/material/radio';
import { MatDialogModule } from '@angular/material/dialog';
import { CiudadCombo } from 'src/app/core/interfaces/Core/CiudadCombo';
import { Persona } from 'src/app/core/models/Compras/Personas';
import { TipoDocumento } from 'src/app/core/models/Compras/TipoDocumento';
import { TipoDocumentoService } from 'src/app/core/services/Compras/tipo-documento.service';
import { CiudadesService } from 'src/app/core/services/core/ciudades.service';
import { PersonaService } from 'src/app/core/services/Compras/persona.service';
import { PersonaSearch } from 'src/app/core/interfaces/Compras/PersonaSearch';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';

// Datos "resumen" que el padre puede querer reflejar en sus propios campos denormalizados
export interface PersonaResumen {
  codigoTitular: string;
  nombreCompleto: string;
}

// Codigo de tipo de documento que identifica una persona juridica en el catalogo
// (m_tipodocumentos) - el resto de codigos (CC, CE, TI...) son persona natural.
// Es una convencion, no una columna propia: ver docs/tecnica/... analisis de
// Persona Natural/Juridica (Proveedores/Clientes).
const CODIGO_TIPODOC_JURIDICA = 'NIT';

@Component({
  selector: 'app-persona',
  imports: [MatDialogModule, modules_depencias, ReactiveFormsModule, FlexLayoutModule, FormsModule,
    MatAutocompleteModule, MatRadioModule],
  templateUrl: './persona.component.html',
  styleUrl: './persona.component.scss'
})
export class PersonaComponent implements OnInit, OnChanges {

  // El FormGroup de persona es creado y controlado por el formulario padre
  // (proveedor, cliente, empleado, etc.), este componente solo lo consume.
  @Input({ required: true }) group!: FormGroup;
  @Input() disabled = false;

  // Apagado por defecto: solo Proveedores/Clientes lo activan. Habilita el
  // boton "Buscar persona" junto a Numero, y la validacion al perder el foco
  // (¿ya existe una persona con este documento?) - Usuario/Mi Perfil siguen
  // sin este comportamiento, sin que este componente cambie para ellos.
  @Input() permitirBusquedaPersona = false;

  // Avisa al padre cuando cambian los datos que suele necesitar duplicar (ej. proveedor.codigoTitular/razonSocial)
  @Output() personaChange = new EventEmitter<PersonaResumen>();
  // El usuario hizo clic en "Buscar persona" - el padre abre el modal de seleccion.
  @Output() buscarPersona = new EventEmitter<void>();
  // Al perder el foco de "Numero" se encontro una persona ya existente con ese
  // documento (misma empresa) - el padre debe cargarla, igual que si se
  // hubiera elegido desde el modal.
  @Output() personaEncontradaPorDocumento = new EventEmitter<PersonaSearch>();

  // Valores por defecto - static porque crearFormGroup() (factory estatico,
  // usado por el padre para resetear el sub-formulario al registrar una
  // persona nueva) tiene que usar EXACTAMENTE los mismos valores que los
  // combos visuales de abajo. Antes divergian (crearFormGroup ponia
  // idTipoDoc/idCiudad en null, los combos seguian mostrando CC/Cali) - un
  // reset dejaba el formulario invalido (null, Validators.required) sin
  // ninguna señal visible, porque el combo nunca se actualizaba a partir de
  // null (su sincronizacion solo actua si encuentra una coincidencia real).
  static readonly DEFAULT_TIPO_DOC = { id: 1, codigoTipoDocumento: 'CC', nombreTipoDocumento: 'CC' };
  static readonly DEFAULT_SEXO = 'M';
  // idCiudad=1 es el id real de Cali (cod_ciudad '76001') en m_ciudades -
  // corregido 2026-08-04: antes decia idCiudad=3, que en la base real es
  // "Yumbo", no Cali (bug pre-existente, quedaba "corregido" en silencio via
  // CargaCiudades() una vez cargaba la lista real, pero solo confirmaba el id
  // equivocado, nunca lo corregia).
  static readonly DEFAULT_CIUDAD = { idCiudad: 1, codCiudad: '76001', nomCiudad: 'CALI' };

  //Tipo Documentos
  defaultTipoDoc = PersonaComponent.DEFAULT_TIPO_DOC;
  list_tipos: TipoDocumento[] = [];
  SelecTiposControl = new FormControl<TipoDocumento | null>(this.defaultTipoDoc, Validators.required);

  // Tipo de Persona (Natural/Juridica) - no es un campo propio, se infiere del
  // tipo de documento elegido (NIT = Juridica). Determina que campos aplican:
  // Juridica no tiene Sexo ni separa Nombres/Apellidos (un solo campo, "Razon
  // Social"). Ver docs/tecnica/... analisis Persona Natural/Juridica.
  get esJuridica(): boolean {
    return this.SelecTiposControl.value?.codigoTipoDocumento === CODIGO_TIPODOC_JURIDICA;
  }

  //Tipos de sexo
  defaultSexo = PersonaComponent.DEFAULT_SEXO;
  list_sexos: string[] = ['M', 'F'];
  SelecSexoControl = new FormControl<string | null>(this.defaultSexo, Validators.required);

  //Ciudades
  defaultCiudad = PersonaComponent.DEFAULT_CIUDAD;
  list_ciudades: CiudadCombo[] = [];
  SelecCiudadControl = new FormControl<CiudadCombo | null>(this.defaultCiudad, Validators.required);

  constructor(
    private tipoService: TipoDocumentoService,
    private ciudadService: CiudadesService,
    private personaService: PersonaService,
  ) { }

  // Factory reutilizable: cualquier formulario padre (proveedor/cliente/empleado) arma
  // su FormGroup de persona con esto, así el listado de campos vive en un solo lugar.
  static crearFormGroup(data?: Partial<Persona>): FormGroup {
    return new FormGroup({
      idPersona: new FormControl(data?.idPersona ?? 0),
      idTipoDoc: new FormControl(data?.idTipoDoc ?? PersonaComponent.DEFAULT_TIPO_DOC.id, Validators.required),
      codigoTitular: new FormControl(data?.codigoTitular ?? '', Validators.required),
      nombres: new FormControl(data?.nombres ?? '', Validators.required),
      apellidos: new FormControl(data?.apellidos ?? '', Validators.required),
      sexo: new FormControl(data?.sexo ?? PersonaComponent.DEFAULT_SEXO, Validators.required),
      direccion: new FormControl(data?.direccion ?? ''),
      telefono: new FormControl(data?.telefono ?? ''),
      email: new FormControl(data?.email ?? ''),
      idCiudad: new FormControl(data?.idCiudad ?? PersonaComponent.DEFAULT_CIUDAD.idCiudad, Validators.required),
      fechaMod: new FormControl(data?.fechaMod ?? null),
      nombreCompleto: new FormControl(data?.nombreCompleto ?? ''),
    });
  }

  // Convierte el valor crudo del FormGroup de persona al formato que espera el API.
  static aPayload(raw: any): any {
    return {
      ...raw,
      fechaMod: new Date().toISOString(),
    };
  }

  ngOnInit(): void {
    this.CargaTiposDocumento();
    this.CargaCiudades();

    const sexoActual = this.group.get('sexo')?.value;
    if (sexoActual) {
      this.SelecSexoControl.setValue(sexoActual, { emitEvent: false });
    }

    // Los combos "amigables" (objeto completo) sincronizan contra los campos crudos del FormGroup del padre
    this.SelecTiposControl.valueChanges.subscribe(tipo => {
      this.group.get('idTipoDoc')?.setValue(tipo?.id ?? null);
    });
    this.SelecSexoControl.valueChanges.subscribe(sexo => {
      this.group.get('sexo')?.setValue(sexo);
    });
    this.SelecCiudadControl.valueChanges.subscribe(ciudad => {
      this.group.get('idCiudad')?.setValue(ciudad?.idCiudad ?? null);
    });

    // Y en sentido contrario: si el padre carga una persona existente (ej. tras buscarla),
    // los combos deben reflejar el valor crudo que llega al FormGroup.
    this.group.get('idTipoDoc')?.valueChanges.subscribe(id => {
      const match = this.list_tipos.find(t => t.id === id);
      if (match && this.SelecTiposControl.value?.id !== id) {
        this.SelecTiposControl.setValue(match, { emitEvent: false });
      }
      // El tipo de documento es lo que determina Natural/Juridica: cualquier
      // cambio (por el usuario o por cargar un registro existente) recalcula
      // que campos aplican.
      this.aplicarConsecuenciasTipoPersona();
    });
    this.group.get('sexo')?.valueChanges.subscribe(sexo => {
      if (sexo && this.SelecSexoControl.value !== sexo) {
        this.SelecSexoControl.setValue(sexo, { emitEvent: false });
      }
    });
    this.group.get('idCiudad')?.valueChanges.subscribe(id => {
      const match = this.list_ciudades.find(c => c.idCiudad === id);
      if (match && this.SelecCiudadControl.value?.idCiudad !== id) {
        this.SelecCiudadControl.setValue(match, { emitEvent: false });
      }
    });

    // nombreCompleto se recalcula solo, y se avisa al padre por si necesita reflejarlo
    this.group.get('nombres')?.valueChanges.subscribe(() => this.actualizarResumen());
    this.group.get('apellidos')?.valueChanges.subscribe(() => this.actualizarResumen());
    this.group.get('codigoTitular')?.valueChanges.subscribe(() => this.actualizarResumen());

    this.aplicarEstadoDisabled();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['disabled'] && !changes['disabled'].firstChange) {
      this.aplicarEstadoDisabled();
    }
  }

  // El usuario eligio Natural o Juridica en el selector: busca el primer tipo
  // de documento del catalogo que corresponda (NIT para Juridica, cualquier
  // otro para Natural) y lo selecciona - el resto de ajustes (ocultar
  // Sexo/Apellidos, etc.) los dispara la suscripcion a idTipoDoc.
  elegirTipoPersona(tipo: 'natural' | 'juridica'): void {
    const candidato = this.list_tipos.find(t =>
      tipo === 'juridica' ? t.codigoTipoDocumento === CODIGO_TIPODOC_JURIDICA : t.codigoTipoDocumento !== CODIGO_TIPODOC_JURIDICA
    );
    if (candidato) {
      this.SelecTiposControl.setValue(candidato);
    }
  }

  // Ajusta los campos que solo aplican a Natural (Sexo, Apellidos) segun el
  // tipo de documento vigente. Juridica: se limpian y dejan de ser
  // obligatorios (no se muestran en la plantilla). Natural: vuelven a ser
  // obligatorios, con un valor por defecto para Sexo si quedo vacio.
  private aplicarConsecuenciasTipoPersona(): void {
    const apellidosCtrl = this.group.get('apellidos');
    const sexoCtrl = this.group.get('sexo');

    if (this.esJuridica) {
      apellidosCtrl?.clearValidators();
      apellidosCtrl?.setValue('', { emitEvent: false });
      sexoCtrl?.clearValidators();
      sexoCtrl?.setValue(null, { emitEvent: false });
      this.SelecSexoControl.setValue(null, { emitEvent: false });
    } else {
      apellidosCtrl?.setValidators(Validators.required);
      sexoCtrl?.setValidators(Validators.required);
      if (!sexoCtrl?.value) {
        sexoCtrl?.setValue(PersonaComponent.DEFAULT_SEXO, { emitEvent: false });
        this.SelecSexoControl.setValue(PersonaComponent.DEFAULT_SEXO, { emitEvent: false });
      }
    }
    apellidosCtrl?.updateValueAndValidity({ emitEvent: false });
    sexoCtrl?.updateValueAndValidity({ emitEvent: false });
    this.actualizarResumen();
  }

  private aplicarEstadoDisabled(): void {
    const controles = [this.SelecTiposControl, this.SelecSexoControl, this.SelecCiudadControl];
    if (this.disabled) {
      this.group.disable({ emitEvent: false });
      controles.forEach(c => c.disable({ emitEvent: false }));
    } else {
      this.group.enable({ emitEvent: false });
      controles.forEach(c => c.enable({ emitEvent: false }));
    }
  }

  // Nombre/Razon Social visible para el usuario ("Nombre" en Natural, "Razon
  // Social" en Juridica) - un solo campo (nombres) hace ambas veces.
  get etiquetaNombre(): string {
    return this.esJuridica ? 'Razon Social' : 'Nombre';
  }

  // Al terminar de escribir el documento (perder el foco), se valida si ya
  // existe una persona con ese documento exacto en la empresa activa -
  // decision explicita del usuario: mejor detectarlo aqui que dejar que
  // llene 5-8 campos mas para enterarse solo al guardar. Excepcion puntual al
  // criterio general de "una sola llamada de guardado" del proyecto.
  onBlurNumero(): void {
    if (!this.permitirBusquedaPersona || this.disabled) {
      return;
    }
    const valor = this.group.get('codigoTitular')?.value?.trim();
    if (!valor || valor.length < 3) {
      return;
    }
    this.personaService.PersonaSearch(valor).subscribe({
      next: (resultados) => {
        const coincidenciaExacta = resultados.find(p => p.codTit === valor);
        if (coincidenciaExacta) {
          this.personaEncontradaPorDocumento.emit(coincidenciaExacta);
        }
      },
      error: (err) => console.error('Error validando el documento', err)
    });
  }

  private actualizarResumen(): void {
    const nombres = this.group.get('nombres')?.value ?? '';
    const apellidos = this.group.get('apellidos')?.value ?? '';
    const nombreCompleto = this.esJuridica ? nombres.trim() : `${nombres} ${apellidos}`.trim();

    this.group.get('nombreCompleto')?.setValue(nombreCompleto, { emitEvent: false });

    this.personaChange.emit({
      codigoTitular: this.group.get('codigoTitular')?.value ?? '',
      nombreCompleto
    });
  }

  //Metodo para cargar lista de tipos de documento.
  CargaTiposDocumento(): void {
    this.tipoService.listSelection().subscribe({
      next: (data) => {
        this.list_tipos = data;
        const idActual = this.group.get('idTipoDoc')?.value;
        const seleccionado = this.list_tipos.find(t => t.id === idActual) ?? this.list_tipos[0];
        if (seleccionado) {
          this.SelecTiposControl.setValue(seleccionado, { emitEvent: false });
          this.group.get('idTipoDoc')?.setValue(seleccionado.id, { emitEvent: false });
        }
        // El combo recien llego: recalcula Natural/Juridica ahora que se
        // puede resolver el codigo del tipo de documento vigente.
        this.aplicarConsecuenciasTipoPersona();
      },
      error: (err) => {
        console.error('Error cargando tipos de documento', err);
      }
    });
  }

  //List Ciudades
  CargaCiudades(): void {
    this.ciudadService.listSelection().subscribe({
      next: (data) => {
        this.list_ciudades = data;
        const idActual = this.group.get('idCiudad')?.value;
        const seleccionada = this.list_ciudades.find(c => c.idCiudad === idActual) ?? this.list_ciudades[0];
        if (seleccionada) {
          this.SelecCiudadControl.setValue(seleccionada, { emitEvent: false });
          this.group.get('idCiudad')?.setValue(seleccionada.idCiudad, { emitEvent: false });
        }
      },
      error: (err) => {
        console.error('Error cargando ciudades', err);
      }
    });
  }

}
