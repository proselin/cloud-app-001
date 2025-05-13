import { CommonEntity } from './common-entity';

export type ImageEntity = CommonEntity & {
  fileName: string
  originUrls: string
  position: string
  type: string
}
