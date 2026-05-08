import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TopicAccordion } from './TopicAccordion';
import { TABS } from '@/data/tabs';
import type { TabId } from '@/types/tabs';

const STORAGE_KEY = 'endlesscode-active-tab';

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
                    <TopicAccordion activeTab={tab.id} />
                </TabsContent>
            ))}
        </Tabs>
    );
}
