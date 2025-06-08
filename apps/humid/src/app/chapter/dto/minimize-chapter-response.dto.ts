import { ChapterEntity } from '../../entities/chapter.entity';

export type MinimizeChapterResponseDto = Awaited<ReturnType<
  typeof ChapterEntity.toJSONWithoutImage
>>;
