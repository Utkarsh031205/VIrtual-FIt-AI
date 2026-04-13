
export interface ImageState {
  original: string | null;
  product: string | null;
  generated: string | null;
}

export interface Recommendation {
  item: string;
  reason: string;
  category: 'Top' | 'Bottom' | 'Outerwear' | 'Footwear' | 'Accessory';
  searchLink: string;
  imageUrl?: string;
  brandSuggestion?: string;
}

export interface GalleryItem {
  id: string;
  original: string;
  generated: string;
  product: string;
  recommendations?: Recommendation[];
  timestamp: number;
}

export interface ExtractionResult {
  imageUrl: string | null;
  title: string | null;
  error?: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  EXTRACTING = 'EXTRACTING',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
