import { Component, computed, input } from '@angular/core';
import { NgClass } from '@angular/common';

export interface StatusConfig {
  label: string;
  colorClass: string;
  bgClass: string;
}

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [NgClass],
  template: `
    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
          [ngClass]="[config().colorClass, config().bgClass]">
      {{ config().label }}
    </span>
  `,
})
export class StatusBadgeComponent {
  readonly status = input.required<string>();
  readonly configMap = input.required<Record<string, StatusConfig>>();

  readonly config = computed<StatusConfig>(() => {
    const map = this.configMap();
    const s = this.status();
    return map[s] ?? { label: s, colorClass: 'text-slate-600', bgClass: 'bg-slate-100' };
  });
}
