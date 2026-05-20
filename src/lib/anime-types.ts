export type AnimeCard = {
  id: string;
  title: string;
  type: "TV" | "MOVIE" | "ONA" | "OVA";
  episodes: number;
  year: number;
  cover: string;
  banner: string;
  synopsis: string;
  genres: string[];
  rating?: string;
  sub?: number;
  dub?: number;
};
