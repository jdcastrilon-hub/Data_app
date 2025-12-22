import { Component } from '@angular/core';
import { modules_depencias } from '../../dependencias/modules_depencias.module';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-compra-directa',
  imports: [modules_depencias, RouterModule],
  templateUrl: './compra-directa.component.html',
  styleUrl: './compra-directa.component.scss'
})
export class CompraDirectaComponent {

}
