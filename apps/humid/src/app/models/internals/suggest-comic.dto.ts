import { ApiProperty } from '@nestjs/swagger';

export class SuggestComicDto {
  @ApiProperty({ description: 'ID of the comic', example: 1 })
  id!: number;

  @ApiProperty({ description: 'Title of the comic', example: 'My Comic' })
  title!: string;

  @ApiProperty({
    description: 'URL of the comic',
    example: 'https://example.com/comic',
  })
  url!: string;

  @ApiProperty({
    description: 'Latest chapter of the comic',
    example: 'Chapter 376',
  })
  chapter!: string;

  @ApiProperty({ description: 'Author of the comic', example: 'Tabata Yuuki' })
  author!: string;

  @ApiProperty({
    description: 'Genres of the comic',
    type: [String],
    example: ['Action', 'Comedy', 'Fantasy'],
  })
  genres!: string[];

  @ApiProperty({
    description: 'Thumbnail URL of the comic',
    example:
      'https://cdn1.cloud-zzz.com/nettruyen/thumb/black-clover-the-gioi-phep-thuat.jpg',
  })
  thumbnail!: string;
}
