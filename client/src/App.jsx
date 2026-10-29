import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Dashboard from './pages/Dashboard.jsx';
import LightDetail from './pages/LightDetail.jsx';
import Lights from './pages/Lights.jsx';
import Login from './pages/Login.jsx';
import Maintenance from './pages/Maintenance.jsx';
import MapView from './pages/MapView.jsx';
import NotFound from './pages/NotFound.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="lights" element={<Lights />} />
          <Route path="lights/:id" element={<LightDetail />} />
          <Route path="map" element={<MapView />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
