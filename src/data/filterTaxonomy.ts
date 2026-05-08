import Fuse from 'fuse.js';
import type { Problem, Section, Subtopic, Topic } from './types';

export function filterTaxonomy(
  taxonomy: Topic[],
  searchQuery: string,
  selectedTags: string[],
  selectedSections: string[]
): Topic[] {
  if (searchQuery.length === 0 && selectedTags.length === 0 && selectedSections.length === 0) {
    return taxonomy;
  }

  const allProblems: Array<{ problem: Problem; section: Section; subtopic: Subtopic | null; topic: Topic }> = [];
  taxonomy.forEach(topic => {
    topic.sections.forEach(section => {
      section.problems.forEach(problem => {
        allProblems.push({ problem, section, subtopic: null, topic });
      });
      section.subtopics.forEach(subtopic => {
        subtopic.problems.forEach(problem => {
          allProblems.push({ problem, section, subtopic, topic });
        });
      });
    });
  });

  let matchingProblems = allProblems;

  if (searchQuery.length > 0) {
    const fuse = new Fuse(allProblems, {
      keys: [
        { name: 'problem.title', weight: 2 },
        { name: 'problem.id', weight: 1 },
        { name: 'section.title', weight: 0.5 },
        { name: 'subtopic.title', weight: 0.5 },
      ],
      threshold: 0.4,
      ignoreLocation: true,
    });
    const results = fuse.search(searchQuery);
    matchingProblems = results.map(r => r.item);
  }

  if (selectedTags.length > 0) {
    matchingProblems = matchingProblems.filter(({ problem }) =>
      problem.tags.some(tag => selectedTags.includes(tag))
    );
  }

  const topicSet = new Map<string, Topic>();
  const sectionSet = new Map<string, { topic: Topic; section: Section }>();
  const subtopicSet = new Map<string, { section: Section; subtopic: Subtopic }>();
  const problemIds = new Set<string>();

  matchingProblems.forEach(({ problem, section, subtopic, topic }) => {
    problemIds.add(problem.id);

    if (!topicSet.has(topic.id)) {
      topicSet.set(topic.id, topic);
    }

    const sectionKey = `${topic.id}-${section.title}`;
    if (!sectionSet.has(sectionKey)) {
      sectionSet.set(sectionKey, { topic, section });
    }

    if (subtopic) {
      const subtopicKey = `${sectionKey}-${subtopic.title}`;
      if (!subtopicSet.has(subtopicKey)) {
        subtopicSet.set(subtopicKey, { section, subtopic });
      }
    }
  });

  return Array.from(topicSet.values()).map(topic => ({
    ...topic,
    sections: topic.sections
      .filter(section => {
        const sectionKey = `${topic.id}-${section.title}`;
        if (selectedSections.length > 0 && !selectedSections.includes(sectionKey)) {
          return false;
        }
        return true;
      })
      .map(section => ({
        ...section,
        subtopics: section.subtopics
          .filter(subtopic => {
            const subtopicKey = `${topic.id}-${section.title}-${subtopic.title}`;
            const inSet = subtopicSet.has(subtopicKey);
            if (!inSet) return false;
            const { subtopic: filteredSubtopic } = subtopicSet.get(subtopicKey)!;
            return {
              ...filteredSubtopic,
              problems: filteredSubtopic.problems.filter(p => problemIds.has(p.id)),
            };
          }),
        problems: section.problems.filter(p => problemIds.has(p.id)),
      }))
      .filter(section => section.problems.length > 0 || section.subtopics.length > 0),
  })).filter(topic => topic.sections.length > 0);
}
