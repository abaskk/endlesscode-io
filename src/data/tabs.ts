import type { Tab } from '@/types/tabs';

export const TABS: Tab[] = [
    {
        id: 'all',
        label: 'All Problems',
        dataFile: './taxonomy_graph_manual.json',
    },
    {
        id: 'distilled',
        label: 'Distilled',
        dataFile: './taxonomy_graph_distilled_v1.json',
    },
];
