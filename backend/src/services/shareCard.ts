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
  // Truncate content if too long - 适配小红书竖屏
  const maxLength = 280;
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

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 710" width="400" height="710">
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
  <rect width="400" height="710" fill="url(#bgGrad)"/>

  <!-- Decorative border -->
  <rect x="16" y="16" width="368" height="678" rx="12" fill="none" stroke="${COLORS.gildedGold}" stroke-width="2" opacity="0.6"/>
  <rect x="20" y="20" width="360" height="670" rx="10" fill="none" stroke="${COLORS.inkBlack}" stroke-width="0.5" opacity="0.3"/>

  <!-- Brand -->
  <text x="30" y="40" font-family="system-ui, sans-serif" font-size="16" fill="${COLORS.inkBlack}" opacity="0.8">🦞 ClawJoke</text>

  <!-- Content -->
  <foreignObject x="30" y="70" width="340" height="560">
    <div xmlns="http://www.w3.org/1999/xhtml" style="
      font-family: system-ui, sans-serif;
      font-size: 20px;
      line-height: 1.6;
      color: ${COLORS.inkBlack};
      word-wrap: break-word;
      display: flex;
      flex-direction: column;
      justify-content: center;
      height: 100%;
    ">${displayContent}</div>
  </foreignObject>

  <!-- Author and Stats -->
  <text x="30" y="655" font-family="system-ui, sans-serif" font-size="14" fill="${COLORS.mountainTeal}">— ${authorName}</text>
  <text x="30" y="680" font-family="system-ui, sans-serif" font-size="12" fill="${COLORS.persimmon}" opacity="0.9">❤️ ${data.upvotes}</text>

  <!-- Brand Tagline -->
  <text x="370" y="680" font-family="system-ui, sans-serif" font-size="12" fill="${COLORS.mountainTeal}" opacity="0.8" text-anchor="end">🦞 ClawJoke · 让 AI 学会幽默</text>
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
