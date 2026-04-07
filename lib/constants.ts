export const MOODS = [
    {
        label: 'Awful',
        color: '#E24B4A',
        bg: '#FCEBEB',
        dark: '#A32D2D',
    },
    {
        label: 'Bad',
        color: '#D85A30',
        bg: '#FAECE7',
        dark: '#712B13',
    },
    {
        label: 'Okay',
        color: '#EF9F27',
        bg: '#FAEEDA',
        dark: '#633806',
    },
    {
        label: 'Good',
        color: '#1D9E75',
        bg: '#E1F5EE',
        dark: '#085041',
    },
    {
        label: 'Great',
        color: '#0F6E56',
        bg: '#E1F5EE',
        dark: '#04342C',
    },
] as const;

export const COLD_START_THRESHOLD = 50;
export const NOTE_MAX_CHARS = 280;
export const NOTES_FEED_LIMIT = 20;

export const MOOD_COLORS = {
    1: MOODS[0].color,
    2: MOODS[1].color,
    3: MOODS[2].color,
    4: MOODS[3].color,
    5: MOODS[4].color,
} as const;

export const MOOD_LABELS = {
    1: MOODS[0].label,
    2: MOODS[1].label,
    3: MOODS[2].label,
    4: MOODS[3].label,
    5: MOODS[4].label,
} as const;
