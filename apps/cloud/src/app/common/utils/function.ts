import { ChannelType } from '../../shared/models/ipc/channel.type';

function validChannel(channelName: string) {
  if (!channelName) {
    throw new Error('Channel name is required');
  }
  if (typeof channelName !== 'string') {
    throw new Error('Channel name must be a string');
  }
  if (channelName.length === 0) {
    throw new Error('Channel name cannot be empty');
  }
  if (channelName.length > 100) {
    throw new Error('Channel name cannot exceed 100 characters');
  }
  if (!/^[a-zA-Z0-9]+$/.test(channelName)) {
    throw new Error('Channel name can only contain alphanumeric characters');
  }
  //eslint-disable-next-line
  if (!(window as Record<string, any>)?.[channelName]) {
    throw new Error(`Channel ${channelName} does not exist`);
  }
}

export function getChannel(channelName: string): ChannelType {
  validChannel(channelName);
  //eslint-disable-next-line
  return (window as Record<string, any>)[channelName];
}
