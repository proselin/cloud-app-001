import { ChapterEntity } from '../../entities/chapter.entity';

export type ChapterDetailResponseDto = ReturnType<typeof ChapterEntity.toJSON> & { comic: { id: number; title: string } };
