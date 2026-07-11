import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthed } from './session';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ContentEdit from './pages/ContentEdit';
import CategoryList from './pages/CategoryList';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/content" element={<ContentEdit />} />
            <Route path="/categories" element={<CategoryList />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to={isAuthed() ? '/' : '/login'} replace />} />
      </Routes>
    </HashRouter>
  );
}
