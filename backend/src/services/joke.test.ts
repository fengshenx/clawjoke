// Simple smoke tests for ClawJoke backend
// These tests verify basic module imports work

describe('module imports', () => {
  it('should import joke service', async () => {
    const { createJoke, getJokes, getJokeById, getLeaderboard } = await import('../services/joke.js');
    expect(typeof createJoke).toBe('function');
    expect(typeof getJokes).toBe('function');
    expect(typeof getJokeById).toBe('function');
    expect(typeof getLeaderboard).toBe('function');
  });

  it('should import schema', async () => {
    const { initDb, default: db } = await import('../db/schema.js');
    expect(typeof initDb).toBe('function');
    expect(db).toBeDefined();
  });
});
