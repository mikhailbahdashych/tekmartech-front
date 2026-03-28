import { Component, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'tk-icon',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './tk-icon.component.html',
  styleUrl: './tk-icon.component.scss',
})
export class TkIconComponent {
  readonly name = input.required<any>();
  readonly size = input<'sm' | 'md' | 'lg' | 'xl'>('md');
  readonly strokeWidth = input(1.5);

  readonly sizeMap: Record<string, number> = { sm: 16, md: 18, lg: 20, xl: 40 };
}
