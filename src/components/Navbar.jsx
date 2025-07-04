import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import * as FiIcons from 'react-icons/fi'
import SafeIcon from '../common/SafeIcon'
import { useAuth } from '../hooks/useAuth'

const { FiZap, FiUpload, FiClock, FiSettings, FiUser, FiLogOut } = FiIcons

const Navbar = () => {
  const location = useLocation()
  const { user, profile, signOut } = useAuth()

  const navItems = [
    { path: '/', label: '上传', icon: FiUpload },
    { path: '/history', label: '历史', icon: FiClock },
    { path: '/settings', label: '设置', icon: FiSettings },
    { path: '/profile', label: '个人资料', icon: FiUser }
  ]

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-2 rounded-lg">
              <SafeIcon icon={FiZap} className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">智能提示词生成器</h1>
              <p className="text-xs text-gray-500">AI 艺术提示词生成工具</p>
            </div>
          </Link>

          {/* 导航菜单 */}
          <div className="flex items-center space-x-4">
            {/* 导航链接 */}
            <div className="flex space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    location.pathname === item.path
                      ? 'text-purple-600 bg-purple-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <SafeIcon icon={item.icon} className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {location.pathname === item.path && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-purple-100 rounded-lg -z-10"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
            </div>

            {/* 用户信息 */}
            {user && (
              <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.display_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <SafeIcon icon={FiUser} className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">
                      {profile?.display_name || '用户'}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                
                <button
                  onClick={signOut}
                  className="flex items-center space-x-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  title="退出登录"
                >
                  <SafeIcon icon={FiLogOut} className="h-4 w-4" />
                  <span className="hidden sm:inline">退出</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar