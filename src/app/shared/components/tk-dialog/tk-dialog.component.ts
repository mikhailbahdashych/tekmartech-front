import { Component, input } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'tk-dialog',
  standalone: true,
  imports: [MatDialogModule],
  templateUrl: './tk-dialog.component.html',
  styleUrl: './tk-dialog.component.scss',
})
export class TkDialogComponent {
  readonly title = input('');
}
