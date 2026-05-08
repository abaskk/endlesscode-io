import ALL_DATA from './taxonomy_graph_manual.json';
import { validateTaxonomy, type RawTaxonomy } from './schema';
import { TABS } from './tabs';
import { adaptRawTaxonomy } from './adapter';
import type { Topic } from './types';

const DATA_CACHE = new Map<string, RawTaxonomy>();
const ADAPTED_CACHE = new Map<string, Topic[]>();

// Pre-load the all data
DATA_CACHE.set('all', validateTaxonomy(ALL_DATA));
ADAPTED_CACHE.set('all', adaptRawTaxonomy(DATA_CACHE.get('all')!));

export async function loadRawTaxonomy(tabId: string): Promise<RawTaxonomy> {
    // Check cache first
    if (DATA_CACHE.has(tabId)) {
        return DATA_CACHE.get(tabId)!;
    }

    // Find the tab configuration
    const tab = TABS.find(t => t.id === tabId);
    if (!tab) {
        throw new Error(`Unknown tab: ${tabId}`);
    }

    // For now, we only have the 'all' data loaded
    // Future: Dynamic import based on tab.dataFile
    // Example: const data = await import(`./${tab.dataFile.replace('./', '')}`);
    // const validated = validateTaxonomy(data.default);
    // DATA_CACHE.set(tabId, validated);
    // return validated;

    throw new Error(`Taxonomy data for tab "${tabId}" is not yet implemented`);
}

export async function loadTaxonomy(tabId: string): Promise<Topic[]> {
    // Check adapted cache first
    if (ADAPTED_CACHE.has(tabId)) {
        return ADAPTED_CACHE.get(tabId)!;
    }

    // Load and validate raw data
    const rawData = await loadRawTaxonomy(tabId);

    // Adapt to app format
    const adapted = adaptRawTaxonomy(rawData);

    // Cache and return
    ADAPTED_CACHE.set(tabId, adapted);
    return adapted;
}

