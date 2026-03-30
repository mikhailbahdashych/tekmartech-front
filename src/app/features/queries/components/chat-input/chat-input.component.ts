import { Component, ElementRef, ViewChild, AfterViewInit, input, output, signal, computed } from '@angular/core';
import { TkIconComponent } from '@shared/components/tk-icon/tk-icon.component';
import { Plus, ArrowUp, Send } from 'lucide-angular';

@Component({
  selector: 'chat-input',
  standalone: true,
  imports: [TkIconComponent],
  templateUrl: './chat-input.component.html',
  styleUrl: './chat-input.component.scss',
})
export class ChatInputComponent implements AfterViewInit {
  readonly isSubmitting = input(false);
  readonly disabled = input(false);
  readonly placeholder = input('Ask about your infrastructure...');
  readonly submitQuery = output<{ queryText: string }>();
  readonly plusClick = output<void>();

  readonly icons = { Plus, ArrowUp, Send };
  readonly value = signal('');
  readonly hasText = computed(() => this.value().trim().length > 0);

  @ViewChild('textarea') private textareaRef!: ElementRef<HTMLTextAreaElement>;

  private readonly MAX_HEIGHT = 200;
  private readonly MIN_HEIGHT = 24;

  ngAfterViewInit(): void {
    this.adjustHeight();
  }

  onInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.value.set(textarea.value);
    this.adjustHeight();
  }

  onKeydown(event: KeyboardEvent): void {
    // Enter without shift submits; Shift+Enter inserts newline
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.submit();
      return;
    }
    // Ctrl/Cmd+Enter also submits
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      this.submit();
    }
  }

  submit(): void {
    if (!this.hasText() || this.isSubmitting() || this.disabled()) return;
    this.submitQuery.emit({ queryText: this.value().trim() });
    this.value.set('');
    if (this.textareaRef) {
      this.textareaRef.nativeElement.value = '';
      this.adjustHeight();
    }
  }

  private adjustHeight(): void {
    const textarea = this.textareaRef?.nativeElement;
    if (!textarea) return;

    // Reset to min to measure scrollHeight accurately
    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;

    if (scrollHeight > this.MAX_HEIGHT) {
      textarea.style.height = `${this.MAX_HEIGHT}px`;
      textarea.style.overflowY = 'auto';
    } else {
      textarea.style.height = `${Math.max(scrollHeight, this.MIN_HEIGHT)}px`;
      textarea.style.overflowY = 'hidden';
    }
  }
}
