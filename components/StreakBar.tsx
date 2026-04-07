'use client';

import Link from 'next/link';
import { useStreak } from '@/hooks/useStreak';
import { MOODS } from '@/lib/constants';

export function StreakBar() {
    const streak = useStreak();

    if (streak.length === 0) return null;
    if (!streak.some((d) => d.mood !== null)) return null;

    return (
        <div className="mb-8">
            <h2 className="mb-4 text-sm font-normal text-neutral-400 dark:text-neutral-500">
                Your week
            </h2>
            <div className="thin-border flex items-end justify-between rounded-3xl border border-neutral-200 bg-neutral-50 px-5 py-4 dark:border-neutral-800 dark:bg-neutral-900">
                {streak.map((day) => {
                    const moodData = day.mood !== null ? MOODS[day.mood - 1] : null;
                    return (
                        <div key={day.date} className="flex flex-col items-center gap-2">
                            <Link
                                href={day.isToday ? '/' : `/archive/${day.date}`}
                                className="group flex flex-col items-center gap-2"
                                title={
                                    moodData
                                        ? `${day.date} — ${moodData.label}`
                                        : `${day.date} — no vote`
                                }
                            >
                                <div
                                    className="h-3 w-3 rounded-full transition-opacity group-hover:opacity-70"
                                    style={{
                                        backgroundColor: moodData ? moodData.color : '#404040',
                                        boxShadow:
                                            day.isToday && moodData
                                                ? `0 0 0 2px ${moodData.color}33`
                                                : undefined,
                                    }}
                                />
                                <span
                                    className="text-[10px] font-normal"
                                    style={{
                                        color: day.isToday ? undefined : undefined,
                                    }}
                                >
                                    <span className={day.isToday
                                        ? 'text-neutral-800 dark:text-neutral-200'
                                        : 'text-neutral-400 dark:text-neutral-600'
                                    }>
                                        {day.dayLabel}
                                    </span>
                                </span>
                            </Link>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
