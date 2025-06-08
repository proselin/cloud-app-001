import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePagesComponent } from '../../common/components';

@Component({
  selector: 'cloud-chapter',
  imports: [],
  templateUrl: './chapter.component.html',
  styleUrl: './chapter.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChapterComponent extends BasePagesComponent {}
