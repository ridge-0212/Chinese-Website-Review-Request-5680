import React, { useEffect } from 'react'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { motion } from 'framer-motion'
import * as FiIcons from 'react-icons/fi'
import SafeIcon from './common/SafeIcon'
import { useAuth } from './hooks/useAuth'
import { useSupabaseHistoryStore, useSupabaseSettingsStore } from './store/useSupabaseStore'
import AuthForm from './components/AuthForm'
import UploadPage from './pages/UploadPage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'
import UserProfile from './components/UserProfile'
import Navbar from './components/Navbar'

const { FiZap } = FiIcons

function App() {
  const { user, loading: authLoading } = useAuth()
  const { loadHistory } = useSupabaseHistoryStore()
  const { loadSettings } = useSupabaseSettingsStore()

  // Load user data when authenticated
  useEffect(() => {
    if (user) {
      loadHistory()
      loadSettings()
    }
  }, [user, loadHistory, loadSettings])

  // Show loading screen while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <SafeIcon icon={FiIcons.FiLoader} className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  // Show auth form if not authenticated
  if (!user) {
    return (
      <Router>
        <AuthForm />
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

  // Show main app if authenticated
  return (
    <Router>
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
      </div>
    </Router>
  )
}

export default App