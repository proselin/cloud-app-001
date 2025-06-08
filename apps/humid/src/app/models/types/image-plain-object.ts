import { CommonEntityPlainObject } from './common-entity-plain-object';

export type ImagePlainObject = CommonEntityPlainObject & {
  fileName: string;
  originUrls: string;
  position: number;
  type: number;
};
