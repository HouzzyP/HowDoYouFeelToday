'use client';

import { useMemo } from 'react';
import { MOODS } from '@/lib/constants';

interface Note {
    mood: number;
    note: string;
}

interface WordCloudProps {
    notes: Note[];
}

// Words too common to be interesting
const STOPWORDS = new Set([
    'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'it', 'they', 'them',
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do',
    'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'just',
    'not', 'so', 'if', 'as', 'by', 'up', 'out', 'no', 'go', 'am', 'im', 'its', 'this',
    'that', 'like', 'feel', 'feeling', 'today', 'day', 'bit', 'very', 'really', 'quite',
    'still', 'about', 'from', 'all', 'what', 'how', 'when', 'there', 'than',
]);

interface WordEntry {
    word: string;
    count: number;
    avgMood: number;
}

function extractWords(notes: Note[]): WordEntry[] {
    const freq: Record<string, { count: number; moodSum: number }> = {};

    for (const { note, mood } of notes) {
        const words = note
            .toLowerCase()
            .replace(/[^a-z\s'-]/g, ' ')
            .split(/\s+/)
            .map((w) => w.replace(/^['-]+|['-]+$/g, ''))
            .filter((w) => w.length >= 3 && !STOPWORDS.has(w));

        for (const word of words) {
            if (!freq[word]) freq[word] = { count: 0, moodSum: 0 };
            freq[word].count += 1;
            freq[word].moodSum += mood;
        }
    }

    return Object.entries(freq)
        .map(([word, { count, moodSum }]) => ({
            word,
            count,
            avgMood: moodSum / count,
        }))
        .filter(({ count }) => count >= 1)
        .sort((a, b) => b.count - a.count)
        .slice(0, 40);
}

function moodColor(avgMood: number): string {
    const idx = Math.max(0, Math.min(4, Math.round(avgMood) - 1));
    return MOODS[idx].color;
}

export function WordCloud({ notes }: WordCloudProps) {
    const words = useMemo(() => extractWords(notes), [notes]);

    if (words.length === 0) return null;

    const maxCount = words[0].count;
    const minCount = words[words.length - 1].count;
    const countRange = Math.max(1, maxCount - minCount);

    return (
        <div className="mb-8">
            <h2 className="mb-4 text-sm font-normal text-neutral-400 dark:text-neutral-500">
                Words
            </h2>
            <div className="thin-border flex flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-3xl border border-neutral-200 px-5 py-6 dark:border-neutral-800">
                {words.map(({ word, count, avgMood }) => {
                    // Font size: 13px (rare) → 28px (most common)
                    const t = (count - minCount) / countRange;
                    const fontSize = 13 + t * 15;
                    const opacity = 0.55 + t * 0.45;
                    const color = moodColor(avgMood);

                    return (
                        <span
                            key={word}
                            title={`${word} · ${count}×`}
                            style={{ fontSize: `${fontSize}px`, color, opacity }}
                            className="cursor-default font-normal leading-tight transition-opacity hover:opacity-100"
                        >
                            {word}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}
