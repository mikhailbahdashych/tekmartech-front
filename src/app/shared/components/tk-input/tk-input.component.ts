import { Component, input, signal, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LucideAngularModule, Eye, EyeOff } from 'lucide-angular';

@Component({
  selector: 'tk-input',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './tk-input.component.html',
  styleUrl: './tk-input.component.scss',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => TkInputComponent),
    multi: true,
  }],
})
export class TkInputComponent implements ControlValueAccessor {
  readonly label = input('');
  readonly placeholder = input('');
  readonly type = input<'text' | 'email' | 'password'>('text');
  readonly error = input<string | null>(null);
  readonly helperText = input<string | null>(null);
  readonly disabled = input(false);
  readonly monospace = input(false);
  readonly autocomplete = input('');
  readonly testId = input<string | null>(null);

  readonly icons = { Eye, EyeOff };
  readonly value = signal('');
  readonly showPassword = signal(false);
  readonly isDisabled = signal(false);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  get currentType(): string {
    if (this.type() === 'password') {
      return this.showPassword() ? 'text' : 'password';
    }
    return this.type();
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.value.set(val);
    this.onChange(val);
  }

  onBlur(): void {
    this.onTouched();
  }

  writeValue(value: string): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}
