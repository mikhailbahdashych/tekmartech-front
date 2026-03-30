import { Component, inject, input, output } from '@angular/core';
import { TkButtonComponent } from '@shared/components/tk-button/tk-button.component';
import { TkIconComponent } from '@shared/components/tk-icon/tk-icon.component';
import { RotateCcw, AlertCircle, Ban } from 'lucide-angular';
import { QueryPageStore } from '@features/queries/services/query-page.store';
import { IntegrationResponse } from '@features/integrations/models';
import { UserMessageComponent } from './user-message.component';
import { AiResponseComponent } from './ai-response.component';
import { ExecutionMessageComponent } from './execution-message.component';
import { ResultsMessageComponent } from './results-message.component';

@Component({
  selector: 'app-query-thread',
  standalone: true,
  imports: [
    TkButtonComponent,
    TkIconComponent,
    UserMessageComponent,
    AiResponseComponent,
    ExecutionMessageComponent,
    ResultsMessageComponent,
  ],
  templateUrl: './query-thread.component.html',
  styleUrl: './query-thread.component.scss',
})
export class QueryThreadComponent {
  readonly store = inject(QueryPageStore);
  readonly integrationMap = input<Map<string, IntegrationResponse>>(new Map());

  readonly approve = output();
  readonly reject = output();
  readonly exportCsv = output();
  readonly newQuery = output();

  readonly icons = { RotateCcw, AlertCircle, Ban };

  getSubmittedIntegrations(): Array<{ id: string; type: string; displayName: string }> {
    const map = this.integrationMap();
    return this.store.submittedIntegrationIds()
      .map(id => {
        const integration = map.get(id);
        return integration
          ? { id: integration.id, type: integration.type, displayName: integration.display_name }
          : null;
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);
  }
}
