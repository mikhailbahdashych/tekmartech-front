import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'tk-spinner',
  standalone: true,
  templateUrl: './tk-spinner.component.html',
  styleUrl: './tk-spinner.component.scss',
})
export class TkSpinnerComponent {
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly px = computed(() => ({ sm: 16, md: 24, lg: 40 })[this.size()]);
}
