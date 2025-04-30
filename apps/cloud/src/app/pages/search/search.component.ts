import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BasePagesComponent } from '../../common/components';
import { FormsModule } from '@angular/forms';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { HumidIpcService } from '../../shared/services/ipc/humid-ipc.service';
import { from } from 'rxjs';

@Component({
  selector: 'cloud-search',
  imports: [FormsModule, NzButtonModule, NzInputModule, NzIconModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchComponent extends BasePagesComponent {
  private humidIpcService = inject(HumidIpcService)
  searchString = "";

  async onSearch() {
    console.log(await this.humidIpcService.getAppVersion())
    from(this.humidIpcService.getComicByUrl(this.searchString)).subscribe({
      next: result => {
        console.log("Response", result);
      },
      error: err => {console.log(err)}
    })
  }
}
