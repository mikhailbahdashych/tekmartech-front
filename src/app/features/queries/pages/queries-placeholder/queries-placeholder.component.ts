import { Component } from '@angular/core';
import { TkEmptyStateComponent } from '@shared/components/tk-empty-state/tk-empty-state.component';
import { Construction } from 'lucide-angular';

@Component({
  selector: 'app-queries-placeholder',
  standalone: true,
  imports: [TkEmptyStateComponent],
  template: `
    <div class="placeholder">
      <tk-empty-state
        [icon]="icon"
        heading="Queries"
        description="This page is coming soon. Use New Query to ask questions about your infrastructure." />
    </div>
  `,
  styles: [`
    .placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 400px;
    }
  `],
})
export class QueriesPlaceholderComponent {
  readonly icon = Construction;
}
