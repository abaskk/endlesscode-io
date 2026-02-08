
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { stringify } from 'csv-stringify/sync';
import type { GalaxyRow } from './schema_flat';

// Configuration
const RAW_DIR = path.join(process.cwd(), 'raw_galaxy_pages');
const OUTPUT_DATA_DIR = path.join(process.cwd(), '../../src/data');
// Separate output files
const OUTPUT_FUNDAMENTALS_JSON = path.join(OUTPUT_DATA_DIR, 'galaxy_fundamentals.json');
const OUTPUT_FULL_JSON = path.join(OUTPUT_DATA_DIR, 'galaxy_full.json');

// Regex for parsing problem lines
const PROBLEM_REGEX = /^(\d+)\.\s*(.+?)(?:\s+(\d{3,}))?$/;

// Map filename to Category Name
const CATEGORY_MAP: Record<string, string> = {
    // Fundamentals
    'data_structures': 'Data Structures',
    'math': 'Math',
    'dp': 'Dynamic Programming',
    'graph': 'Graph Theory',
    'greedy': 'Greedy',
    'string': 'Strings',
    'linked_list': 'Linked List',

    // Full Practice (Add more mappings as needed)
    'sliding_window': 'Sliding Window',
    'binary_search': 'Binary Search',
    // ...
};

async function scrapeFolder(folderName: string, outputFile: string) {
    const folderPath = path.join(RAW_DIR, folderName);
    if (!fs.existsSync(folderPath)) {
        console.warn(`Folder ${folderName} not found, skipping.`);
        return;
    }

    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.html'));
    const allProblems: GalaxyRow[] = [];
    const seenIds = new Set<number>();

    for (const file of files) {
        const basename = path.basename(file, '.html');
        // If not in map, capitalize/prettify basename
        const categoryName = CATEGORY_MAP[basename] || basename.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        console.log(`Processing [${folderName}] ${categoryName} (${file})...`);

        const html = fs.readFileSync(path.join(folderPath, file), 'utf-8');
        const $ = cheerio.load(html);

        let currentSection = 'General';
        let currentGroup = 'General';
        let currentSubGroup = 'General';

        const container = $('.break-words').first();
        if (!container.length) {
            console.warn(`Warning: No .break-words container found in ${file}`);
            continue;
        }

        const nodes = container.find('h2, h3, h4, ul');

        nodes.each((_, el) => {
            const tag = $(el).prop('tagName')?.toLowerCase();
            const text = $(el).text().trim();

            if (tag === 'h2') {
                currentSection = text.replace(/^§/, '').trim();
                currentGroup = 'General';
                currentSubGroup = 'General';
            } else if (tag === 'h3') {
                currentGroup = text.replace(/^§/, '').trim();
                currentSubGroup = 'General';
            } else if (tag === 'h4') {
                currentSubGroup = text.replace(/^§/, '').trim();
            } else if (tag === 'ul') {
                $(el).children('li').each((_, li) => {
                    const liText = $(li).text().trim();
                    const link = $(li).find('a').first();
                    const href = link.attr('href');

                    if (!href || !href.includes('/problems/')) return;

                    const linkText = link.text().trim();
                    const fullLineText = $(li).text().trim();

                    const idMatch = linkText.match(/^(\d+)\./);
                    if (!idMatch) return;

                    const id = parseInt(idMatch[1]);
                    if (id > 3836) return;

                    let rating: number | null = null;
                    const ratingMatch = fullLineText.match(/(\d{3,4})\s*$/) || fullLineText.match(/\s(\d{3,4})\s/);
                    if (ratingMatch) {
                        const r = parseInt(ratingMatch[1]);
                        if (r >= 1000 && r < 4000) {
                            rating = r;
                        }
                    }

                    const isPremium = fullLineText.includes('会员') || fullLineText.includes('Plus');
                    const title = linkText.replace(/^\d+\.\s*/, '').trim();

                    const row: GalaxyRow = {
                        id,
                        title,
                        slug: href.split('/problems/')[1]?.replace(/\/$/, '') || '',
                        rating,
                        difficulty: null,
                        is_premium: isPremium,
                        url: href.startsWith('http') ? href : `https://leetcode.cn${href}`,

                        ec_category: categoryName,
                        ec_section: currentSection,
                        ec_group: currentGroup,
                        ec_sub_group: currentSubGroup,
                        source_url: `https://leetcode.cn/circle/discuss/${basename}/`
                    };

                    allProblems.push(row);
                    seenIds.add(id);
                });
            }
        });
    }

    console.log(`[${folderName}] Scraped ${allProblems.length} entries.`);
    allProblems.sort((a, b) => a.id - b.id);
    fs.writeFileSync(outputFile, JSON.stringify(allProblems, null, 2));
    console.log(`Written to ${outputFile}`);
}

async function main() {
    console.log('Starting Galaxy Scraper...');

    if (!fs.existsSync(OUTPUT_DATA_DIR)) {
        fs.mkdirSync(OUTPUT_DATA_DIR, { recursive: true });
    }

    // Scrape Fundamentals (Basics)
    await scrapeFolder('fundamentals', OUTPUT_FUNDAMENTALS_JSON);

    // Scrape Full Practice
    await scrapeFolder('full-practice', OUTPUT_FULL_JSON);
}

main().catch(console.error);
