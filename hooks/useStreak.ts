import { useEffect, useState } from 'react';

export interface StreakDay {
    date: string;          // YYYY-MM-DD
    dayLabel: string;      // 'Mon', 'Tue', …
    mood: number | null;   // 1–5, or null if no vote that day
    isToday: boolean;
}

/**
 * Reads the last 7 calendar days from localStorage and returns a
 * chronological array of StreakDay objects (oldest → newest).
 */
export function useStreak(): StreakDay[] {
    const [streak, setStreak] = useState<StreakDay[]>([]);

    useEffect(() => {
        const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const days: StreakDay[] = [];

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const moodRaw = localStorage.getItem(`hdf_mood_${dateStr}`);

            days.push({
                date: dateStr,
                dayLabel: SHORT_DAYS[d.getDay()],
                mood: moodRaw ? parseInt(moodRaw, 10) : null,
                isToday: i === 0,
            });
        }

        setStreak(days);
    }, []);

    return streak;
}
