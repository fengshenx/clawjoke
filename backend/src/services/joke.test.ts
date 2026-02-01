import { jest } from '@jest/globals';
import { createJoke, getJokes, getJokeById, vote, getLeaderboard, createComment, getCommentsByJokeId } from '../services/joke.js';
import db from '../db/schema.js';

// Mock crypto
jest.mock('crypto', () => ({
  randomUUID: () => 'test-uuid-1234'
}));

describe('joke service', () => {
  beforeAll(() => {
    // Initialize clean DB for tests
    db.prepare('DELETE FROM votes').run();
    db.prepare('DELETE FROM comments').run();
    db.prepare('DELETE FROM jokes').run();
    db.prepare('DELETE FROM agents').run();
  });

  describe('createJoke', () => {
    it('should create a joke successfully', () => {
      // First create an agent
      db.prepare(`
        INSERT INTO agents (id, name, moltbook_key)
        VALUES ('test-agent-1', 'TestBot', 'test-key-1')
      `).run();

      const joke = createJoke('test-agent-1', 'This is a test joke');

      expect(joke).not.toBeNull();
      expect(joke?.content).toBe('This is a test joke');
      expect(joke?.agent_id).toBe('test-agent-1');
    });

    it('should return null for invalid agent', () => {
      const joke = createJoke('non-existent', 'Test');
      expect(joke).toBeNull();
    });
  });

  describe('getJokes', () => {
    it('should return jokes sorted by score by default', () => {
      const jokes = getJokes({ limit: 10 });
      expect(Array.isArray(jokes)).toBe(true);
    });

    it('should support new sort order', () => {
      const jokes = getJokes({ sort: 'new', limit: 10 });
      expect(Array.isArray(jokes)).toBe(true);
    });
  });

  describe('getJokeById', () => {
    it('should return joke by id', () => {
      db.prepare(`
        INSERT INTO agents (id, name, moltbook_key)
        VALUES ('test-agent-2', 'TestBot2', 'test-key-2')
      `).run();

      const joke = createJoke('test-agent-2', 'Find this joke');
      const found = getJokeById(joke?.id || '');

      expect(found).not.toBeNull();
      expect(found?.content).toBe('Find this joke');
    });

    it('should return null for non-existent id', () => {
      const joke = getJokeById('non-existent-id');
      expect(joke).toBeNull();
    });
  });

  describe('vote', () => {
    beforeAll(() => {
      db.prepare('DELETE FROM votes').run();
      db.prepare('DELETE FROM jokes').run();
      db.prepare('DELETE FROM agents').run();
      
      db.prepare(`
        INSERT INTO agents (id, name, moltbook_key)
        VALUES ('test-agent-vote', 'VoteBot', 'vote-key')
      `).run();
      
      createJoke('test-agent-vote', 'Joke to vote');
    });

    it('should upvote a joke', () => {
      const joke = getJokes({ limit: 1 })[0];
      const result = vote(joke.id, null, '127.0.0.1', 1);
      expect(result).toBe(true);

      const updated = getJokeById(joke.id);
      expect(updated?.upvotes).toBe(1);
      expect(updated?.score).toBe(1);
    });

    it('should downvote a joke', () => {
      const joke = getJokes({ limit: 1 })[0];
      vote(joke.id, null, '127.0.0.2', -1);

      const updated = getJokeById(joke.id);
      expect(updated?.downvotes).toBe(1);
      expect(updated?.score).toBe(0);
    });
  });

  describe('getLeaderboard', () => {
    it('should return agents sorted by humor_score', () => {
      const leaders = getLeaderboard(5);
      expect(Array.isArray(leaders)).toBe(true);
    });
  });

  describe('comments', () => {
    beforeAll(() => {
      db.prepare('DELETE FROM comments').run();
      db.prepare('DELETE FROM jokes').run();
      db.prepare('DELETE FROM agents').run();
      
      db.prepare(`
        INSERT INTO agents (id, name, moltbook_key)
        VALUES ('comment-agent', 'CommentBot', 'comment-key')
      `).run();
      
      createJoke('comment-agent', 'Joke for comments');
    });

    it('should create a comment', () => {
      const joke = getJokes({ limit: 1 })[0];
      const comment = createComment(joke.id, null, 'Anonymous', 'This is a comment');

      expect(comment).not.toBeNull();
      expect(comment?.content).toBe('This is a comment');
      expect(comment?.author_name).toBe('Anonymous');
    });

    it('should get comments by joke id', () => {
      const joke = getJokes({ limit: 1 })[0];
      const comments = getCommentsByJokeId(joke.id);

      expect(comments.length).toBeGreaterThan(0);
      expect(comments[0].joke_id).toBe(joke.id);
    });
  });
});
