// mirrors models.py in the gamedex-picks repo. deliberately NOT camelCased:
// these come off the wire as-is, and matching the python names means I can
// read the two files side by side without translating in my head.
//
// if a field changes there, it changes here. nothing enforces that — it's a
// hand-kept contract across two repos, so the pydantic model is the source
// of truth and this file follows it.

export interface Recommendation {
  id: number;
  title: string | null;
  cover: string | null;
  userRating: number;
  genreSlugs: string[];
  // display-only, the algorithm never touches these
  year: number | null;
  genre: string[];
  adult: boolean;
  // null on the popular/cold-start path — nothing was ranked
  similarity: number | null;
}

export interface PicksResponse {
  // "content" = built from my list, "popular" = cold-start fallback
  basis: "content" | "popular";
  adult_included: boolean;
  note: string | null;
  // these four only exist on the content path
  query_genres: string[] | null;
  query_tags: string[] | null;
  from_entries: number | null;
  candidates_considered: number | null;
  results: Recommendation[];
}

export interface CoversResponse {
  covers: string[];
}

export interface ExamplesResponse {
  covers: Record<string, string>;
}

export interface StatsResponse {
  games: number;
  genres: number;
  tags: number;
}