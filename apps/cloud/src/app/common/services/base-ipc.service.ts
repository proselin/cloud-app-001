import { Injectable } from "@angular/core";
import { getChannel } from "../utils/function";

@Injectable()
export abstract class BaseIpcService<ChannelType = Record<string, unknown>> {
    readonly #channel: ChannelType

    constructor(channelName: string) {
      this.#channel = getChannel(channelName)
    }

    protected get channel() {
      return this.#channel
    }
}

