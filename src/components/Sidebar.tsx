import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', label: '数据看板', icon: '📊', end: true },
  { to: '/content', label: '内容编辑', icon: '✏️', end: false },
  { to: '/categories', label: '分类管理', icon: '🗂️', end: false },
];

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <span className="dot">C</span> 内容管理
      </div>
      <nav className="nav">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="ico">{it.icon}</span> {it.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
