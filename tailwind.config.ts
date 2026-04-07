import type { Config } from 'tailwindcss';

const config: Config = {
    darkMode: 'class',
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                mood: {
                    awful: '#E24B4A',
                    awfulBg: '#FCEBEB',
                    awfulDark: '#A32D2D',
                    bad: '#D85A30',
                    badBg: '#FAECE7',
                    badDark: '#712B13',
                    okay: '#EF9F27',
                    okayBg: '#FAEEDA',
                    okayDark: '#633806',
                    good: '#1D9E75',
                    goodBg: '#E1F5EE',
                    goodDark: '#085041',
                    great: '#0F6E56',
                    greatBg: '#E1F5EE',
                    greatDark: '#04342C',
                },
            },
        },
    },
    plugins: [],
};

export default config;
