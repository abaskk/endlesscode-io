import type { Tab, TabGroup } from '@/types/tabs';

const TAXONOMY_TABS: Tab[] = [
    {
        id: 'neetcode',
        label: 'NeetCode 150',
        group: 'taxonomy',
        dataFile: './taxonomy_graph_neetcode150.json',
    },
    {
        id: 'mastery',
        label: 'Mastery',
        group: 'taxonomy',
        dataFile: './taxonomy_graph_mastery_v1.json',
    },
    {
        id: 'all',
        label: 'All Problems',
        group: 'taxonomy',
        dataFile: './taxonomy_graph_manual.json',
    },
];

const PRACTICE_TABS: Tab[] = [
    {
        id: 'review',
        label: 'Review',
        group: 'practice',
    },
    {
        id: 'gauntlet',
        label: 'Gauntlet',
        group: 'practice',
    },
];

export const TABS: Tab[] = [...TAXONOMY_TABS, ...PRACTICE_TABS];

export const TAB_GROUPS: TabGroup[] = [
    { label: 'TAXONOMY', tabs: TAXONOMY_TABS },
    { label: 'PRACTICE', tabs: PRACTICE_TABS },
];
