export type PageEntry = {
  title: string;
  file: string;
  id: string | null;
  children?: PageEntry[];
};

export type Manifest = {
  collectionId: string;
  pages: PageEntry[];
};

export type TopCollectionConfig = {
  id: string;
  name?: string;
  saveDir?: string;
  pagesFile?: string;
  configFile?: string;
};

export type TopConfig = {
  collections: TopCollectionConfig[];
};

export type MappingRule = {
  match: { id?: string; title?: string };
  path: string; // relative path where to save
};

export type CollectionConfig = {
  collectionId: string;
  saveDir?: string;
  mappings?: MappingRule[];
};
