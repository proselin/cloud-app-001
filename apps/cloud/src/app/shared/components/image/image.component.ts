import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  inject,
  Input,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BaseComponent } from '../../../common/components';

@Component({
  selector: 'cloud-image',
  imports: [],
  templateUrl: './image.component.html',
  styleUrl: './image.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageComponent extends BaseComponent {
  // -----------------------------------------------------------------------------------------------------
  // @ Dependencies
  // -----------------------------------------------------------------------------------------------------

  private readonly domSanitizer = inject(DomSanitizer);

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


}
