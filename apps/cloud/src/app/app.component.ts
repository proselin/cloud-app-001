import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LayoutComponent } from './shared/components/layout/layout.component';

@Component({
  selector: 'cloud-root',
  imports: [RouterOutlet, LayoutComponent],
  template: ` <cloud-layout>
    <router-outlet></router-outlet>
  </cloud-layout>`,
  standalone: true,
})
export class AppComponent {
  title = 'Margiet';
}
