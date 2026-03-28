import { Component, input, output } from '@angular/core';
import { TkIconComponent } from '../tk-icon/tk-icon.component';
import { TkButtonComponent } from '../tk-button/tk-button.component';

@Component({
  selector: 'tk-empty-state',
  standalone: true,
  imports: [TkIconComponent, TkButtonComponent],
  templateUrl: './tk-empty-state.component.html',
  styleUrl: './tk-empty-state.component.scss',
})
export class TkEmptyStateComponent {
  readonly icon = input<any>(null);
  readonly heading = input('');
  readonly description = input('');
  readonly actionLabel = input('');
  readonly action = output();
}
