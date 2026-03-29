import { Component, input } from '@angular/core';

export type TkBadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'accent';

@Component({
  selector: 'tk-badge',
  standalone: true,
  templateUrl: './tk-badge.component.html',
  styleUrl: './tk-badge.component.scss',
})
export class TkBadgeComponent {
  readonly variant = input<TkBadgeVariant>('neutral');
  readonly label = input('');
  readonly size = input<'sm' | 'md'>('sm');
  readonly dot = input(false);
}
