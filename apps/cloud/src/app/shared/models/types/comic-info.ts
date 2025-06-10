export type ComicInfo = {
  author: string;
  url: string;
  title: string;
  description: string;
  imageUrl: string;
  chapterCount?: number;
  thumbImage?: {
    fileName: string;
  };
};
