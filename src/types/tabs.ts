export type TabId = 'all' | string;

export interface Tab {
    id: TabId;
    label: string;
    group: 'taxonomy' | 'practice';
    dataFile?: string;
}

export interface TabGroup {
    label: string;
    tabs: Tab[];
}
