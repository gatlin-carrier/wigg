export type OLWork = {
  key: string; // e.g., "/works/OL12345W"
  title: string;
  cover_i?: number;
  first_publish_year?: number;
  author_name?: string[];
  subject?: string[];
};

export type OLTrendingResponse = {
  works: OLWork[];
};

