import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BaseComponent } from '../../../common/components';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'cloud-header',
  imports: [
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent extends BaseComponent {
  protected readonly routes: Array<{
    path: string;
    title: string;
  }> = [
    {
      path: '/search',
      title: 'Search',
    },
  ];
}
