import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  inject,
  Input,
  OnChanges,
  signal,
  SimpleChanges,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BaseComponent } from '../../../common/components';
import { MockDataService } from '../../services/mock';
import { ConvertUtils } from '../../../common/utils/convert.utils';
import { MimeTypes } from '../../../common/variables/mimetype';

@Component({
  selector: 'cloud-image',
  imports: [],
  templateUrl: './image.component.html',
  styleUrl: './image.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageComponent extends BaseComponent implements OnChanges {
  // -----------------------------------------------------------------------------------------------------
  // @ Dependencies
  // -----------------------------------------------------------------------------------------------------

  private readonly domSanitizer = inject(DomSanitizer);
  private readonly mockDataService = inject(MockDataService);

  // -----------------------------------------------------------------------------------------------------
  // @ Accessors
  // -----------------------------------------------------------------------------------------------------

  /**
   * Host binding for component classes
   */
  @HostBinding('class')
  get classList(): Record<string, boolean> {
    return {
      'cloud-image-common': true,
    };
  }

  /**
   * Source of image
   */
  @Input({ required: true })
  fileName?: string;

  @Input()
  public alt = 'Image';

  // -----------------------------------------------------------------------------------------------------
  // @ Properties
  // -----------------------------------------------------------------------------------------------------

  protected bufferSource = signal<string | SafeResourceUrl>('');

  // -----------------------------------------------------------------------------------------------------
  // @ Life Circle Hooks
  // -----------------------------------------------------------------------------------------------------

  ngOnChanges(changes: SimpleChanges) {
    // Load File match with filename
    if ('fileName' in changes) {
      if (!this.fileName) {
        this.bufferSource.set('');
      } else {
        this.mockDataService.getImageFile(this.fileName).subscribe({
          next: (result) => {
            if (!result.response) return;
            this.bufferSource.set(
              ConvertUtils.BufferToObjectUrl(
                result.response,
                MimeTypes['.jpeg']
              ) ?? ''
            );
          },
        });
      }
    }
  }
}
