import { Component, input, output, signal } from '@angular/core';
import { TkIntegrationIconComponent } from '@shared/components/tk-integration-icon/tk-integration-icon.component';

export interface SelectableIntegration {
  id: string;
  type: string;
  displayName: string;
}

@Component({
  selector: 'tk-integration-selector',
  standalone: true,
  imports: [TkIntegrationIconComponent],
  templateUrl: './tk-integration-selector.component.html',
  styleUrl: './tk-integration-selector.component.scss',
})
export class TkIntegrationSelectorComponent {
  readonly integrations = input<SelectableIntegration[]>([]);
  readonly selectedIds = input<string[]>([]);
  readonly disabled = input(false);
  readonly selectionChange = output<string[]>();

  isSelected(id: string): boolean {
    return this.selectedIds().includes(id);
  }

  toggle(id: string): void {
    if (this.disabled()) return;
    const current = this.selectedIds();
    if (this.isSelected(id)) {
      if (current.length <= 1) return;
      this.selectionChange.emit(current.filter(i => i !== id));
    } else {
      this.selectionChange.emit([...current, id]);
    }
  }
}
