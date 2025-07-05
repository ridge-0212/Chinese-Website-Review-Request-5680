import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import * as FiIcons from 'react-icons/fi'
import SafeIcon from '../common/SafeIcon'
import toast from 'react-hot-toast'

const { FiUser, FiMail, FiCalendar, FiActivity, FiBarChart3, FiEdit3, FiSave, FiX } = FiIcons

const UserProfile = () => {
  const [isEditing, setIsEditing] = useState(false)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    display_name: '',
    email: '',
    avatar_url: ''
  })

  // Mock user data since we're using password auth
  const [profile, setProfile] = useState({
    display_name: '智能用户',
    email: 'user@repromp.com',
    avatar_url: '',
    created_at: '2024-01-01T00:00:00.000Z',
    last_active: new Date().toISOString()
  })

  useEffect(() => {
    // Load profile from localStorage
    const savedProfile = localStorage.getItem('user_profile')
    if (savedProfile) {
      try {
        const parsedProfile = JSON.parse(savedProfile)
        setProfile(parsedProfile)
        setFormData({
          display_name: parsedProfile.display_name || '',
          email: parsedProfile.email || '',
          avatar_url: parsedProfile.avatar_url || ''
        })
      } catch (error) {
        console.error('Error parsing saved profile:', error)
      }
    }

    // Load mock stats
    const mockStats = {
      total_analyses: parseInt(localStorage.getItem('total_analyses') || '0'),
      total_prompts: parseInt(localStorage.getItem('total_prompts') || '0'),
      history_count: parseInt(localStorage.getItem('history_count') || '0'),
      credits_used_today: parseInt(localStorage.getItem('credits_used_today') || '0'),
      last_analysis: localStorage.getItem('last_analysis') || null
    }
    setStats(mockStats)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      const updatedProfile = {
        ...profile,
        display_name: formData.display_name,
        email: formData.email,
        avatar_url: formData.avatar_url,
        updated_at: new Date().toISOString()
      }

      // Save to localStorage
      localStorage.setItem('user_profile', JSON.stringify(updatedProfile))
      setProfile(updatedProfile)
      setIsEditing(false)
      toast.success('个人资料更新成功！')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('更新个人资料失败')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const updateStats = (type, increment = 1) => {
    const currentValue = parseInt(localStorage.getItem(type) || '0')
    const newValue = currentValue + increment
    localStorage.setItem(type, newValue.toString())
    
    if (type === 'total_analyses') {
      localStorage.setItem('last_analysis', new Date().toISOString())
    }
    
    // Update stats state
    setStats(prev => ({
      ...prev,
      [type]: newValue,
      ...(type === 'total_analyses' && { last_analysis: new Date().toISOString() })
    }))
  }

  // Expose updateStats function globally for other components to use
  React.useEffect(() => {
    window.updateUserStats = updateStats
    return () => {
      delete window.updateUserStats
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* 用户资料卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <SafeIcon icon={FiUser} className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">个人资料</h2>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <SafeIcon icon={isEditing ? FiX : FiEdit3} className="h-4 w-4" />
            <span>{isEditing ? '取消' : '编辑'}</span>
          </button>
        </div>

        <div className="flex items-start space-x-6">
          {/* 头像 */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }}
                />
              ) : null}
              <SafeIcon icon={FiUser} className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* 用户信息 */}
          <div className="flex-1">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    显示名称
                  </label>
                  <input
                    type="text"
                    name="display_name"
                    value={formData.display_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入显示名称"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    邮箱地址
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入邮箱地址"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    头像 URL
                  </label>
                  <input
                    type="url"
                    name="avatar_url"
                    value={formData.avatar_url}
                    onChange={handleInputChange}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <SafeIcon icon={loading ? FiIcons.FiLoader : FiSave} className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>{loading ? '保存中...' : '保存'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {profile.display_name || '未设置显示名称'}
                  </h3>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <SafeIcon icon={FiMail} className="h-4 w-4" />
                    <span>{profile.email}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 text-gray-500 text-sm">
                  <SafeIcon icon={FiCalendar} className="h-4 w-4" />
                  <span>注册于 {formatDate(profile.created_at)}</span>
                </div>
                
                {profile.last_active && (
                  <div className="flex items-center space-x-2 text-gray-500 text-sm">
                    <SafeIcon icon={FiActivity} className="h-4 w-4" />
                    <span>最后活跃 {formatDate(profile.last_active)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* 使用统计 */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center space-x-2 mb-6">
            <SafeIcon icon={FiBarChart3} className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">使用统计</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">
                {stats.total_analyses || 0}
              </div>
              <div className="text-sm text-blue-700">总分析次数</div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">
                {stats.total_prompts || 0}
              </div>
              <div className="text-sm text-purple-700">生成提示词数</div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {stats.history_count || 0}
              </div>
              <div className="text-sm text-green-700">历史记录数</div>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600">
                {stats.credits_used_today || 0}
              </div>
              <div className="text-sm text-orange-700">今日使用积分</div>
            </div>
          </div>
          
          {stats.last_analysis && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                最后分析时间: {formatDate(stats.last_analysis)}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

export default UserProfile