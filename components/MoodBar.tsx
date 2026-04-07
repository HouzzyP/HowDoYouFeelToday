'use client';

interface MoodBarProps {
    label: string;
    percentage: number;
    count: number;
    color: string;
    showCount: boolean;
}

export function MoodBar({ label, percentage, count, color, showCount }: MoodBarProps) {
    return (
        <div className="mb-4 last:mb-0">
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="font-normal text-neutral-700 dark:text-neutral-300">{label}</span>
                <span className="text-neutral-500 dark:text-neutral-400">
                    {percentage.toFixed(1)}%
                    {showCount && ` (${count})`}
                </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%`, backgroundColor: color }}
                />
            </div>
        </div>
    );
}
