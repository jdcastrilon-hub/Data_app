import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {

  private toggleMenuSource = new Subject<void>();

  toggleMenu$ = this.toggleMenuSource.asObservable();

  toggleMenu() {
    this.toggleMenuSource.next();
  }

}