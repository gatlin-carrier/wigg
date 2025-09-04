import { type MovieScene } from "@/components/wigg/SceneSelector";

// Simple placeholder - no ChapterDb integration
export const fetchChapterDbChapters = async (movieTitle: string): Promise<MovieScene[]> => {
  console.log(`No ChapterDb integration - returning empty for: ${movieTitle}`);
  return [];
};