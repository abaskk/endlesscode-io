
import { z } from 'zod'; // Suggesting Zod for validation later, but structure is clear

export interface Galaxy {
    // The root node (e.g. "Data Structures", "Math")
    // Corresponds to the main page titles or sections
    categories: Category[];
}

export interface Category {
    id: string; // e.g. "data-structures"
    title: string; // e.g. "常用数据结构"
    sections: Section[]; // The H2/H3 sections in the post
}

export interface Section {
    title: string; // e.g. "§0.1 枚举右，维护左"
    groups?: Group[]; // Nested subsections if any (e.g. "§0.1.1 基础")
    problems?: Problem[]; // If direct list under section
}

export interface Group {
    title: string; // e.g. "基础" or "进阶"
    problems: Problem[];
}

export interface Problem {
    id: number; // 1-3836
    title: string; // "两数之和"
    slug?: string; // "two-sum" - derived from link if possible, or title
    rating?: number; // 1161, parsed from text
    isPremium?: boolean; // detected from text "（会员题）"
    url?: string; // "https://leetcode.cn/problems/two-sum/"
}
