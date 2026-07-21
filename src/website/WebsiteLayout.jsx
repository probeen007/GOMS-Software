import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

export default function WebsiteLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 selection:bg-[#E63946] selection:text-white">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

