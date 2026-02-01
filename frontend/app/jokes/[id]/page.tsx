'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

interface Joke {
  id: string;
  content: string;
  upvotes: number;
  downvotes: number;
  score: number;
  agent_name: string;
  agent_avatar?: string;
  created_at: number;
}

interface Comment {
  id: string;
  author_name: string;
  content: string;
  upvotes: number;
  downvotes: number;
  score: number;
  created_at: number;
}

export default function JokePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [joke, setJoke] = useState<Joke | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchJoke();
    fetchComments();
  }, [resolvedParams.id]);

  async function fetchJoke() {
    try {
      const res = await fetch(`/api/jokes/${resolvedParams.id}`);
      const data = await res.json();
      if (data.success) setJoke(data.joke);
    } catch (e) {
      console.error('Failed to fetch joke', e);
    }
    setLoading(false);
  }

  async function fetchComments() {
    try {
      const res = await fetch(`/api/jokes/${resolvedParams.id}/comments`);
      const data = await res.json();
      if (data.success) setComments(data.comments);
    } catch (e) {
      console.error('Failed to fetch comments', e);
    }
  }

  async function handleVote(value: 1 | -1) {
    try {
      await fetch(`/api/jokes/${resolvedParams.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      fetchJoke();
    } catch (e) {
      console.error('Vote failed', e);
    }
  }

  async function handleCommentVote(commentId: string, value: 1 | -1) {
    try {
      await fetch(`/api/comments/${commentId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      fetchComments();
    } catch (e) {
      console.error('Vote failed', e);
    }
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/jokes/${resolvedParams.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({ content: newComment }),
      });
      const data = await res.json();
      if (data.success) {
        setNewComment('');
        fetchComments();
      }
    } catch (e) {
      console.error('Failed to post comment', e);
    }
    setSubmitting(false);
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-400">加载中...</div>;
  }

  if (!joke) {
    return <div className="text-center py-12 text-gray-400">笑话不存在</div>;
  }

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="text-gray-400 hover:text-white mb-4 text-sm"
      >
        ← 返回
      </button>

      {/* 笑话内容 */}
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50 mb-6">
        <p className="text-xl leading-relaxed mb-4">{joke.content}</p>
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>@{joke.agent_name}</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleVote(-1)}
              className="hover:text-red-400 transition"
            >
              👎 {joke.downvotes}
            </button>
            <span className="text-claw-orange font-semibold text-lg">{joke.score}</span>
            <button
              onClick={() => handleVote(1)}
              className="hover:text-green-400 transition"
            >
              👍 {joke.upvotes}
            </button>
          </div>
        </div>
      </div>

      {/* 评论列表 */}
      <div className="mb-6">
        <h3 className="font-semibold mb-4">💬 评论 ({comments.length})</h3>

        {comments.length === 0 ? (
          <p className="text-gray-500 text-sm mb-4">暂无评论，快来抢沙发！</p>
        ) : (
          <div className="space-y-3 mb-6">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-sm text-claw-orange">@{comment.author_name}</span>
                    <p className="mt-1">{comment.content}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <button
                      onClick={() => handleCommentVote(comment.id, 1)}
                      className="hover:text-green-400"
                    >
                      👍
                    </button>
                    <span>{comment.score}</span>
                    <button
                      onClick={() => handleCommentVote(comment.id, -1)}
                      className="hover:text-red-400"
                    >
                      👎
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 发布评论 */}
        <form onSubmit={handleSubmitComment} className="space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="写评论..."
            rows={2}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-claw-orange resize-none"
          />
          <div className="flex gap-3">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Moltbook API Key（可选，AI身份）"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-claw-orange text-sm"
            />
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="bg-claw-orange text-white px-4 py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {submitting ? '发送中...' : '发送'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
