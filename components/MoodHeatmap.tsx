'use client';

import { useEffect, useState } from 'react';
import { MOODS } from '@/lib/constants';

interface HeatmapDay {
    date: string;
    mood: number | null;
    isToday: boolean;
    isPadding: boolean;
}

export function MoodHeatmap() {
    const [days, setDays] = useState<HeatmapDay[]>([]);

    useEffect(() => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        // Mon-based dow: Mon=0 … Sun=6
        const todayDow = (today.getDay() + 6) % 7;

        // Start from Monday 4 full weeks ago
        const start = new Date(today);
        start.setDate(today.getDate() - todayDow - 28);

        const result: HeatmapDay[] = [];
        const cursor = new Date(start);

        while (cursor <= today) {
            const dateStr = cursor.toISOString().split('T')[0];
            const moodRaw = localStorage.getItem(`hdf_mood_${dateStr}`);
            result.push({
                date: dateStr,
                mood: moodRaw ? parseInt(moodRaw, 10) : null,
                isToday: dateStr === todayStr,
                isPadding: false,
            });
            cursor.setDate(cursor.getDate() + 1);
        }

        // Pad the current week to complete the 7-column grid
        const rem = result.length % 7;
        if (rem > 0) {
            for (let i = 0; i < 7 - rem; i++) {
                result.push({ date: '', mood: null, isToday: false, isPadding: true });
            }
        }

        setDays(result);
    }, []);

    if (days.length === 0) return null;

    const totalVotes = days.filter((d) => d.mood !== null && !d.isPadding).length;
    if (totalVotes === 0) return null;

    const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    return (
        <div className="mb-8">
            <div className="mb-4 flex items-baseline justify-between">
                <h2 className="text-sm font-normal text-neutral-400 dark:text-neutral-500">
                    Last 4 weeks
                </h2>
                <span className="text-[11px] text-neutral-400 dark:text-neutral-600">
                    {totalVotes} {totalVotes === 1 ? 'day' : 'days'} tracked
                </span>
            </div>

            <div className="thin-border rounded-3xl border border-neutral-200 bg-neutral-50 px-5 py-4 dark:border-neutral-800 dark:bg-neutral-900">
                {/* Day-of-week headers */}
                <div className="mb-2 grid grid-cols-7 gap-1">
                    {DAY_LABELS.map((label, i) => (
                        <div
                            key={i}
                            className="text-center text-[10px] text-neutral-400 dark:text-neutral-600"
                        >
                            {label}
                        </div>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 gap-1">
                    {days.map((day, i) => {
                        const moodData =
                            day.mood !== null && !day.isPadding
                                ? MOODS[day.mood - 1]
                                : null;

                        return (
                            <div
                                key={i}
                                className="aspect-square rounded-md"
                                style={{
                                    backgroundColor: moodData
                                        ? moodData.color
                                        : day.isPadding
                                        ? 'transparent'
                                        : '#e5e5e5',
                                    opacity: day.isPadding ? 0 : moodData ? 1 : 0.3,
                                    outline: day.isToday
                                        ? `2px solid ${moodData ? moodData.color : '#a3a3a3'}`
                                        : undefined,
                                    outlineOffset: day.isToday ? '2px' : undefined,
                                }}
                                title={
                                    day.date
                                        ? day.date +
                                          (moodData ? ` — ${moodData.label}` : '')
                                        : undefined
                                }
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
