import type { Tab } from '@/types/tabs';

export const TABS: Tab[] = [
    {
        id: 'neetcode',
        label: 'NeetCode 150',
        dataFile: './taxonomy_graph_neetcode150.json',
    },
    {
        id: 'mastery',
        label: 'Mastery',
        dataFile: './taxonomy_graph_mastery_v1.json',
    },
    {
        id: 'all',
        label: 'All Problems',
        dataFile: './taxonomy_graph_manual.json',
    },
];
