import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TopicAccordion } from './TopicAccordion';
import { TABS } from '@/data/tabs';
import type { TabId } from '@/types/tabs';
import { getTaxonomy, getMasteryTaxonomy, getNeetcodeTaxonomy } from '@/data/adapter';
import type { Topic } from '@/data/types';

const STORAGE_KEY = 'endlesscode-active-tab';

const TAB_TAXONOMY_MAP: Record<string, () => Topic[]> = {
    'all': getTaxonomy,
    'mastery': getMasteryTaxonomy,
    'neetcode': getNeetcodeTaxonomy,
};

export function TaxonomyTabs() {
    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get('tab');

    // Determine active tab
    let activeTab: TabId = TABS[0].id as TabId;
    if (tabParam && TABS.some(t => t.id === tabParam)) {
        activeTab = tabParam as TabId;
    } else {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && TABS.some(t => t.id === saved)) {
            activeTab = saved as TabId;
        }
    }

    // Sync URL if it doesn't match the active tab
    useEffect(() => {
        if (searchParams.get('tab') !== activeTab) {
            setSearchParams({ tab: activeTab }, { replace: true });
        }
    }, [activeTab, searchParams, setSearchParams]);

    const handleTabChange = (tabId: string) => {
        setSearchParams({ tab: tabId });
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
