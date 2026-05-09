import { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TopicAccordion } from './TopicAccordion';
import { TABS } from '@/data/tabs';
import type { TabId } from '@/types/tabs';
import { getTaxonomy, getDistilledTaxonomy } from '@/data/adapter';
import type { Topic } from '@/data/types';

const STORAGE_KEY = 'endlesscode-active-tab';

const TAB_TAXONOMY_MAP: Record<string, () => Topic[]> = {
    'all': getTaxonomy,
    'distilled': getDistilledTaxonomy,
};

export function TaxonomyTabs() {
    const [activeTab, setActiveTab] = useState<TabId>('all');

    // Load saved tab from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && TABS.some(t => t.id === saved)) {
            setActiveTab(saved as TabId);
        }
    }, []);

    // Save tab to localStorage when it changes
    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId as TabId);
        localStorage.setItem(STORAGE_KEY, tabId);
    };

    // Memoize taxonomy for each tab to avoid recomputing on every render
    const taxonomyMap = useMemo(() => {
        const map: Record<string, Topic[]> = {};
        for (const tab of TABS) {
            const getter = TAB_TAXONOMY_MAP[tab.id];
            if (getter) map[tab.id] = getter();
        }
        return map;
    }, []);

    return (
        <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-6">
                {TABS.map((tab) => (
                    <TabsTrigger key={tab.id} value={tab.id}>
                        {tab.label}
                    </TabsTrigger>
                ))}
            </TabsList>

            {TABS.map((tab) => (
                <TabsContent key={tab.id} value={tab.id} className="mt-0">
                    <TopicAccordion taxonomy={taxonomyMap[tab.id] || []} />
                </TabsContent>
            ))}
        </Tabs>
    );
}
