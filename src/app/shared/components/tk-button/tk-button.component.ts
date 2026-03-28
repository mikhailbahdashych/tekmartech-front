import { Component, input } from '@angular/core';
import { TkSpinnerComponent } from '../tk-spinner/tk-spinner.component';

@Component({
  selector: 'tk-button',
  standalone: true,
  imports: [TkSpinnerComponent],
  templateUrl: './tk-button.component.html',
  styleUrl: './tk-button.component.scss',
})
export class TkButtonComponent {
  readonly variant = input<'primary' | 'secondary' | 'destructive' | 'ghost'>('primary');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly type = input<'button' | 'submit'>('button');
  readonly iconOnly = input(false);
}
