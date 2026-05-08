export type TabId = 'all' | string;

export interface Tab {
    id: TabId;
    label: string;
    dataFile: string;
}
