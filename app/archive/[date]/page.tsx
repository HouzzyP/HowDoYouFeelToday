'use client';

import { useParams } from 'next/navigation';
import { ResultsScreen } from '@/components/ResultsScreen';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export default function ArchivePage() {
    const { date } = useParams<{ date: string }>();
    const today = new Date().toISOString().split('T')[0];

    // Redirect to home if date is invalid or in the future
    const isValid = ISO_DATE.test(date) && date < today;

    if (!isValid) {
        return (
            <div className="min-h-screen px-4 py-8">
                <div className="app-shell flex min-h-[calc(100vh-4rem)] items-center justify-center">
                    <div className="text-center">
                        <p className="mb-4 text-sm text-neutral-500">
                            {date >= today
                                ? 'That date is in the future.'
                                : 'Invalid date.'}
                        </p>
                        <a
                            href="/"
                            className="thin-border rounded-full border border-neutral-300 px-4 py-2 text-sm text-neutral-700"
                        >
                            Back to today
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return <ResultsScreen myMood={null} date={date} />;
}
