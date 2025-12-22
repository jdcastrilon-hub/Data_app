import { Component } from '@angular/core';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'proveedores',
  imports: [modules_depencias, RouterModule],
  templateUrl: './proveedores.component.html',
  styleUrl: './proveedores.component.scss'
})
export class ProveedoresComponent {

}
