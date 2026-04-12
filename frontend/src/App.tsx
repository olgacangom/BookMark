import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './layouts/MainLayout';
import { LoginView } from './pages/auth/LoginView';
import { RegisterView } from './pages/auth/RegisterView';
import { DashboardView } from './pages/dashboard/DashboardView';
import { LibraryView } from './pages/books/LibraryView';
import { MyProfileView } from './pages/profile/MyProfileView';
import { ExploreView } from './users/pages/ExploreView';
import { RequestsView } from './users/pages/RequestView';
import { FeedView } from './users/pages/FeedView';
import { ClubsListView } from './pages/club/ClubListView';
import { ThreadView } from './pages/club/ThreadView';
import { ClubDetailsView } from './pages/club/ClubDetailsView';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={<LoginView />} />
          <Route path="/register" element={<RegisterView />} />

          {/* Rutas protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to="/explore" />} />
              <Route path="dashboard" element={<DashboardView />} />
              <Route path="library" element={<LibraryView />} />
              <Route path="explore" element={<ExploreView />} />
              <Route path="feed" element={<FeedView />} />
              <Route path="requests" element={<RequestsView />} />
              <Route path="clubs" element={<ClubsListView />} />
              <Route path="clubs/:id" element={<ClubDetailsView />} />
              <Route path="clubs/thread/:threadId" element={<ThreadView />} />
              <Route path="myprofile" element={<MyProfileView />} />
            </Route>
          </Route>

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/explore" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;