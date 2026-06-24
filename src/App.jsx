import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BillingProvider } from './context/BillingContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Billing from './pages/Billing';
import BillHistory from './pages/BillHistory';
import Items from './pages/Items';
import BusinessProfile from './pages/BusinessProfile';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BillingProvider>
        <Router>
        <div className="min-h-screen pb-12">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <Navbar />
            <main className="w-full">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<ProtectedRoute allowedRoles={['admin']}><Home /></ProtectedRoute>} />
                <Route path="/billing" element={<ProtectedRoute allowedRoles={['admin', 'user']}><Billing /></ProtectedRoute>} />
                <Route path="/history" element={<ProtectedRoute allowedRoles={['admin']}><BillHistory /></ProtectedRoute>} />
                <Route path="/items" element={<ProtectedRoute allowedRoles={['admin', 'user']}><Items /></ProtectedRoute>} />
                <Route path="/business-profile" element={<ProtectedRoute allowedRoles={['admin']}><BusinessProfile /></ProtectedRoute>} />
                <Route path="/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
              </Routes>
            </main>
          </div>
        </div>
        </Router>
      </BillingProvider>
    </AuthProvider>
  );
}

export default App;
