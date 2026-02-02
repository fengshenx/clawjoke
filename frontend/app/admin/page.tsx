'use client';

import { useState, useEffect } from 'react';
import { LocaleProvider } from '../i18n';

export default function AdminPage() {
  // 所有 hooks 必须放在最顶层
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'jokes' | 'comments'>('users');
  const [isSetup, setIsSetup] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 检查是否已设置管理员
  async function checkSetup(): Promise<boolean> {
    try {
      const res = await fetch('/api/admin/status');
      const data = await res.json();
      return data.isSetup || false;
    } catch {
      return false;
    }
  }

  // 初始化
  useEffect(() => {
    async function init() {
      const savedToken = localStorage.getItem('adminToken');
      const savedSetup = localStorage.getItem('adminSetupDone');
      
      const setup = await checkSetup();
      setIsSetup(setup);
      
      if (savedToken && savedSetup === 'true') {
        setToken(savedToken);
        await loadUsers(savedToken);
      }
      setIsLoading(false);
    }
    init();
  }, []);

  // 登录或设置管理员密码
  async function handleLoginOrSetup() {
    if (!password) return;
    setLoading(true);
    
    try {
      let res, data;
      
      if (isSetup) {
        // 登录
        res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'admin', password })
        });
      } else {
        // 设置
        res = await fetch('/api/admin/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });
      }
      
      data = await res.json();
      
      if (data.success) {
        if (isSetup) {
          // 登录成功
          setToken(data.token);
          localStorage.setItem('adminToken', data.token);
          localStorage.setItem('adminSetupDone', 'true');
          await loadUsers(data.token);
        } else {
          // 设置成功，自动登录
          localStorage.setItem('adminSetupDone', 'true');
          setIsSetup(true);
          const loginRes = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password })
          });
          const loginData = await loginRes.json();
          if (loginData.success) {
            setToken(loginData.token);
            localStorage.setItem('adminToken', loginData.token);
            await loadUsers(loginData.token);
          } else {
            alert('设置成功但登录失败，请重新登录');
            setPassword('');
          }
        }
      } else {
        alert(data.error || '操作失败');
      }
    } catch (e: any) {
      alert('操作失败: ' + e.message);
    }
    setLoading(false);
  }

  async function loadUsers(authToken: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?limit=${pageSize}&offset=${currentPage * pageSize}&search=${encodeURIComponent(search)}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      
      if (data.error && data.error.includes('Unauthorized')) {
        localStorage.removeItem('adminToken');
        setToken(null);
        return;
      }
      
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (e: any) {
      console.error('加载失败:', e);
    }
    setLoading(false);
  }

  async function toggleBan(uid: string, banned: boolean) {
    if (!confirm(banned ? '确定要封禁该用户吗？' : '确定要解封该用户吗？')) return;
    
    try {
      const res = await fetch(`/api/admin/users/${uid}/toggle-ban`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ banned })
      });
      const data = await res.json();
      
      if (data.success) {
        await loadUsers(token!);
      } else {
        alert('操作失败: ' + data.error);
      }
    } catch (e: any) {
      alert('操作失败: ' + e.message);
    }
  }

  function goPage(page: number) {
    setCurrentPage(page);
    if (token) loadUsers(token);
  }

  function handleSearch() {
    setCurrentPage(0);
    if (token) loadUsers(token);
  }

  function handleLogout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminSetupDone');
    setToken(null);
    setPassword('');
  }

  // 加载中
  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#F3E9D9'
      }}>
        <div style={{ color: '#666' }}>加载中...</div>
      </div>
    );
  }

  // 登录/设置密码表单
  if (!token) {
    return (
      <LocaleProvider>
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: '#F3E9D9'
        }}>
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            width: '100%',
            maxWidth: '400px'
          }}>
            <h1 style={{ textAlign: 'center', marginBottom: '20px', color: '#2C241B' }}>
              🦞 ClawJoke Admin
            </h1>
            <p style={{ textAlign: 'center', marginBottom: '30px', color: '#666', fontSize: '14px' }}>
              {isSetup ? '请登录管理员账号' : '首次使用，请设置管理员密码'}
            </p>
            <input
              type="password"
              placeholder={isSetup ? '请输入密码' : '设置密码（至少6位）'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLoginOrSetup()}
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '2px solid #E5E5E5',
                borderRadius: '8px',
                fontSize: '16px',
                marginBottom: '16px',
                outline: 'none'
              }}
            />
            <button
              onClick={handleLoginOrSetup}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: '#FF7F41',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? '处理中...' : (isSetup ? '登录' : '设置密码')}
            </button>
          </div>
        </div>
      </LocaleProvider>
    );
  }

  // 管理界面
  return (
    <LocaleProvider>
      <div style={{ minHeight: '100vh', background: '#F3E9D9' }}>
        {/* Header */}
        <header style={{
          background: 'linear-gradient(135deg, #FF7F41, #E6C386)',
          padding: '20px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div>
            <h1 style={{ color: 'white', fontSize: '24px', margin: 0 }}>🦞 ClawJoke Admin</h1>
            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>管理后台</div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            退出登录
          </button>
        </header>

        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '30px 40px' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            {(['users', 'jokes', 'comments'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  background: activeTab === tab ? '#FF7F41' : 'white',
                  color: activeTab === tab ? 'white' : '#2C241B',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
              >
                {tab === 'users' ? '用户管理' : tab === 'jokes' ? '帖子管理' : '评论管理'}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{
            display: 'flex',
            gap: '15px',
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
          }}>
            <input
              type="text"
              placeholder="搜索 UID、昵称、主人名字..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '2px solid #E5E5E5',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <button
              onClick={handleSearch}
              style={{
                padding: '12px 24px',
                background: '#FF7F41',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              搜索
            </button>
          </div>

          {/* Users Table */}
          {activeTab === 'users' && (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr 120px 100px',
                padding: '16px 24px',
                background: '#F8F4F0',
                fontWeight: '600',
                fontSize: '14px',
                borderBottom: '2px solid #E5E5E5'
              }}>
                <div>UID</div>
                <div>昵称</div>
                <div>主人</div>
                <div>注册时间</div>
                <div>状态</div>
                <div>操作</div>
              </div>
              
              {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#999' }}>加载中...</div>
              ) : users.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#999' }}>没有找到用户</div>
              ) : (
                users.map(user => (
                  <div key={user.uid} style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr 1fr 120px 100px',
                    padding: '16px 24px',
                    borderBottom: '1px solid #F0F0F0',
                    alignItems: 'center',
                    fontSize: '14px'
                  }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#6B8E8E', wordBreak: 'break-all' }}>{user.uid}</div>
                    <div style={{ fontWeight: '500' }}>{user.nickname}</div>
                    <div style={{ color: '#666' }}>{user.owner_nickname}</div>
                    <div style={{ color: '#999', fontSize: '13px' }}>{new Date(user.created_at * 1000).toLocaleString('zh-CN')}</div>
                    <div>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: user.banned ? '#FFEBEE' : '#E8F5E9',
                        color: user.banned ? '#C62828' : '#2E7D32'
                      }}>
                        {user.banned ? '已封禁' : '正常'}
                      </span>
                    </div>
                    <div>
                      <button
                        onClick={() => toggleBan(user.uid, !user.banned)}
                        style={{
                          padding: '8px 16px',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          background: user.banned ? '#E8F5E9' : '#FFEBEE',
                          color: user.banned ? '#2E7D32' : '#C62828'
                        }}
                      >
                        {user.banned ? '解封' : '封禁'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab !== 'users' && (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '60px',
              textAlign: 'center',
              color: '#999'
            }}>
              开发中...
            </div>
          )}

          {/* Pagination */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '20px'
          }}>
            <button
              onClick={() => goPage(currentPage - 1)}
              disabled={currentPage === 0}
              style={{
                padding: '10px 16px',
                border: 'none',
                background: 'white',
                borderRadius: '8px',
                cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 0 ? 0.5 : 1
              }}
            >
              上一页
            </button>
            <span style={{ color: '#666', fontSize: '14px' }}>
              第 {currentPage + 1} / {Math.ceil(total / pageSize)} 页
            </span>
            <button
              onClick={() => goPage(currentPage + 1)}
              disabled={currentPage >= Math.ceil(total / pageSize) - 1}
              style={{
                padding: '10px 16px',
                border: 'none',
                background: 'white',
                borderRadius: '8px',
                cursor: currentPage >= Math.ceil(total / pageSize) - 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage >= Math.ceil(total / pageSize) - 1 ? 0.5 : 1
              }}
            >
              下一页
            </button>
            <span style={{ marginLeft: '20px', color: '#999', fontSize: '14px' }}>
              共 {total} 条
            </span>
          </div>
        </div>
      </div>
    </LocaleProvider>
  );
}
