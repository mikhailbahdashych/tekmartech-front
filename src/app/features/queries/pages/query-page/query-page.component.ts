import { Component, OnInit, ViewChild, ElementRef, computed, effect, inject, signal } from '@angular/core';
import { TkIntegrationSelectorComponent, SelectableIntegration } from '@shared/components/tk-integration-selector/tk-integration-selector.component';
import { QueryPageStore } from '@features/queries/services/query-page.store';
import { ChatInputComponent } from '@features/queries/components/chat-input/chat-input.component';
import { QueryThreadComponent } from '@features/queries/components/query-thread/query-thread.component';
import { IntegrationService } from '@features/integrations/services/integration.service';
import { IntegrationResponse } from '@features/integrations/models';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-query-page',
  standalone: true,
  imports: [
    TkIntegrationSelectorComponent,
    ChatInputComponent,
    QueryThreadComponent,
  ],
  providers: [QueryPageStore],
  templateUrl: './query-page.component.html',
  styleUrl: './query-page.component.scss',
})
export class QueryPageComponent implements OnInit {
  readonly store = inject(QueryPageStore);
  private integrationService = inject(IntegrationService);
  private authService = inject(AuthService);

  readonly firstName = computed(() => {
    const name = this.authService.currentUser()?.display_name ?? '';
    return name.split(' ')[0] || 'there';
  });
  readonly integrations = signal<IntegrationResponse[]>([]);
  readonly selectedIntegrationIds = signal<string[]>([]);

  readonly integrationMap = computed(() => {
    const map = new Map<string, IntegrationResponse>();
    for (const i of this.integrations()) {
      map.set(i.id, i);
    }
    return map;
  });

  readonly selectableIntegrations = computed<SelectableIntegration[]>(() =>
    this.integrations().map(i => ({ id: i.id, type: i.type, displayName: i.display_name }))
  );

  @ViewChild('threadArea') private threadArea?: ElementRef<HTMLDivElement>;

  constructor() {
    effect(() => {
      this.store.phase();
      this.store.interpretationText();
      this.store.executionSteps();

      if (this.threadArea) {
        setTimeout(() => {
          const el = this.threadArea!.nativeElement;
          el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        }, 50);
      }
    });
  }

  ngOnInit(): void {
    this.integrationService.listIntegrations({ status: 'active', limit: 100 }).subscribe({
      next: (response) => {
        this.integrations.set(response.integrations);
        this.selectedIntegrationIds.set(response.integrations.map(i => i.id));
      },
    });
  }

  onSubmit(event: { queryText: string }): void {
    this.store.submitQuery(event.queryText, this.selectedIntegrationIds());
  }

  onApprove(): void { this.store.approveQuery(); }
  onReject(): void { this.store.rejectQuery(); }
  onExportCsv(): void { this.store.exportCsv(); }

  onNewQuery(): void {
    this.store.reset();
    this.selectedIntegrationIds.set(this.integrations().map(i => i.id));
  }
}
