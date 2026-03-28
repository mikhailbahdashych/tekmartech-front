import { Component, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

export interface TkSnackbarData {
  message: string;
  variant: 'success' | 'error' | 'info';
}

@Component({
  selector: 'tk-snackbar',
  standalone: true,
  templateUrl: './tk-snackbar.component.html',
  styleUrl: './tk-snackbar.component.scss',
})
export class TkSnackbarComponent {
  readonly data = inject<TkSnackbarData>(MAT_SNACK_BAR_DATA);
  readonly snackBarRef = inject(MatSnackBarRef);
}
