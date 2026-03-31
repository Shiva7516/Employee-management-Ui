import { Component, EventEmitter, Output } from '@angular/core';
import { MATERIAL_IMPORT } from '../material/material.imports';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [...MATERIAL_IMPORT],
  template: `
    <mat-toolbar color="primary">
      <span class="title">
        <ng-content></ng-content>
      </span>

      <span class="spacer"></span>

      <button mat-icon-button (click)="logoutClick.emit()">
        <mat-icon>logout</mat-icon>
      </button>
    </mat-toolbar>
  `,
  styles: [`
    .spacer { flex:1 }
  `]
})
export class HeaderComponent {

  @Output() logoutClick = new EventEmitter<void>();

}
