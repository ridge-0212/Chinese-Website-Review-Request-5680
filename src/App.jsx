import React, { useEffect } from 'react'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { motion } from 'framer-motion'
import * as FiIcons from 'react-icons/fi'
import SafeIcon from './common/SafeIcon'
import { useAuth } from './hooks/useAuth'
import { useSupabaseHistoryStore, useSupabaseSettingsStore } from './store/useSupabaseStore'
import AuthGuard from './components/AuthGuard'
import UploadPage from './pages/UploadPage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'
import UserProfile from './components/UserProfile'
import Navbar from './components/Navbar'

const { FiZap } = FiIcons

function App() {
  console.log('App component rendering...')

  return (
    <Router>
      <AuthGuard>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<UploadPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/profile" element={<UserProfile />} />
            </Routes>
          </main>
        </div>
      </AuthGuard>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </Router>
  )
}

export default App