import { Component, effect, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TkTextareaComponent } from '@shared/components/tk-textarea/tk-textarea.component';
import { TkButtonComponent } from '@shared/components/tk-button/tk-button.component';
import { TkIconComponent } from '@shared/components/tk-icon/tk-icon.component';
import { Send } from 'lucide-angular';

@Component({
  selector: 'query-input',
  standalone: true,
  imports: [ReactiveFormsModule, TkTextareaComponent, TkButtonComponent, TkIconComponent],
  templateUrl: './query-input.component.html',
  styleUrl: './query-input.component.scss',
})
export class QueryInputComponent {
  readonly isSubmitting = input(false);
  readonly disabled = input(false);
  readonly submitQuery = output<{ queryText: string }>();

  readonly icons = { Send };
  readonly queryControl = new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(10000)]);

  constructor() {
    effect(() => {
      if (this.disabled()) {
        this.queryControl.disable({ emitEvent: false });
      } else {
        this.queryControl.enable({ emitEvent: false });
      }
    }, { allowSignalWrites: true });
  }

  onSubmit(): void {
    if (this.queryControl.invalid || this.isSubmitting() || this.disabled()) return;
    this.submitQuery.emit({ queryText: this.queryControl.value!.trim() });
  }

  onKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      this.onSubmit();
    }
  }
}
