import { inject, Injectable } from '@angular/core';
import { getChannel } from '../utils/function';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { from, Observable, of, tap } from 'rxjs';
import {
  ChannelResponse,
  ChannelResponseFunction,
  ChannelType,
} from '../../shared/models/ipc/channel.type';
import { isPromise } from '../../shared/utils/function';

@Injectable()
export abstract class BaseIpcService<Channel extends ChannelType> {
  readonly #channel: Channel;
  protected readonly notificationService: NzNotificationService;

  constructor(channelName: string) {
    this.#channel = getChannel(channelName) as Channel;
    this.notificationService = inject(NzNotificationService);
  }

  protected get channel() {
    return this.#channel;
  }

  send<R = object>(
    api: keyof Channel,
    ...args: Channel[keyof Channel] extends ChannelResponseFunction
      ? Parameters<Channel[keyof Channel]>
      : []
  ): Observable<ChannelResponse<R>> {
    console.log(`Sending message to api=${api as string} args=`, args);
    return this.formatResponse<R>(api, ...args).pipe(
      tap({
        next: (response) => {
          console.log(`Receive Data api=${api as string} response=`, response);
          if (response.error) {
            const error = response.error;
            if (typeof error === 'string') {
              this.notificationService.error('Lỗi', error);
              return;
            }
            if (typeof error === 'object' && 'message' in error) {
              this.notificationService.error('Lỗi', error.message as string);
              return;
            }
          }
        },
      })
    ) as Observable<ChannelResponse<R>>;
  }

  private formatResponse<R = any>(
    api: keyof Channel,
    ...args: Channel[keyof Channel] extends ChannelResponseFunction
      ? Parameters<Channel[keyof Channel]>
      : []
  ) {
    if (api in this.#channel) {
      const apiUnknown = this.#channel[api];
      if (typeof apiUnknown === 'function') {
        return from(
          Promise.resolve(apiUnknown(...args)) as Promise<ChannelResponse<R>>
        );
      }
      if (isPromise(api)) {
        return from(apiUnknown as Promise<ChannelResponse<R>>);
      }
      if (typeof apiUnknown == 'object') {
        if ('response' in apiUnknown && 'error' in apiUnknown) {
          return of(apiUnknown) as Observable<ChannelResponse<R>>;
        }
      }
      return of({
        response: apiUnknown,
        error: null,
      } as ChannelResponse<R>);
    }
    return of({ error: new Error('NotFound API'), response: null });
  }
}
