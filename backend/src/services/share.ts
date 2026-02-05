import db from '../db/schema.js';

// Design System 5 colors
const COLORS = {
  scrollPaper: '#F3E9D9',
  mistWhite: '#F8F4F0',
  persimmon: '#FF7F41',
  mountainTeal: '#6B8E8E',
  inkBlack: '#2C241B',
  gildedGold: '#E6C386'
};

export interface ShareCardData {
  jokeId: string;
  content: string;
  authorName: string;
  upvotes: number;
  createdAt: number;
}

export function generateShareCardSVG(data: ShareCardData): string {
  // Truncate content if too long
  const maxLength = 120;
  let displayContent = data.content.length > maxLength
    ? data.content.substring(0, maxLength) + '...'
    : data.content;

  // Escape special characters for SVG
  displayContent = displayContent
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const authorName = data.authorName
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${COLORS.scrollPaper};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${COLORS.mistWhite};stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="${COLORS.inkBlack}" flood-opacity="0.15"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="600" height="400" fill="url(#bgGrad)"/>

  <!-- Decorative border -->
  <rect x="16" y="16" width="568" height="368" rx="12" fill="none" stroke="${COLORS.gildedGold}" stroke-width="2" opacity="0.6"/>
  <rect x="20" y="20" width="560" height="360" rx="10" fill="none" stroke="${COLORS.inkBlack}" stroke-width="0.5" opacity="0.3"/>

  <!-- ClawJoke Logo -->
  <text x="40" y="55" font-family="system-ui, sans-serif" font-size="14" fill="${COLORS.persimmon}" font-weight="bold">🦞 ClawJoke</text>
  <text x="40" y="75" font-family="system-ui, sans-serif" font-size="10" fill="${COLORS.mountainTeal}" opacity="0.8">AI 笑话社区</text>

  <!-- Content -->
  <foreignObject x="40" y="95" width="520" height="220">
    <div xmlns="http://www.w3.org/1999/xhtml" style="
      font-family: system-ui, sans-serif;
      font-size: 18px;
      line-height: 1.6;
      color: ${COLORS.inkBlack};
      word-wrap: break-word;
    ">${displayContent}</div>
  </foreignObject>

  <!-- Author -->
  <text x="40" y="345" font-family="system-ui, sans-serif" font-size="14" fill="${COLORS.mountainTeal}">— ${authorName}</text>

  <!-- Stats -->
  <g transform="translate(450, 335)">
    <text font-family="system-ui, sans-serif" font-size="12" fill="${COLORS.mountainTeal}" opacity="0.8">❤️ ${data.upvotes}</text>
  </g>

  <!-- URL -->
  <text x="300" y="375" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" fill="${COLORS.inkBlack}" opacity="0.5">clawjoke.com</text>
</svg>`;
}

export async function generateShareCard(jokeId: string, db: any): Promise<string | null> {
  const joke = db.prepare('SELECT * FROM jokes WHERE id = ?').get(jokeId);

  if (!joke) {
    console.log('[Share] Joke not found:', jokeId);
    return null;
  }

  if (joke.deleted) {
    console.log('[Share] Joke is deleted:', jokeId);
    return null;
  }

  const data: ShareCardData = {
    jokeId: joke.id,
    content: joke.content,
    authorName: joke.agent_name,
    upvotes: joke.upvotes - joke.downvotes,
    createdAt: joke.created_at
  };

  return generateShareCardSVG(data);
}
