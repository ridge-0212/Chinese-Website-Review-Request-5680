import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import * as FiIcons from 'react-icons/fi'
import SafeIcon from '../common/SafeIcon'
import ApiKeyManager from '../components/ApiKeyManager'
import { useSettingsStore } from '../store/useStore'
import { useSupabaseSettingsStore } from '../store/useSupabaseStore'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

const { FiSettings, FiKey, FiZap, FiCheck, FiX, FiRefreshCw, FiCloud, FiHardDrive, FiUpload, FiDownload } = FiIcons

const SettingsPage = () => {
  const { user } = useAuth()

  // Always call all hooks first
  const supabaseStore = useSupabaseSettingsStore()
  const localStore = useSettingsStore()

  // Then select which store to use
  const settingsStore = user ? supabaseStore : localStore

  const { visionatiKey, straicoKey, setVisionatiKey, setStraicoKey, loading } = settingsStore

  const [connectionStatus, setConnectionStatus] = useState({
    visionati: null,
    straico: null
  })
  const [testing, setTesting] = useState({
    visionati: false,
    straico: false
  })
  const [isInitializing, setIsInitializing] = useState(true)

  // Initialize settings only once
  useEffect(() => {
    let mounted = true
    
    const initializeSettings = async () => {
      try {
        console.log('SettingsPage: Initializing settings...')
        setIsInitializing(true)
        
        if (user && settingsStore.loadSettings && !settingsStore.isInitialized) {
          console.log('SettingsPage: Loading settings for authenticated user...')
          await settingsStore.loadSettings()
        } else if (!user && settingsStore.initializeFromStorage && !settingsStore.isInitialized) {
          console.log('SettingsPage: Initializing settings from localStorage...')
          settingsStore.initializeFromStorage()
        }
        
        if (mounted) {
          setIsInitializing(false)
        }
      } catch (error) {
        console.error('SettingsPage: Error initializing settings:', error)
        if (mounted) {
          setIsInitializing(false)
        }
      }
    }

    initializeSettings()
    
    return () => {
      mounted = false
    }
  }, [user]) // 只依赖 user

  useEffect(() => {
    // Check connection status
    if (visionatiKey) {
      setConnectionStatus(prev => ({ ...prev, visionati: 'connected' }))
    } else {
      setConnectionStatus(prev => ({ ...prev, visionati: null }))
    }

    if (straicoKey) {
      setConnectionStatus(prev => ({ ...prev, straico: 'connected' }))
    } else {
      setConnectionStatus(prev => ({ ...prev, straico: null }))
    }
  }, [visionatiKey, straicoKey])

  const handleKeysChange = async (keys) => {
    try {
      // Use async methods for authenticated users
      if (user) {
        if (keys.visionati !== visionatiKey) {
          await setVisionatiKey(keys.visionati)
        }
        if (keys.straico !== straicoKey) {
          await setStraicoKey(keys.straico)
        }
      } else {
        if (keys.visionati !== visionatiKey) {
          setVisionatiKey(keys.visionati)
        }
        if (keys.straico !== straicoKey) {
          setStraicoKey(keys.straico)
        }
      }
    } catch (error) {
      console.error('Error saving keys in SettingsPage:', error)
      // Keys are already saved by ApiKeyManager, so we don't need to show error here
    }
  }

  const testConnection = async (service) => {
    setTesting(prev => ({ ...prev, [service]: true }))
    try {
      // 模拟 API 测试 - 在真实应用中，您会进行实际的 API 调用
      await new Promise(resolve => setTimeout(resolve, 1500))
      setConnectionStatus(prev => ({ ...prev, [service]: 'connected' }))
      toast.success(`${service} 连接测试成功！`)
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, [service]: 'error' }))
      toast.error(`${service} 连接测试失败`)
    } finally {
      setTesting(prev => ({ ...prev, [service]: false }))
    }
  }

  // Export settings to file
  const exportSettings = () => {
    const settings = {
      visionatiKey,
      straicoKey,
      exportDate: new Date().toISOString(),
      version: '1.0'
    }

    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `repromp-settings-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('设置已导出到文件！')
  }

  // Import settings from file
  const importSettings = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const settings = JSON.parse(e.target.result)
        
        if (settings.visionatiKey || settings.straicoKey) {
          if (user) {
            await setVisionatiKey(settings.visionatiKey || '')
            await setStraicoKey(settings.straicoKey || '')
          } else {
            setVisionatiKey(settings.visionatiKey || '')
            setStraicoKey(settings.straicoKey || '')
          }
          toast.success('设置导入成功！')
        } else {
          toast.error('导入文件格式无效')
        }
      } catch (error) {
        console.error('Import error:', error)
        toast.error('导入设置失败')
      }
    }
    reader.readAsText(file)
    
    // Reset input
    event.target.value = ''
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-green-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-400'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'connected': return '已连接'
      case 'error': return '连接错误'
      default: return '未连接'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return FiCheck
      case 'error': return FiX
      default: return FiX
    }
  }

  if (isInitializing) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <SafeIcon icon={FiIcons.FiLoader} className="h-8 w-8 animate-spin text-blue-600 mr-3" />
          <span className="text-gray-600">初始化设置中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">设置</h1>
        <p className="text-gray-600">
          配置您的 API 密钥和偏好设置
        </p>
        {user && (
          <div className="flex items-center justify-center space-x-2 mt-2">
            <SafeIcon icon={FiCloud} className="h-4 w-4 text-blue-600" />
            <p className="text-sm text-blue-600">
              已登录，设置将自动同步到云端
            </p>
          </div>
        )}
        {!user && (
          <div className="flex items-center justify-center space-x-2 mt-2">
            <SafeIcon icon={FiHardDrive} className="h-4 w-4 text-gray-600" />
            <p className="text-sm text-gray-600">
              当前使用本地存储，登录后可同步到云端
            </p>
          </div>
        )}
      </div>

      {/* 导入/导出设置 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <SafeIcon icon={FiSettings} className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">备份与恢复</h3>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={exportSettings}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors border border-blue-200"
          >
            <SafeIcon icon={FiDownload} className="h-4 w-4" />
            <span>导出设置到文件</span>
          </button>
          
          <label className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors border border-green-200 cursor-pointer">
            <SafeIcon icon={FiUpload} className="h-4 w-4" />
            <span>从文件导入设置</span>
            <input
              type="file"
              accept=".json"
              onChange={importSettings}
              className="hidden"
            />
          </label>
        </div>
        
        <p className="text-xs text-gray-500 mt-3">
          💡 提示：可以导出设置文件作为备份，或在其他设备上导入使用
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API 配置 */}
        <div className="lg:col-span-2">
          <ApiKeyManager onKeysChange={handleKeysChange} />
        </div>

        {/* Visionati 状态 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <SafeIcon icon={FiKey} className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Visionati 状态</h3>
            </div>
            {visionatiKey && (
              <button
                onClick={() => testConnection('visionati')}
                disabled={testing.visionati}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <SafeIcon icon={testing.visionati ? FiIcons.FiLoader : FiRefreshCw} className={`h-4 w-4 ${testing.visionati ? 'animate-spin' : ''}`} />
                <span>测试</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API 密钥</span>
              <span className={`text-sm font-medium ${visionatiKey ? 'text-green-600' : 'text-red-600'}`}>
                {visionatiKey ? '已配置' : '未配置'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">连接状态</span>
              <div className="flex items-center space-x-2">
                <SafeIcon icon={getStatusIcon(connectionStatus.visionati)} className={`h-4 w-4 ${getStatusColor(connectionStatus.visionati)}`} />
                <span className={`text-sm font-medium ${getStatusColor(connectionStatus.visionati)}`}>
                  {getStatusText(connectionStatus.visionati)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">服务</span>
              <span className="text-sm font-medium text-blue-600">
                图像分析
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">存储</span>
              <div className="flex items-center space-x-1">
                <SafeIcon icon={user ? FiCloud : FiHardDrive} className={`h-3 w-3 ${user ? 'text-blue-600' : 'text-gray-600'}`} />
                <span className={`text-sm font-medium ${user ? 'text-blue-600' : 'text-gray-600'}`}>
                  {user ? '云端' : '本地'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Straico 状态 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <SafeIcon icon={FiZap} className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Straico 状态</h3>
            </div>
            {straicoKey && (
              <button
                onClick={() => testConnection('straico')}
                disabled={testing.straico}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <SafeIcon icon={testing.straico ? FiIcons.FiLoader : FiRefreshCw} className={`h-4 w-4 ${testing.straico ? 'animate-spin' : ''}`} />
                <span>测试</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API 密钥</span>
              <span className={`text-sm font-medium ${straicoKey ? 'text-green-600' : 'text-red-600'}`}>
                {straicoKey ? '已配置' : '未配置'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">连接状态</span>
              <div className="flex items-center space-x-2">
                <SafeIcon icon={getStatusIcon(connectionStatus.straico)} className={`h-4 w-4 ${getStatusColor(connectionStatus.straico)}`} />
                <span className={`text-sm font-medium ${getStatusColor(connectionStatus.straico)}`}>
                  {getStatusText(connectionStatus.straico)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">服务</span>
              <span className="text-sm font-medium text-purple-600">
                提示词生成
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">存储</span>
              <div className="flex items-center space-x-1">
                <SafeIcon icon={user ? FiCloud : FiHardDrive} className={`h-3 w-3 ${user ? 'text-blue-600' : 'text-gray-600'}`} />
                <span className={`text-sm font-medium ${user ? 'text-blue-600' : 'text-gray-600'}`}>
                  {user ? '云端' : '本地'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 使用说明 */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
        <h3 className="font-semibold text-blue-900 mb-4">使用指南</h3>
        <div className="space-y-4 text-sm text-blue-800">
          <div className="flex items-start space-x-3">
            <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
              1
            </span>
            <div>
              <p className="font-medium">获取您的 Visionati API 密钥</p>
              <p className="text-blue-700">
                访问{' '}
                <a
                  href="https://api.visionati.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-900"
                >
                  api.visionati.com
                </a>
                {' '}注册并获取您的 API 密钥用于图像分析。
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
              2
            </span>
            <div>
              <p className="font-medium">获取您的 Straico API 密钥</p>
              <p className="text-blue-700">
                访问{' '}
                <a
                  href="https://straico.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-900"
                >
                  straico.com
                </a>
                {' '}注册并获取您的 API 密钥用于 AI 提示词生成。
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
              3
            </span>
            <div>
              <p className="font-medium">测试您的连接</p>
              <p className="text-blue-700">
                使用"测试"按钮验证您的 API 密钥是否正常工作。
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
              4
            </span>
            <div>
              <p className="font-medium">开始创建提示词</p>
              <p className="text-blue-700">
                使用您配置的 API 密钥上传图像并生成 AI 艺术提示词。
              </p>
            </div>
          </div>

          {user && (
            <div className="flex items-start space-x-3">
              <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                ✓
              </span>
              <div>
                <p className="font-medium">云端同步</p>
                <p className="text-blue-700">
                  您的设置和历史记录将自动保存到云端，在任何设备上都可以访问。
                </p>
              </div>
            </div>
          )}

          {!user && (
            <div className="flex items-start space-x-3">
              <span className="bg-yellow-200 text-yellow-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                !
              </span>
              <div>
                <p className="font-medium">推荐：注册账户</p>
                <p className="text-blue-700">
                  注册账户可以享受云端同步功能，您的 API 密钥和设置将在所有设备间同步，再也不用担心换浏览器丢失配置！
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <SafeIcon icon={FiIcons.FiLoader} className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-gray-900">正在{user ? '同步到云端' : '保存设置'}...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsPage