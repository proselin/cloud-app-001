export type ChannelType = Record<
  string,
  | ChannelResponseFunction
  | ChannelResponse
  | Promise<ChannelResponse>
  | string
  | number
  | boolean
  | Record<string, unknown>
>;

export type ChannelValueType =
  | ChannelResponseFunction
  | ChannelResponse
  | Promise<ChannelResponse>
  | string
  | number
  | boolean
  | Record<string, unknown>;
export type ChannelResponse<T = unknown> = {
  error: string | object | null;
  response: T | null;
};

export type ChannelResponseFunction = (
  ...args: any[]
) => ChannelResponse | Promise<ChannelResponse>;
