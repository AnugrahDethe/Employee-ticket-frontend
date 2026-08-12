import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import CreateTicket from './pages/CreateTicket';
import TicketDetails from './pages/TicketDetails';

// Layout wrapper that includes the Navbar for authenticated routes
const AppLayout = ({ children }) => {
  return (
    <>
      <Navbar />
      <main style={{ paddingBottom: '2rem' }}>
        {children}
      </main>
    </>
  );
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />

      {/* Protected Layout Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/tickets" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <Tickets />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/tickets/create" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <CreateTicket />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/tickets/:id" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <TicketDetails />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      
      {/* Fallbacks */}
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
