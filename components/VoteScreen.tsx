'use client';

import { useState } from 'react';
import { MOODS, NOTE_MAX_CHARS } from '@/lib/constants';
import { useTheme } from '@/hooks/useTheme';
import { useStreak } from '@/hooks/useStreak';

interface VoteScreenProps {
    onVoteSubmit: (mood: number, note: string) => Promise<void>;
}

export function VoteScreen({ onVoteSubmit }: VoteScreenProps) {
    const [selectedMood, setSelectedMood] = useState<number | null>(null);
    const [note, setNote] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { isDark } = useTheme();
    const streak = useStreak();

    // Streak computation (excluding today — they haven't voted yet)
    const prevDays = streak.filter((d) => !d.isToday);
    let streakCount = 0;
    for (let i = prevDays.length - 1; i >= 0; i--) {
        if (prevDays[i].mood !== null) streakCount++;
        else break;
    }
    const hasStreakHistory = prevDays.some((d) => d.mood !== null);

    const selectedMoodData = selectedMood ? MOODS[selectedMood - 1] : null;

    const handleSubmit = async () => {
        if (selectedMood === null) return;
        setIsLoading(true);
        setError(null);
        try {
            await onVoteSubmit(selectedMood, note);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to submit vote. Please try again.'
            );
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen px-4 py-8 sm:py-12">
            <div className="app-shell flex min-h-[calc(100vh-4rem)] flex-col justify-center">
                <div className="mb-12 text-center">
                    <p className="mb-4 text-[11px] font-normal uppercase text-neutral-400 dark:text-neutral-500">
                        HOWDOYOUFEELTODAY
                    </p>
                    <h1 className="font-serif text-[28px] font-normal leading-[1.08] text-neutral-950 dark:text-neutral-50 sm:text-[34px]">
                        How do you feel today?
                    </h1>
                    <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-neutral-500 dark:text-neutral-400 sm:text-[15px]">
                        One tap, one note, one global snapshot.
                    </p>
                </div>

                {/* Streak strip — only shown if user has voted at least once before */}
                {hasStreakHistory && (
                    <div className="mb-8">
                        <div className="thin-border flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="flex items-center gap-2">
                                {streak.map((day) => {
                                    const moodData =
                                        day.mood !== null ? MOODS[day.mood - 1] : null;
                                    return (
                                        <div
                                            key={day.date}
                                            className="h-2.5 w-2.5 rounded-full transition-opacity"
                                            style={{
                                                backgroundColor: moodData
                                                    ? moodData.color
                                                    : isDark
                                                    ? '#404040'
                                                    : '#d4d4d4',
                                                opacity: day.isToday ? 0.35 : 1,
                                            }}
                                            title={`${day.dayLabel}${moodData ? ` — ${moodData.label}` : ''}`}
                                        />
                                    );
                                })}
                            </div>
                            <span className="shrink-0 text-[12px] text-neutral-500 dark:text-neutral-400">
                                {streakCount >= 2
                                    ? `${streakCount}-day streak`
                                    : streakCount === 1
                                    ? 'Voted yesterday'
                                    : 'Restart your streak'}
                            </span>
                        </div>
                    </div>
                )}

                <div className="mb-8 grid grid-cols-5 gap-2 sm:gap-3">
                    {MOODS.map((mood, index) => {
                        const moodValue = index + 1;
                        const isSelected = selectedMood === moodValue;

                        return (
                            <button
                                key={moodValue}
                                type="button"
                                onClick={() => setSelectedMood(moodValue)}
                                className="thin-border flex min-h-[92px] flex-col items-center justify-center rounded-2xl border px-2 py-3 text-center transition-colors duration-150"
                                style={{
                                    backgroundColor: isSelected
                                        ? isDark
                                            ? `${mood.color}18`
                                            : mood.bg
                                        : isDark
                                        ? 'transparent'
                                        : '#ffffff',
                                    borderColor: isSelected
                                        ? mood.color
                                        : isDark
                                        ? '#404040'
                                        : '#e5e5e5',
                                }}
                                aria-pressed={isSelected}
                            >
                                <span
                                    className="mb-3 h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: mood.color }}
                                />
                                <span
                                    className="text-[12px] font-normal leading-4 sm:text-[13px]"
                                    style={{
                                        color: isSelected
                                            ? mood.color
                                            : isDark
                                            ? '#a3a3a3'
                                            : '#525252',
                                    }}
                                >
                                    {mood.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="mb-4">
                    <label className="mb-2 block text-[12px] font-normal text-neutral-400 dark:text-neutral-500">
                        Optional note
                    </label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX_CHARS))}
                        placeholder="Tell the world a little more."
                        maxLength={NOTE_MAX_CHARS}
                        rows={5}
                        className="thin-border min-h-[148px] w-full resize-none rounded-3xl border border-neutral-200 bg-white px-5 py-4 text-[15px] leading-6 text-neutral-800 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:placeholder:text-neutral-600 dark:focus:border-neutral-600"
                    />
                    <div className="mt-2 text-right text-xs text-neutral-400 dark:text-neutral-600">
                        {note.length}/{NOTE_MAX_CHARS}
                    </div>
                </div>

                {error && (
                    <div className="thin-border mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
                        {error}
                    </div>
                )}

                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={selectedMood === null || isLoading}
                    className="mt-2 w-full rounded-full px-5 py-4 text-sm font-medium text-white transition-colors duration-150 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-600"
                    style={{
                        backgroundColor:
                            selectedMoodData && !isLoading ? selectedMoodData.color : undefined,
                    }}
                >
                    {isLoading ? 'Submitting...' : 'See the world mood'}
                </button>

                <p className="mt-6 text-center text-xs text-neutral-400 dark:text-neutral-600">
                    Anonymous. No login. No tracking.
                </p>
            </div>
        </div>
    );
}
