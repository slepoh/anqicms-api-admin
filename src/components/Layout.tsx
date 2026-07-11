import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { clearSession, getSession } from '../session';

function shortDomain(d: string): string {
  return d.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

export default function Layout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const session = getSession();

  const logout = () => {
    clearSession();
    navigate('/login', { replace: true });
  };

  return (
    <div className="layout">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className={`backdrop ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />
      <div className="main">
        <header className="topbar">
          <div className="flex items-center gap-12">
            <button className="hamburger" onClick={() => setOpen(true)} aria-label="菜单">
              ☰
            </button>
            <span className="title">内容管理后台</span>
          </div>
          <div className="right">
            <span className="muted" style={{ fontSize: 13 }} title={session?.domain}>
              {session ? shortDomain(session.domain) : ''}
            </span>
            <div className="avatar">{(session ? shortDomain(session.domain) : 'C').slice(0, 1).toUpperCase()}</div>
            <button className="btn btn-ghost btn-sm" onClick={logout}>
              退出
            </button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
