'use client';

import { useEffect, useState, useCallback } from 'react';
import { Gauge } from './Gauge';
import { MoodBar } from './MoodBar';
import { NoteCard } from './NoteCard';
import { WordCloud } from './WordCloud';
import { MoodHeatmap } from './MoodHeatmap';
import { PushPrompt } from './PushPrompt';
import { MOODS, COLD_START_THRESHOLD } from '@/lib/constants';
import { useTheme } from '@/hooks/useTheme';

interface StatsResponse {
    total: number;
    avg: number;
    counts: number[];
    notes: Array<{
        mood: number;
        note: string;
        country: string | null;
        created_at: string;
    }>;
    history: Array<{
        date: string;
        avg: number;
        total: number;
    }>;
}

interface ResultsScreenProps {
    myMood: number | null;
    myCountry?: string | null;
    /** Pass a past date (YYYY-MM-DD) to render archive mode */
    date?: string;
}


export function ResultsScreen({ myMood, date }: ResultsScreenProps) {
    const [stats, setStats] = useState<StatsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [visible, setVisible] = useState(false);
    const [countryFilter] = useState<string | null>(null);
    const [shareState, setShareState] = useState<'idle' | 'loading' | 'done'>('idle');
    const [showHeatmap, setShowHeatmap] = useState(false);

    const { isDark } = useTheme();
    const isArchive = Boolean(date);

    const buildApiUrl = useCallback(
        (country: string | null) => {
            const base = date ? `/api/stats?date=${date}` : '/api/stats';
            return country ? `${base}${date ? '&' : '?'}country=${country}` : base;
        },
        [date]
    );

    const fetchStats = useCallback(
        async (country: string | null) => {
            try {
                const response = await fetch(buildApiUrl(country));
                if (!response.ok) throw new Error('Failed to fetch stats');
                const data = await response.json();
                setStats(data);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load results');
            } finally {
                setIsLoading(false);
                requestAnimationFrame(() => setVisible(true));
            }
        },
        [buildApiUrl]
    );

    useEffect(() => {
        setIsLoading(true);
        setVisible(false);
        fetchStats(countryFilter);

        if (!isArchive && !countryFilter) {
            const interval = setInterval(() => fetchStats(null), 30000);
            return () => clearInterval(interval);
        }
    }, [fetchStats, isArchive, countryFilter]);

    const handleShare = async () => {
        if (!myMood || !stats) return;
        setShareState('loading');

        const today = new Date().toISOString().split('T')[0];
        const targetDate = date || today;
        const params = new URLSearchParams({
            mood: String(myMood),
            avg: String(stats.avg),
            total: String(stats.total),
            date: targetDate,
        });
        const cardUrl = `/api/share-card?${params}`;

        try {
            const res = await fetch(cardUrl);
            const blob = await res.blob();
            const file = new File([blob], `mood-${targetDate}.png`, { type: 'image/png' });

            if (navigator.canShare?.({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'How Do You Feel Today?',
                    text: `I felt ${MOODS[myMood - 1]?.label} today. The world average: ${stats.avg.toFixed(1)}/5`,
                });
            } else {
                // Fallback: download the image
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `mood-${targetDate}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 100);
            }
        } catch (err) {
            // Only silence user-cancelled share (AbortError), log real errors
            if (err instanceof Error && err.name !== 'AbortError') {
                console.error('Share error:', err);
            }
        } finally {
            setShareState('done');
            setTimeout(() => setShareState('idle'), 2000);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen px-4 py-8 sm:py-12">
                <div className="app-shell flex min-h-[calc(100vh-4rem)] items-center justify-center">
                    <div className="text-center">
                        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border border-neutral-300 border-t-neutral-700 dark:border-neutral-700 dark:border-t-neutral-300" />
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Loading world mood...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="min-h-screen px-4 py-8 sm:py-12">
                <div className="app-shell flex min-h-[calc(100vh-4rem)] items-center justify-center">
                    <div className="text-center">
                        <p className="mb-4 text-sm text-red-600 dark:text-red-400">
                            {error || 'Failed to load results'}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="thin-border rounded-full border border-neutral-300 px-4 py-2 text-sm text-neutral-700 dark:border-neutral-700 dark:text-neutral-300"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const showVoteCount = stats.total >= COLD_START_THRESHOLD;

    const formattedDate = date
        ? new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
        : null;

    const ambientMoodIndex =
        stats && stats.avg > 0
            ? Math.min(Math.max(Math.round(stats.avg) - 1, 0), 4)
            : null;
    const ambientColor = ambientMoodIndex !== null ? MOODS[ambientMoodIndex].color : null;

    return (
        <div
            className="min-h-screen px-4 py-8 sm:py-12"
            style={{
                opacity: visible ? 1 : 0,
                transition: 'opacity 150ms ease-in',
                ...(ambientColor
                    ? {
                          background: `radial-gradient(ellipse 120% 45% at 50% 0%, ${ambientColor}${isDark ? '1a' : '0e'} 0%, transparent 65%)`,
                      }
                    : {}),
            }}
        >
            <div className="app-shell">
                {/* Header */}
                <div className="mb-8 text-center">
                    <p className="mb-3 text-[11px] font-normal uppercase text-neutral-400 dark:text-neutral-500">
                        HOWDOYOUFEELTODAY
                    </p>
                    <h1 className="font-editorial text-[2.15rem] font-normal leading-[1.04] tracking-[-0.03em] text-neutral-950 dark:text-neutral-50 sm:text-[2.9rem]">
                        {isArchive ? 'How the world felt' : 'Here\u2019s how the world feels'}
                    </h1>
                    {isArchive && formattedDate && (
                        <p className="mt-2 text-sm font-normal text-neutral-500 dark:text-neutral-400">
                            {formattedDate}
                        </p>
                    )}
                    {!isArchive && (
                        <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
                            Updated{' '}
                            {new Date().toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                            })}
                        </p>
                    )}
                </div>

                {/* Country filter — reserved for v3 once traffic warrants it */}

                {/* Gauge */}
                <div className="mb-8">
                    <Gauge average={stats.avg} />
                </div>

                {/* Personal resonance — qualitative, only post-vote */}
                {myMood && !isArchive && stats.total > 0 && (() => {
                    const pct = (stats.counts[myMood - 1] / stats.total) * 100;
                    const qualifier =
                        pct > 50 ? 'Most people' :
                        pct > 30 ? 'Many people' :
                        pct > 15 ? 'Some people' :
                        pct > 5  ? 'A few people' :
                                   'Hardly anyone';
                    return (
                        <p className="mb-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                            {qualifier} felt{' '}
                            <span
                                className="font-medium"
                                style={{ color: MOODS[myMood - 1].color }}
                            >
                                {MOODS[myMood - 1].label}
                            </span>
                            {' '}today — just like you.
                        </p>
                    );
                })()}

                {/* Daily reminder prompt — right after the emotional hook */}
                {!isArchive && <PushPrompt />}

                {/* Stat cards */}
                <div className="mb-8 grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="thin-border rounded-3xl border border-neutral-200 bg-neutral-50 px-3 py-4 text-center dark:border-neutral-800 dark:bg-neutral-900 sm:px-4">
                        <div className="text-[1.7rem] font-medium text-neutral-950 dark:text-neutral-50 sm:text-[2rem]">
                            {showVoteCount ? stats.total.toLocaleString() : '\u2022\u2022\u2022'}
                        </div>
                        <div className="mt-1 text-[11px] font-normal text-neutral-400 dark:text-neutral-500">
                            Voices today
                        </div>
                    </div>
                    <div className="thin-border rounded-3xl border border-neutral-200 bg-neutral-50 px-3 py-4 text-center dark:border-neutral-800 dark:bg-neutral-900 sm:px-4">
                        <div className="text-[1.7rem] font-medium text-neutral-950 dark:text-neutral-50 sm:text-[2rem]">
                            {stats.avg > 0 ? stats.avg.toFixed(1) : '\u2014'}
                        </div>
                        <div className="mt-1 text-[11px] font-normal text-neutral-400 dark:text-neutral-500">
                            World average
                        </div>
                    </div>
                </div>

                {/* Breakdown */}
                <div className="mb-8">
                    {MOODS.map((mood, index) => (
                        <MoodBar
                            key={index}
                            label={mood.label}
                            percentage={
                                stats.total > 0 ? (stats.counts[index] / stats.total) * 100 : 0
                            }
                            count={stats.counts[index]}
                            color={mood.color}
                            showCount={showVoteCount}
                        />
                    ))}
                </div>

                {/* Word cloud — only when there are enough notes to be meaningful */}
                {stats.notes.length >= 10 && (
                    <WordCloud notes={stats.notes} />
                )}

                {/* Notes feed */}
                <div className="mb-12">
                    {stats.notes.length > 0 ? (
                        <div className="space-y-3">
                            {stats.notes.map((note, index) => (
                                <NoteCard key={index} note={note} />
                            ))}
                        </div>
                    ) : (
                        <p className="rounded-3xl bg-neutral-50 px-5 py-6 text-sm text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
                            {isArchive
                                ? 'No notes were shared on this day.'
                                : 'No notes yet. Be the first to share how today feels.'}
                        </p>
                    )}
                </div>

                {/* History trigger + modal */}
                {!isArchive && (
                    <>
                        <div className="mb-8 text-center">
                            <button
                                onClick={() => setShowHeatmap(true)}
                                className="text-[13px] text-neutral-400 transition-colors hover:text-neutral-600 dark:text-neutral-600 dark:hover:text-neutral-400"
                            >
                                View your history
                            </button>
                        </div>

                        {showHeatmap && (
                            <div
                                className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center"
                                onClick={() => setShowHeatmap(false)}
                            >
                                <div
                                    className="w-full max-w-lg rounded-3xl bg-white p-6 dark:bg-neutral-950"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="mb-4 flex items-center justify-between">
                                        <span className="text-sm font-normal text-neutral-400 dark:text-neutral-500">
                                            Your history
                                        </span>
                                        <button
                                            onClick={() => setShowHeatmap(false)}
                                            className="text-neutral-400 transition-colors hover:text-neutral-700 dark:hover:text-neutral-200"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <MoodHeatmap />
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Bottom actions */}
                <div className="pb-4 flex flex-col items-center gap-3">
                    {/* Share mood card — only if user voted */}
                    {myMood && !isArchive && (
                        <button
                            onClick={handleShare}
                            disabled={shareState === 'loading'}
                            className="thin-border flex items-center gap-2 rounded-full border border-neutral-300 px-5 py-3 text-sm font-normal text-neutral-700 transition-colors hover:border-neutral-400 hover:text-neutral-950 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-500 dark:hover:text-neutral-100"
                        >
                            {shareState === 'loading' && (
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent" />
                            )}
                            {shareState === 'done' ? 'Saved!' : 'Share your mood'}
                        </button>
                    )}

                    {isArchive ? (
                        <a
                            href="/"
                            className="thin-border rounded-full border border-neutral-300 px-5 py-3 text-sm font-normal text-neutral-700 transition-colors hover:border-neutral-400 hover:text-neutral-950 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-500 dark:hover:text-neutral-100"
                        >
                            Back to today
                        </a>
                    ) : process.env.NODE_ENV === 'development' ? (
                        <button
                            onClick={() => {
                                const today = new Date().toISOString().split('T')[0];
                                localStorage.removeItem(`hdf_voted_${today}`);
                                localStorage.removeItem(`hdf_mood_${today}`);
                                localStorage.removeItem(`hdf_country_${today}`);
                                window.location.reload();
                            }}
                            className="thin-border rounded-full border border-neutral-300 px-5 py-3 text-sm font-normal text-neutral-700 transition-colors hover:border-neutral-400 hover:text-neutral-950 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-500 dark:hover:text-neutral-100"
                        >
                            Vote again
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
