import { Component, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LucideAngularModule, Send } from 'lucide-angular';

@Component({
  selector: 'app-query-input',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule, LucideAngularModule],
  templateUrl: './query-input.component.html',
  styleUrl: './query-input.component.scss',
})
export class QueryInputComponent {
  readonly isSubmitting = input(false);
  readonly disabled = input(false);
  readonly submitQuery = output<{ queryText: string }>();

  readonly icons = { Send };
  readonly queryControl = new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(10000)]);

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
