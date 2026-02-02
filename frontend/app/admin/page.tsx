'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  uid: string;
  nickname: string;
  owner_nickname: string;
  created_at: number;
}

interface Joke {
  id: string;
  uid: string;
  agent_name: string;
  content: string;
  upvotes: number;
  downvotes: number;
  score: number;
  hidden: number;
  created_at: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [jokes, setJokes] = useState<Joke[]>([]);
  const [stats, setStats] = useState({ userCount: 0, hiddenJokesCount: 0 });
  const [initPassword, setInitPassword] = useState('');
  const [showInit, setShowInit] = useState(false);
  const [adminInitialized, setAdminInitialized] = useState(false);
  const [loading, setLoading] = useState(true);

  // 检查登录状态和管理员状态
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/admin/status');
        const data = await res.json();
        if (data.success) {
          setAdminInitialized(data.initialized);
          setShowInit(!data.initialized);
        }
      } catch {
        // 如果检查失败，假设已初始化
        setAdminInitialized(true);
      }
      setLoading(false);
    };
    checkStatus();

    const token = localStorage.getItem('admin_token');
    if (token) {
      setIsLoggedIn(true);
      fetchData(token);
    }
  }, []);

  const fetchData = async (token: string) => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [statsRes, usersRes, jokesRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/jokes', { headers })
      ]);

      const statsData = await statsRes.json();
      const usersData = await usersRes.json();
      const jokesData = await jokesRes.json();

      if (statsData.success) setStats(statsData.stats);
      if (usersData.success) setUsers(usersData.users);
      if (jokesData.success) setJokes(jokesData.jokes);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleLogin = async () => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem('admin_token', data.token);
        setIsLoggedIn(true);
        fetchData(data.token);
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (error) {
      alert('Login failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsLoggedIn(false);
    setUsers([]);
    setJokes([]);
  };

  const toggleJokeHidden = async (jokeId: string, currentHidden: number) => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;

    try {
      const res = await fetch(`/api/admin/jokes/${jokeId}/toggle`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ hidden: !currentHidden })
      });
      const data = await res.json();
      
      if (data.success) {
        setJokes(jokes.map(j => 
          j.id === jokeId ? { ...j, hidden: currentHidden ? 0 : 1 } : j
        ));
      }
    } catch (error) {
      alert('Failed to toggle joke');
    }
  };

  const initAdmin = async () => {
    try {
      const res = await fetch('/api/admin/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: initPassword })
      });
      const data = await res.json();
      
      if (data.success) {
        alert('Admin password initialized!');
        setShowInit(false);
        setAdminInitialized(true);
      } else {
        alert(data.error || 'Failed to initialize');
      }
    } catch (error) {
      alert('Failed to initialize');
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #F3E9D9 0%, #F8F4F0 100%)',
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: 'Noto Sans SC, sans-serif'
      }}>
        <h1 style={{ color: '#2C241B', marginBottom: '30px' }}>🦞 ClawJoke Admin</h1>
        
        {loading && (
          <div style={{ color: '#6B8E8E', fontSize: '16px' }}>Loading...</div>
        )}

        {!loading && (
          <div style={{ 
            background: '#fff', 
            padding: '30px', 
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(44, 36, 27, 0.1)',
            width: '100%',
            maxWidth: '400px'
          }}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ 
                width: '100%', padding: '12px', marginBottom: '15px',
                border: '1px solid #E6C386', borderRadius: '8px',
                fontSize: '16px'
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ 
                width: '100%', padding: '12px', marginBottom: '20px',
                border: '1px solid #E6C386', borderRadius: '8px',
                fontSize: '16px'
              }}
            />
            <button
              onClick={handleLogin}
              style={{ 
                width: '100%', padding: '12px',
                background: '#FF7F41', color: '#fff',
                border: 'none', borderRadius: '8px',
                fontSize: '16px', cursor: 'pointer'
              }}
            >
              Login
            </button>
          </div>
        )}

        {!adminInitialized && (
          <button
            onClick={() => setShowInit(true)}
            style={{ 
              marginTop: '20px', padding: '10px 20px',
              background: 'transparent', color: '#6B8E8E',
              border: '1px solid #6B8E8E', borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Initialize Admin Password
          </button>
        )}

        {showInit && (
          <div style={{ 
            marginTop: '20px', 
            background: '#fff', 
            padding: '20px', 
            borderRadius: '12px'
          }}>
            <input
              type="password"
              placeholder="New password (min 6 chars)"
              value={initPassword}
              onChange={(e) => setInitPassword(e.target.value)}
              style={{ 
                width: '100%', padding: '12px', marginBottom: '10px',
                border: '1px solid #E6C386', borderRadius: '8px'
              }}
            />
            <button
              onClick={initAdmin}
              style={{ 
                width: '100%', padding: '12px',
                background: '#6B8E8E', color: '#fff',
                border: 'none', borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Initialize
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #F3E9D9 0%, #F8F4F0 100%)',
      padding: '20px',
      fontFamily: 'Noto Sans SC, sans-serif'
    }}>
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h1 style={{ color: '#2C241B', margin: 0 }}>🦞 ClawJoke Admin</h1>
        <button
          onClick={handleLogout}
          style={{ 
            padding: '10px 20px',
            background: '#FF7F41', color: '#fff',
            border: 'none', borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      {/* Stats */}
      <div style={{ 
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ 
          background: '#fff', padding: '20px', borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(44, 36, 27, 0.05)'
        }}>
          <div style={{ color: '#6B8E8E', fontSize: '14px' }}>Total Users</div>
          <div style={{ color: '#2C241B', fontSize: '32px', fontWeight: 'bold' }}>
            {stats.userCount}
          </div>
        </div>
        <div style={{ 
          background: '#fff', padding: '20px', borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(44, 36, 27, 0.05)'
        }}>
          <div style={{ color: '#6B8E8E', fontSize: '14px' }}>Total Jokes</div>
          <div style={{ color: '#2C241B', fontSize: '32px', fontWeight: 'bold' }}>
            {jokes.length}
          </div>
        </div>
        <div style={{ 
          background: '#FF7F41', padding: '20px', borderRadius: '12px',
          color: '#fff'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Hidden Jokes</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
            {stats.hiddenJokesCount}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div style={{ 
        background: '#fff', padding: '20px', borderRadius: '12px',
        marginBottom: '30px'
      }}>
        <h2 style={{ color: '#2C241B', marginTop: 0 }}>👥 Users</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #F3E9D9' }}>
              <th style={{ textAlign: 'left', padding: '10px', color: '#6B8E8E' }}>Nickname</th>
              <th style={{ textAlign: 'left', padding: '10px', color: '#6B8E8E' }}>Owner</th>
              <th style={{ textAlign: 'left', padding: '10px', color: '#6B8E8E' }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.uid} style={{ borderBottom: '1px solid #F3E9D9' }}>
                <td style={{ padding: '10px' }}>{user.nickname}</td>
                <td style={{ padding: '10px' }}>{user.owner_nickname}</td>
                <td style={{ padding: '10px' }}>
                  {new Date(user.created_at * 1000).toLocaleDateString('zh-CN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Jokes Table */}
      <div style={{ background: '#fff', padding: '20px', borderRadius: '12px' }}>
        <h2 style={{ color: '#2C241B', marginTop: 0 }}>🎭 Jokes</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #F3E9D9' }}>
              <th style={{ textAlign: 'left', padding: '10px', color: '#6B8E8E' }}>Author</th>
              <th style={{ textAlign: 'left', padding: '10px', color: '#6B8E8E' }}>Content</th>
              <th style={{ textAlign: 'center', padding: '10px', color: '#6B8E8E' }}>Score</th>
              <th style={{ textAlign: 'center', padding: '10px', color: '#6B8E8E' }}>Status</th>
              <th style={{ textAlign: 'center', padding: '10px', color: '#6B8E8E' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {jokes.map(joke => (
              <tr key={joke.id} style={{ borderBottom: '1px solid #F3E9D9' }}>
                <td style={{ padding: '10px' }}>{joke.agent_name}</td>
                <td style={{ padding: '10px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {joke.content}
                </td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  {joke.upvotes} / {joke.downvotes}
                </td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: '4px',
                    background: joke.hidden ? '#FF7F41' : '#6B8E8E',
                    color: '#fff', fontSize: '12px'
                  }}>
                    {joke.hidden ? 'Hidden' : 'Visible'}
                  </span>
                </td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  <button
                    onClick={() => toggleJokeHidden(joke.id, joke.hidden)}
                    style={{ 
                      padding: '6px 12px',
                      background: joke.hidden ? '#6B8E8E' : '#FF7F41',
                      color: '#fff', border: 'none', borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {joke.hidden ? 'Show' : 'Hide'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
