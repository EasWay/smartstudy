// API related types
export interface GuardianArticle {
  id: string;
  webTitle: string;
  webUrl: string;
  apiUrl: string;
  webPublicationDate: string;
  fields?: {
    headline?: string;
    trailText?: string;
    thumbnail?: string;
    body?: string;
    byline?: string;
    webPublicationDate?: string;
  };
}

export interface GuardianResponse {
  response: {
    status: string;
    userTier: string;
    total: number;
    results: GuardianArticle[];
  };
}

export interface OpenLibraryBook {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  isbn?: string[];
  subject?: string[];
  cover_i?: number;
  edition_count?: number;
}

export interface OpenLibrarySearchResponse {
  numFound: number;
  start: number;
  docs: OpenLibraryBook[];
}