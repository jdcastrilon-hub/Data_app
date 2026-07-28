import { Component } from '@angular/core';
import { modules_depencias } from 'src/app/modules/dependencias/modules_depencias.module';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-no-autorizado',
  imports: [modules_depencias, RouterModule],
  templateUrl: './no-autorizado.component.html',
  styleUrl: './no-autorizado.component.scss'
})
export class NoAutorizadoComponent {
}
