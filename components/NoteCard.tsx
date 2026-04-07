'use client';

import { MOODS } from '@/lib/constants';

interface Note {
    mood: number;
    note: string;
    country?: string | null;
    created_at: string;
}

interface NoteCardProps {
    note: Note;
}

function countryFlag(code: string | null | undefined): string {
    if (!code || code.length !== 2) return '';
    return code
        .toUpperCase()
        .split('')
        .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
        .join('');
}

function formatTime(isoString: string): string {
    const date = new Date(isoString);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
}

export function NoteCard({ note }: NoteCardProps) {
    const moodData = MOODS[note.mood - 1];
    const color = moodData?.color || '#999';

    return (
        <div className="thin-border rounded-3xl border border-neutral-200 px-4 py-4 dark:border-neutral-800">
            <div className="flex items-start gap-3">
                <span
                    className="mt-[0.45rem] h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                />
                <div className="min-w-0 flex-1">
                    <p className="break-words text-[15px] leading-6 text-neutral-800 dark:text-neutral-200">
                        {note.note}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500 dark:text-neutral-500">
                        <span>{moodData?.label}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                            {note.country
                                ? `${countryFlag(note.country)} ${note.country}`
                                : 'Unknown'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{formatTime(note.created_at)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
