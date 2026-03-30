import { Component, input } from '@angular/core';
import { TkIntegrationIconComponent } from '@shared/components/tk-integration-icon/tk-integration-icon.component';

interface MessageIntegration {
  id: string;
  type: string;
  displayName: string;
}

@Component({
  selector: 'app-user-message',
  standalone: true,
  imports: [TkIntegrationIconComponent],
  templateUrl: './user-message.component.html',
  styleUrl: './user-message.component.scss',
})
export class UserMessageComponent {
  readonly queryText = input('');
  readonly integrations = input<MessageIntegration[]>([]);
}
