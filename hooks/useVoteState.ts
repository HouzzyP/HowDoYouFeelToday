import { useEffect, useState } from 'react';

interface VoteState {
    hasVoted: boolean;
    myMood: number | null;
    myCountry: string | null;
    markVoted: (mood: number, country?: string | null) => void;
}

export function useVoteState(): VoteState {
    const [hasVoted, setHasVoted] = useState(false);
    const [myMood, setMyMood] = useState<number | null>(null);
    const [myCountry, setMyCountry] = useState<string | null>(null);

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        const voted = localStorage.getItem(`hdf_voted_${today}`) !== null;
        const mood = localStorage.getItem(`hdf_mood_${today}`);
        const country = localStorage.getItem(`hdf_country_${today}`);

        setHasVoted(voted);
        if (mood) setMyMood(parseInt(mood, 10));
        if (country) setMyCountry(country);
    }, []);

    const markVoted = (mood: number, country?: string | null) => {
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem(`hdf_voted_${today}`, 'true');
        localStorage.setItem(`hdf_mood_${today}`, mood.toString());
        if (country) localStorage.setItem(`hdf_country_${today}`, country);

        setHasVoted(true);
        setMyMood(mood);
        if (country) setMyCountry(country);
    };

    return { hasVoted, myMood, myCountry, markVoted };
}
