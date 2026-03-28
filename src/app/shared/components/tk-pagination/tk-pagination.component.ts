import { Component, input, output } from '@angular/core';
import { TkButtonComponent } from '../tk-button/tk-button.component';

@Component({
  selector: 'tk-pagination',
  standalone: true,
  imports: [TkButtonComponent],
  templateUrl: './tk-pagination.component.html',
  styleUrl: './tk-pagination.component.scss',
})
export class TkPaginationComponent {
  readonly hasMore = input(false);
  readonly totalCount = input(0);
  readonly currentCount = input(0);
  readonly loadMore = output();
}
