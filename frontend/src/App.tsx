import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './layouts/MainLayout';
import { LoginView } from './pages/auth/LoginView';
import { RegisterView } from './pages/auth/RegisterView';
import { LibraryView } from './pages/books/LibraryView';
import { MyProfileView } from './pages/profile/MyProfileView';
import { ExploreView } from './users/pages/ExploreView';
import { RequestsView } from './users/pages/RequestView';
import { FeedView } from './users/pages/FeedView';
import { ClubsListView } from './pages/club/ClubListView';
import { ThreadView } from './pages/club/ThreadView';
import { ClubDetailsView } from './pages/club/ClubDetailsView';
import { BookstoresMapView } from './bookstore/BookstoreMapView.';
import { ChatView } from './pages/chat/ChatView';
import { ForgotPasswordView } from './pages/auth/ForgotPasswordView';
import { ResetPasswordView } from './pages/auth/ResetPasswordView';
import { AdminUserListView } from './pages/admin/AdminUserListView';
import { AdminStatsView } from './pages/admin/AdminStatsView';
import { LibreroCatalogView } from './pages/librero/LibreroCatalogoView';
import { LibreroEventsView } from './pages/librero/LibreroEventsView';
import { SustainabilityView } from './pages/sustainability/SustainabilityView';
import { EventsView } from './pages/events/EventsView';

const RedirectToDashboard = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'admin') return <Navigate to="/admin/users" replace />;
  if (user.role === 'librero') return <Navigate to="/librero/catalog" replace />;

  // Por defecto (lectores)
  return <Navigate to="/explore" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* --- RUTAS PÚBLICAS --- */}
          <Route path="/login" element={<LoginView />} />
          <Route path="/register" element={<RegisterView />} />
          <Route path="/forgot-password" element={<ForgotPasswordView />} />
          <Route path="/reset-password/:token" element={<ResetPasswordView />} />

          {/* --- RUTAS PROTEGIDAS --- */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<RedirectToDashboard />} />

              {/* Rutas accesibles por TODOS (User, Librero, Admin) */}
              <Route path="myprofile" element={<MyProfileView />} />

              {/* RUTAS SOLO USER */}
              <Route element={<ProtectedRoute roles={['user']} />}>
                <Route path="explore" element={<ExploreView />} />
                <Route path="feed" element={<FeedView />} />
                <Route path="library" element={<LibraryView />} />
                <Route path="requests" element={<RequestsView />} />
                <Route path="clubs" element={<ClubsListView />} />
                <Route path="clubs/:id" element={<ClubDetailsView />} />
                <Route path="clubs/thread/:threadId" element={<ThreadView />} />
                <Route path="bookstore" element={<BookstoresMapView />} />
                <Route path="sustainability" element={<SustainabilityView />} />
                <Route path="events" element={<EventsView />} />
                <Route path="chat" element={<ChatView />} />
              </Route>

              {/* RUTAS SOLO LIBRERO */}
              <Route element={<ProtectedRoute roles={['librero']} />}>
                <Route path="librero/events" element={<LibreroEventsView />} />
                <Route path="librero/catalog" element={<LibreroCatalogView />} />
              </Route>

              {/* RUTAS SOLO ADMIN */}
              <Route element={<ProtectedRoute roles={['admin']} />}>
                <Route path="admin/users" element={<AdminUserListView />} />
                <Route path="admin/stats" element={<AdminStatsView />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;