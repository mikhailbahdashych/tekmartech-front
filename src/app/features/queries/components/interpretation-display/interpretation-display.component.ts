import { Component, input } from '@angular/core';
import { MarkdownPipe } from '@shared/pipes/markdown.pipe';

@Component({
  selector: 'app-interpretation-display',
  standalone: true,
  imports: [MarkdownPipe],
  templateUrl: './interpretation-display.component.html',
  styleUrl: './interpretation-display.component.scss',
})
export class InterpretationDisplayComponent {
  readonly text = input('');
  readonly isStreaming = input(false);
  readonly errorMessage = input<string | null>(null);
}
