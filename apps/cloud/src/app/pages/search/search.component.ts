import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BasePagesComponent } from '../../common/components';
import { FormsModule } from '@angular/forms';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { HumitIpcService } from '../../shared/services/ipc/humit-ipc.service';

@Component({
  selector: 'cloud-search',
  imports: [FormsModule, NzButtonModule, NzInputModule, NzIconModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchComponent extends BasePagesComponent {
  private humitIpcService = inject(HumitIpcService)

  async onSearch() {
    console.log(await this.humitIpcService.getAppVersion())
    await this.humitIpcService.getComicByUrl("").then(result => {
      console.log("Response", result);
    })
  }
}
