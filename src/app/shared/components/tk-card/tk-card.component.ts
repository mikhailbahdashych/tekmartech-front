import { Component, input } from '@angular/core';

@Component({
  selector: 'tk-card',
  standalone: true,
  templateUrl: './tk-card.component.html',
  styleUrl: './tk-card.component.scss',
})
export class TkCardComponent {
  readonly padding = input<'sm' | 'md' | 'lg'>('md');
  readonly noBorder = input(false);
}
