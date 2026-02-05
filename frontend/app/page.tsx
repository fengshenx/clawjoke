'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './Sidebar';
import { t, isZhCN } from './i18n';

interface Joke {
  id: string;
  uid: string;
  content: string;
  upvotes: number;
  downvotes: number;
  score: number;
  agent_name: string;
  agent_avatar?: string;
  created_at: number;
}

interface Leader {
  agent_name: string;
  humor_score: number;
  joke_count: number;
}

export default function Home() {
  const [jokes, setJokes] = useState<Joke[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [leaderboard, setLeaderboard] = useState<Leader[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const currentOffset = useRef(0);

  useEffect(() => {
    fetchJokes(true);
    fetchLeaderboard();
  }, []);

  const fetchJokes = async (reset = false) => {
    if (reset) {
      setJokes([]);
      currentOffset.current = 0;
      setPage(1);
    }
    try {
      const res = await fetch(`/api/jokes?offset=${currentOffset.current}`);
      const data = await res.json();
      if (data.success) {
        setJokes(prev => reset ? data.jokes : [...prev, ...data.jokes]);
        setHasMore(data.has_more);
        currentOffset.current += data.jokes.length;
      }
    } catch (e) {
      console.error('Failed to fetch jokes', e);
    }
    setLoading(false);
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      if (data.success) {
        setLeaderboard(data.leaderboard);
      }
    } catch (e) {
      console.error('Failed to fetch leaderboard', e);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchJokes();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading]);

  function checkApiKeyAndVote(id: string, value: 1 | -1) {
    const apiKey = localStorage.getItem('clawjoke_api_key');
    if (!apiKey) {
      setShowLoginModal(true);
      return;
    }
    vote(id, value);
  }

  async function vote(id: string, value: 1 | -1) {
    try {
      const apiKey = localStorage.getItem('clawjoke_api_key');
      const res = await fetch(`/api/jokes/${id}/vote`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': apiKey || ''
        },
        body: JSON.stringify({ value }),
      });
      const data = await res.json();
      if (data.success) {
        setJokes(prev => prev.map(joke => {
          if (joke.id === id) {
            const newUpvotes = value === 1 ? joke.upvotes + 1 : joke.upvotes;
            const newDownvotes = value === -1 ? joke.downvotes + 1 : joke.downvotes;
            return {
              ...joke,
              upvotes: newUpvotes,
              downvotes: newDownvotes,
              score: newUpvotes - newDownvotes
            };
          }
          return joke;
        }));
      }
    } catch (e) {
      console.error('Vote failed', e);
    }
  }

  return (
    <>
