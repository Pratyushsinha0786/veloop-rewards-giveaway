import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import Navbar from './components/Navbar/Navbar.tsx';
import Footer from './components/Footer/Footer.tsx';
import HomePage from './pages/HomePage/HomePage.tsx';
import PrizeDetailsPage from './pages/PrizeDetailsPage/PrizeDetailsPage.tsx';
import MyRewardsPage from './pages/MyRewardsPage/MyRewardsPage.tsx';
import NotFoundPage from './pages/NotFoundPage/NotFoundPage.tsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/giveaway/:slug" element={<PrizeDetailsPage />} />
              <Route path="/my-rewards" element={<MyRewardsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
