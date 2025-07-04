import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import * as FiIcons from 'react-icons/fi'
import SafeIcon from '../common/SafeIcon'
import { useHistoryStore } from '../store/useStore'
import { useSupabaseHistoryStore } from '../store/useSupabaseStore'
import { useAuth } from '../hooks/useAuth'
import { copyPrompt, copyDescription } from '../utils/clipboard'
import { formatDate } from '../utils/dateUtils'

const { FiClock, FiCopy, FiTrash2, FiEye, FiZap, FiImage, FiRefreshCw, FiCloud, FiHardDrive } = FiIcons

const HistoryPage = () => {
  const { user } = useAuth()
  
  // Always call all hooks first
  const supabaseStore = useSupabaseHistoryStore()
  const localStore = useHistoryStore()
  
  // Then select which store to use
  const historyStore = user ? supabaseStore : localStore
  const { entries, removeEntry, clearHistory, loading, loadHistory } = historyStore

  const [selectedEntry, setSelectedEntry] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  // Load history on mount for authenticated users
  useEffect(() => {
    if (user && loadHistory) {
      loadHistory()
    }
  }, [user, loadHistory])

  const handleClearHistory = async () => {
    if (window.confirm('确定要清除所有历史记录吗？')) {
      await clearHistory()
    }
  }

  const handleDeleteEntry = async (id) => {
    if (window.confirm('确定要删除这条记录吗？')) {
      await removeEntry(id)
      if (selectedEntry?.id === id) {
        setSelectedEntry(null)
      }
    }
  }

  const handleRefresh = async () => {
    if (user && loadHistory) {
      setRefreshing(true)
      await loadHistory()
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <SafeIcon icon={FiIcons.FiLoader} className="h-16 w-16 text-gray-400 mx-auto mb-4 animate-spin" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">加载历史记录...</h2>
        <p className="text-gray-600">正在从{user ? '云端' : '本地'}加载您的历史记录</p>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <SafeIcon icon={FiClock} className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">暂无历史记录</h2>
        <p className="text-gray-600 mb-6">
          上传图像并生成提示词后，您的历史记录将显示在这里。
        </p>
        {user && (
          <p className="text-sm text-blue-600 mb-6">
            ✓ 已登录，您的数据将自动保存到云端
          </p>
        )}
        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <SafeIcon icon={FiIcons.FiUpload} className="h-5 w-5" />
          <span>上传您的第一张图像</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">历史记录</h1>
          <div className="flex items-center space-x-4 mt-2">
            <p className="text-gray-600">{entries.length} 条记录</p>
            <div className="flex items-center space-x-2 text-sm">
              <SafeIcon 
                icon={user ? FiCloud : FiHardDrive} 
                className={`h-4 w-4 ${user ? 'text-blue-600' : 'text-gray-600'}`} 
              />
              <span className={user ? 'text-blue-600' : 'text-gray-600'}>
                {user ? '云端存储' : '本地存储'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          {user && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <SafeIcon 
                icon={FiRefreshCw} 
                className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} 
              />
              <span>刷新</span>
            </button>
          )}
          <button
            onClick={handleClearHistory}
            className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            <SafeIcon icon={FiTrash2} className="h-4 w-4" />
            <span>清除全部</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 历史记录列表 */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="font-semibold text-gray-900">最近记录</h2>
          <div className="space-y-3">
            {entries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-lg border p-4 cursor-pointer transition-all ${
                  selectedEntry?.id === entry.id
                    ? 'border-purple-500 ring-2 ring-purple-500 ring-opacity-20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedEntry(entry)}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={entry.imageUrl}
                      alt={entry.imageName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {entry.imageName}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {entry.description?.substring(0, 60)}...
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-xs text-gray-400">
                        {formatDate(entry.createdAt)}
                      </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        {entry.prompts?.length || 0} 个提示词
                      </span>
                    </div>
                    {/* Show processing stats for authenticated users */}
                    {user && (entry.processingTime || entry.creditsUsed) && (
                      <div className="flex items-center space-x-2 mt-1">
                        {entry.processingTime && (
                          <span className="text-xs text-gray-400">
                            {Math.round(entry.processingTime / 1000)}s
                          </span>
                        )}
                        {entry.creditsUsed && (
                          <span className="text-xs text-blue-600">
                            {entry.creditsUsed} 积分
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 记录详情 */}
        <div className="lg:col-span-2">
          {selectedEntry ? (
            <motion.div
              key={selectedEntry.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* 图像和描述 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">
                    {selectedEntry.imageName}
                  </h3>
                  <div className="flex items-center space-x-2">
                    {/* Processing stats */}
                    {user && selectedEntry.processingTime && (
                      <span className="text-sm text-gray-500">
                        处理时间: {Math.round(selectedEntry.processingTime / 1000)}s
                      </span>
                    )}
                    {user && selectedEntry.creditsUsed && (
                      <span className="text-sm text-blue-600">
                        使用积分: {selectedEntry.creditsUsed}
                      </span>
                    )}
                    <button
                      onClick={() => handleDeleteEntry(selectedEntry.id)}
                      className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <SafeIcon icon={FiTrash2} className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <img
                      src={selectedEntry.imageUrl}
                      alt={selectedEntry.imageName}
                      className="w-full rounded-lg shadow-sm"
                    />
                    {/* Image metadata */}
                    {selectedEntry.imageSize && (
                      <div className="mt-2 text-sm text-gray-500">
                        大小: {(selectedEntry.imageSize / 1024 / 1024).toFixed(2)} MB
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">描述</h4>
                      <button
                        onClick={() => copyDescription(selectedEntry.description)}
                        className="text-blue-600 hover:text-blue-700 p-1"
                      >
                        <SafeIcon icon={FiCopy} className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {selectedEntry.description}
                    </p>
                  </div>
                </div>

                {/* 标签和颜色 */}
                {(selectedEntry.tags?.length > 0 || selectedEntry.colors?.length > 0) && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedEntry.tags?.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">标签</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedEntry.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedEntry.colors?.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">颜色</h4>
                          <div className="flex space-x-2">
                            {selectedEntry.colors.map((color, index) => (
                              <div
                                key={index}
                                className="w-6 h-6 rounded-full border border-gray-300"
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 生成的提示词 */}
              {selectedEntry.prompts?.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    生成的提示词 ({selectedEntry.prompts.length})
                  </h3>
                  <div className="space-y-4">
                    {selectedEntry.prompts.map((prompt, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            {prompt.variation || `提示词 ${index + 1}`}
                          </span>
                          <button
                            onClick={() => copyPrompt(prompt)}
                            className="text-purple-600 hover:text-purple-700 p-1"
                          >
                            <SafeIcon icon={FiCopy} className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {prompt.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <SafeIcon icon={FiEye} className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                选择一条记录
              </h3>
              <p className="text-gray-600">
                点击左侧的记录来查看详情
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HistoryPage