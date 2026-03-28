import { Component, input } from '@angular/core';

@Component({
  selector: 'app-interpretation-display',
  standalone: true,
  templateUrl: './interpretation-display.component.html',
  styleUrl: './interpretation-display.component.scss',
})
export class InterpretationDisplayComponent {
  readonly text = input('');
  readonly isStreaming = input(false);
  readonly errorMessage = input<string | null>(null);
}
