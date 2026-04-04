import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'tk-integration-icon',
  standalone: true,
  templateUrl: './tk-integration-icon.component.html',
  styleUrl: './tk-integration-icon.component.scss',
})
export class TkIntegrationIconComponent {
  readonly type = input.required<string>();
  readonly size = input<'sm' | 'md' | 'lg' | 'xl'>('md');

  readonly px = computed(() => ({ sm: 16, md: 20, lg: 24, xl: 32 })[this.size()]);
}
