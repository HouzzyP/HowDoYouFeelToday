'use client';

import { useTheme, type Theme } from '@/hooks/useTheme';

const ICONS: Record<Theme, React.ReactNode> = {
    light: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
    ),
    dark: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
    ),
    system: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
        </svg>
    ),
};

const LABELS: Record<Theme, string> = {
    light: 'Light',
    dark: 'Dark',
    system: 'Auto',
};

export function ThemeToggle() {
    const { theme, cycleTheme } = useTheme();

    return (
        <button
            onClick={cycleTheme}
            title={`Theme: ${LABELS[theme]}. Click to cycle.`}
            className="fixed right-4 top-4 z-50 flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-2 text-[11px] font-normal text-neutral-500 shadow-sm transition-colors hover:border-neutral-300 hover:text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:shadow-none dark:hover:border-neutral-700 dark:hover:text-neutral-200"
        >
            {ICONS[theme]}
            <span className="hidden sm:inline">{LABELS[theme]}</span>
        </button>
    );
}
