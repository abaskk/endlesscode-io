import type { Tab } from '@/types/tabs';

export const TABS: Tab[] = [
    {
        id: 'all',
        label: 'All Problems',
        dataFile: './taxonomy_graph_manual.json',
    },
    // Future tabs will be added here
    // { id: 'google-india', label: 'Google India', dataFile: './taxonomy_google_india.json' },
    // { id: 'meta', label: 'Meta', dataFile: './taxonomy_meta.json' },
    // { id: 'amazon', label: 'Amazon', dataFile: './taxonomy_amazon.json' },
];
