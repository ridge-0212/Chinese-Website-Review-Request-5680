import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import * as FiIcons from 'react-icons/fi'
import SafeIcon from '../common/SafeIcon'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

const { FiUser, FiMail, FiCalendar, FiActivity, FiBarChart3, FiEdit3, FiSave, FiX } = FiIcons

const UserProfile = () => {
  const { user, profile, updateProfile, getUserStats } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [stats, setStats] = useState(null)
  const [formData, setFormData] = useState({
    display_name: '',
    avatar_url: ''
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        avatar_url: profile.avatar_url || ''
      })
    }
  }, [profile])

  useEffect(() => {
    const fetchStats = async () => {
      const userStats = await getUserStats()
      setStats(userStats)
    }
    
    if (user) {
      fetchStats()
    }
  }, [user, getUserStats])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const { error } = await updateProfile(formData)
    if (!error) {
      setIsEditing(false)
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

  if (!user || !profile) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <SafeIcon icon={FiIcons.FiLoader} className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">加载用户资料...</p>
        </div>
      </div>
    )
  }

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
                />
              ) : (
                <SafeIcon icon={FiUser} className="h-8 w-8 text-white" />
              )}
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
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <SafeIcon icon={FiSave} className="h-4 w-4" />
                    <span>保存</span>
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
                    <span>{user.email}</span>
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