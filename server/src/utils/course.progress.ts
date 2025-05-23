import { SectionProgress, ChapterProgress } from "../types/types";

/**
 * This file contains utility functions for managing course progress and merging sections and chapters.
 * It includes functions to merge chapters and sections, and to calculate overall progress.
 * @param existingChapters 
 * @param newChapters 
 * @returns 
 */
export const mergeChapters = (
  existingChapters: ChapterProgress[],
  newChapters: ChapterProgress[]
): ChapterProgress[] => {
  const existingChaptersMap = new Map<string, ChapterProgress>();
  for (const existingChapter of existingChapters) {
    existingChaptersMap.set(existingChapter.chapterId, existingChapter);
  }

  for (const newChapter of newChapters) {
    existingChaptersMap.set(newChapter.chapterId, {
      ...(existingChaptersMap.get(newChapter.chapterId) || {}),
      ...newChapter,
    });
  }

  return Array.from(existingChaptersMap.values());
};

/**
 * This function merges two arrays of sections, updating existing sections and adding new ones.
 * @param existingSections 
 * @param newSections 
 * @returns 
 */
export const mergeSections = (
  existingSections: SectionProgress[],
  newSections: SectionProgress[]
): SectionProgress[] => {
  const existingSectionsMap = new Map<string, SectionProgress>();
  for (const existingSection of existingSections) {
    existingSectionsMap.set(existingSection.sectionId, existingSection);
  }

  for (const newSection of newSections) {
    const section = existingSectionsMap.get(newSection.sectionId);
    if (!section) {
      // Add new section
      existingSectionsMap.set(newSection.sectionId, newSection);
    } else {
      // Merge chapters within the existing section
      section.chapters = mergeChapters(section.chapters, newSection.chapters);
      existingSectionsMap.set(newSection.sectionId, section);
    }
  }

  return Array.from(existingSectionsMap.values());
};

/**
 * This function calculates the overall progress of a course based on the completion status of chapters within sections.
 * @param sections 
 * @returns 
 */
export const calculateOverallProgress = (sections: SectionProgress[]): number => {
  const totalChapters = sections.reduce(
    (acc: number, section: SectionProgress) => acc + section.chapters.length,
    0
  );

  const completedChapters = sections.reduce(
    (acc: number, section: SectionProgress) =>
      acc + section.chapters.filter((chapter: ChapterProgress) => chapter.completed).length,
    0
  );

  return totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;
};