export interface OutlineConfig {
  url: string;
  token: string;
  outputDir?: string;
  customPaths?: Record<string, string>;
  includeCollections?: string[];
  excludeCollections?: string[];
}

export interface Document {
  id: string;
  title: string;
  text: string;
  collectionId: string;
  parentDocumentId: string | null;
  publishedAt: string | null;
  updatedAt: string;
  createdAt: string;
  urlId: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  sort: Record<string, number>;
}

export interface DocumentMetadata {
  id: string;
  title: string;
  collectionId: string;
  parentDocumentId: string | null;
  updatedAt: string;
  urlId: string;
}
