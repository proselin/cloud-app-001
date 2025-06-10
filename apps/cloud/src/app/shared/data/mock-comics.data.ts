// Mock data for comics to replace IPC calls
import { ComicInfo } from '../models/types/comic-info';

export const MOCK_COMICS: ComicInfo[] = [
  {
    title: 'One Piece',
    author: 'Eiichiro Oda',
    description: 'The adventures of Monkey D. Luffy and his pirate crew as they search for the legendary treasure known as One Piece.',
    url: 'https://example.com/one-piece',
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop',
    chapterCount: 1100,
    thumbImage: {
      fileName: 'one-piece-thumb.jpg'
    }
  },
  {
    title: 'Naruto',
    author: 'Masashi Kishimoto',
    description: 'The story of Naruto Uzumaki, a young ninja who seeks recognition from his peers and dreams of becoming the Hokage.',
    url: 'https://example.com/naruto',
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop',
    chapterCount: 700,
    thumbImage: {
      fileName: 'naruto-thumb.jpg'
    }
  },
  {
    title: 'Attack on Titan',
    author: 'Hajime Isayama',
    description: 'Humanity fights for survival against giant humanoid Titans that have brought humanity to the brink of extinction.',
    url: 'https://example.com/attack-on-titan',
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop',
    chapterCount: 139,
    thumbImage: {
      fileName: 'aot-thumb.jpg'
    }
  },
  {
    title: 'Dragon Ball',
    author: 'Akira Toriyama',
    description: 'Follow the adventures of Goku from his childhood through adulthood as he trains in martial arts.',
    url: 'https://example.com/dragon-ball',
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop',
    chapterCount: 519,
    thumbImage: {
      fileName: 'dragon-ball-thumb.jpg'
    }
  },
  {
    title: 'My Hero Academia',
    author: 'Kohei Horikoshi',
    description: 'In a world where people with superpowers are the norm, Izuku Midoriya aims to become a hero despite being born powerless.',
    url: 'https://example.com/my-hero-academia',
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop',
    chapterCount: 400,
    thumbImage: {
      fileName: 'mha-thumb.jpg'
    }
  },
  {
    title: 'Demon Slayer',
    author: 'Koyoharu Gotouge',
    description: 'Tanjiro Kamado becomes a demon slayer to save his sister and avenge his family.',
    url: 'https://example.com/demon-slayer',
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop',
    chapterCount: 205,
    thumbImage: {
      fileName: 'demon-slayer-thumb.jpg'
    }
  },
  {
    title: 'Jujutsu Kaisen',
    author: 'Gege Akutami',
    description: 'Students at Tokyo Jujutsu High School learn to harness cursed energy to fight supernatural beings.',
    url: 'https://example.com/jujutsu-kaisen',
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop',
    chapterCount: 250,
    thumbImage: {
      fileName: 'jjk-thumb.jpg'
    }
  },
  {
    title: 'Chainsaw Man',
    author: 'Tatsuki Fujimoto',
    description: 'Denji, a young man with the ability to transform parts of his body into chainsaws, fights devils.',
    url: 'https://example.com/chainsaw-man',
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop',
    chapterCount: 120,
    thumbImage: {
      fileName: 'chainsaw-man-thumb.jpg'
    }
  }
];

// Mock image data mapping filename to base64 placeholder
export const MOCK_IMAGES: Record<string, string> = {
  'one-piece-thumb.jpg': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTkiIGR5PSIuM2VtIj5PbmUgUGllY2U8L3RleHQ+PC9zdmc+',
  'naruto-thumb.jpg': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmY5ODAwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNmZmYiIGR5PSIuM2VtIj5OYXJ1dG88L3RleHQ+PC9zdmc+',
  'aot-thumb.jpg': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjOGIwMDAwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNmZmYiIGR5PSIuM2VtIj5BdHRhY2sgb24gVGl0YW48L3RleHQ+PC9zdmc+',
  'dragon-ball-thumb.jpg': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmY2NjAwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNmZmYiIGR5PSIuM2VtIj5EcmFnb24gQmFsbDwvdGV4dD48L3N2Zz4=',
  'mha-thumb.jpg': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMDA4MDAwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNmZmYiIGR5PSIuM2VtIj5NeSBIZXJvIEFjYWRlbWlhPC90ZXh0Pjwvc3ZnPg==',
  'demon-slayer-thumb.jpg': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNDAwMDgwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNmZmYiIGR5PSIuM2VtIj5EZW1vbiBTbGF5ZXI8L3RleHQ+PC9zdmc+',
  'jjk-thumb.jpg': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMmUyZTJlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNmZmYiIGR5PSIuM2VtIj5KdWp1dHN1IEthaXNlbjwvdGV4dD48L3N2Zz4=',
  'chainsaw-man-thumb.jpg': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmYwMDAwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNmZmYiIGR5PSIuM2VtIj5DaGFpbnNhdyBNYW48L3RleHQ+PC9zdmc+'
};
