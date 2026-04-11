'use client';

import { useEffect, useState } from 'react';
import { VoteScreen } from '@/components/VoteScreen';
import { ResultsScreen } from '@/components/ResultsScreen';
import { useVoteState } from '@/hooks/useVoteState';

export default function Home() {
    const { hasVoted, myMood, myCountry, markVoted } = useVoteState();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleVoteSubmit = async (mood: number, note: string) => {
        // Detect country
        let country: string | null = null;
        try {
            const res = await fetch('https://ipapi.co/json/');
            const data = await res.json();
            country = data.country_code || null;
        } catch {
            // Country detection failed, continue without it
        }

        // Submit vote
        const response = await fetch('/api/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mood, note: note || null, country }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to submit vote');
        }

        markVoted(mood, country);
    };

    if (!isClient) return null;

    return hasVoted ? (
        <ResultsScreen myMood={myMood} />
    ) : (
        <VoteScreen onVoteSubmit={handleVoteSubmit} />
    );
}
