/**
 * daily-tweet.js
 *
 * Fetches today's mood stats and prints a ready-to-post tweet.
 * Run with: node scripts/daily-tweet.js
 *
 * Optionally set SITE_URL env var:
 *   SITE_URL=https://howdoyoufeeltoday.today node scripts/daily-tweet.js
 */

const SITE_URL = process.env.SITE_URL || 'https://howdoyoufeeltoday.today';

const MOODS = ['Awful', 'Bad', 'Okay', 'Good', 'Great'];
const MOOD_EMOJI = ['😔', '😕', '😐', '🙂', '😊'];

const TEMPLATES = [
    (mood, avg, total, date) =>
        `The world feels ${mood} today ${MOOD_EMOJI[mood_index(avg)]} · ${avg}/5 average · ${total} voices\n\nHow do you feel? → ${SITE_URL}`,

    (mood, avg, total, date) =>
        `${date} world mood: ${mood} ${MOOD_EMOJI[mood_index(avg)]}\n\n${avg}/5 · ${total} people shared how they feel today\n\n→ ${SITE_URL}`,

    (mood, avg, total, date) =>
        `Today the world feels ${mood} ${MOOD_EMOJI[mood_index(avg)]}\n\nAverage: ${avg}/5 across ${total} anonymous voices.\n\nWhat about you? ${SITE_URL}`,

    (mood, avg, total, date) =>
        `World mood check ·  ${date}\n\n${MOOD_EMOJI[mood_index(avg)]} ${mood} — ${avg}/5\n${total} people have voted so far today.\n\n${SITE_URL}`,
];

function mood_index(avg) {
    return Math.max(0, Math.min(4, Math.round(parseFloat(avg)) - 1));
}

function formatDate() {
    return new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });
}

async function main() {
    try {
        const res = await fetch(`${SITE_URL}/api/stats`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const avg = data.avg?.toFixed(1) ?? '0.0';
        const total = data.total ?? 0;
        const idx = mood_index(avg);
        const mood = MOODS[idx];
        const date = formatDate();

        if (total < 1) {
            console.log('\n⚠️  No votes yet today — too early to post.\n');
            return;
        }

        console.log('\n' + '─'.repeat(60));
        console.log('📊 TODAY\'S STATS');
        console.log('─'.repeat(60));
        console.log(`  Mood:    ${mood} ${MOOD_EMOJI[idx]}`);
        console.log(`  Average: ${avg} / 5`);
        console.log(`  Voices:  ${total}`);
        console.log(`  Date:    ${date}`);
        console.log('─'.repeat(60));

        console.log('\n🐦 TWEET OPTIONS (pick one, copy & paste)\n');

        TEMPLATES.forEach((template, i) => {
            const tweet = template(mood, avg, total, date);
            const chars = tweet.length;
            console.log(`── Option ${i + 1} (${chars} chars) ${ chars > 280 ? '⚠️  TOO LONG' : '✓'} ──`);
            console.log(tweet);
            console.log();
        });

        console.log('─'.repeat(60));
        console.log(`🔗 Post here: https://twitter.com/intent/tweet`);
        console.log('─'.repeat(60) + '\n');

    } catch (err) {
        console.error('\n❌ Error fetching stats:', err.message);
        console.error('Make sure the site is running and reachable.\n');
    }
}

main();
