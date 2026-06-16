import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BillingProvider } from './context/BillingContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Billing from './pages/Billing';
import BillHistory from './pages/BillHistory';
import Items from './pages/Items';
import BusinessProfile from './pages/BusinessProfile';

function App() {
  return (
    <BillingProvider>
      <Router>
        <div className="min-h-screen pb-12">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <Navbar />
            <main className="w-full">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/billing" element={<Billing />} />
                <Route path="/history" element={<BillHistory />} />
                <Route path="/items" element={<Items />} />
                <Route path="/business-profile" element={<BusinessProfile />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </BillingProvider>
  );
}

export default App;
