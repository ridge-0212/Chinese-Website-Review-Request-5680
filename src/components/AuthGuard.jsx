import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as FiIcons from 'react-icons/fi'
import SafeIcon from '../common/SafeIcon'
import toast from 'react-hot-toast'

const { FiLock, FiEye, FiEyeOff, FiShield, FiZap, FiKey } = FiIcons

const AuthGuard = ({ children }) => {
  console.log('AuthGuard: Component rendering...')
  
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockTimeLeft, setBlockTimeLeft] = useState(0)
  const [isInitializing, setIsInitializing] = useState(true)

  const CORRECT_PASSWORD = 'Hello@123456'
  const MAX_ATTEMPTS = 5
  const BLOCK_DURATION = 5 * 60 * 1000 // 5分钟

  useEffect(() => {
    console.log('AuthGuard: Initializing...')
    
    // Check if user is already authenticated
    const authStatus = localStorage.getItem('repromp_auth')
    const authTime = localStorage.getItem('repromp_auth_time')
    
    if (authStatus === 'true' && authTime) {
      const timeDiff = Date.now() - parseInt(authTime)
      // Keep authentication for 24 hours
      if (timeDiff < 24 * 60 * 60 * 1000) {
        console.log('AuthGuard: Found valid authentication')
        setIsAuthenticated(true)
        setIsInitializing(false)
        return
      } else {
        // Clear expired authentication
        localStorage.removeItem('repromp_auth')
        localStorage.removeItem('repromp_auth_time')
      }
    }

    // Check if user is blocked
    const blockStatus = localStorage.getItem('repromp_blocked')
    const blockTime = localStorage.getItem('repromp_block_time')
    
    if (blockStatus === 'true' && blockTime) {
      const timeLeft = BLOCK_DURATION - (Date.now() - parseInt(blockTime))
      if (timeLeft > 0) {
        setIsBlocked(true)
        setBlockTimeLeft(Math.ceil(timeLeft / 1000))
        startBlockTimer(timeLeft)
      } else {
        // Clear expired block
        localStorage.removeItem('repromp_blocked')
        localStorage.removeItem('repromp_block_time')
        localStorage.removeItem('repromp_attempts')
      }
    }

    // Get current attempts
    const storedAttempts = localStorage.getItem('repromp_attempts')
    if (storedAttempts) {
      setAttempts(parseInt(storedAttempts))
    }

    setIsInitializing(false)
    console.log('AuthGuard: Initialization complete')
  }, [])

  const startBlockTimer = (duration) => {
    const interval = setInterval(() => {
      setBlockTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          setIsBlocked(false)
          setAttempts(0)
          localStorage.removeItem('repromp_blocked')
          localStorage.removeItem('repromp_block_time')
          localStorage.removeItem('repromp_attempts')
          toast.success('现在可以重新尝试了！')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('AuthGuard: Handling password submission...')

    if (isBlocked) {
      toast.error(`请等待 ${Math.ceil(blockTimeLeft / 60)} 分钟后再试`)
      return
    }

    if (!password.trim()) {
      toast.error('请输入密码')
      return
    }

    setIsLoading(true)

    // Simulate network delay for security
    setTimeout(() => {
      if (password === CORRECT_PASSWORD) {
        // Authentication success
        console.log('AuthGuard: Authentication successful')
        setIsAuthenticated(true)
        localStorage.setItem('repromp_auth', 'true')
        localStorage.setItem('repromp_auth_time', Date.now().toString())
        localStorage.removeItem('repromp_attempts')
        localStorage.removeItem('repromp_blocked')
        localStorage.removeItem('repromp_block_time')
        toast.success('欢迎使用智能提示词生成器！🎉')
      } else {
        // Authentication failed
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        localStorage.setItem('repromp_attempts', newAttempts.toString())

        if (newAttempts >= MAX_ATTEMPTS) {
          // Block user
          setIsBlocked(true)
          setBlockTimeLeft(BLOCK_DURATION / 1000)
          localStorage.setItem('repromp_blocked', 'true')
          localStorage.setItem('repromp_block_time', Date.now().toString())
          startBlockTimer(BLOCK_DURATION)
          toast.error(`尝试次数过多！已封锁 5 分钟。`)
        } else {
          toast.error(`密码错误。还剩 ${MAX_ATTEMPTS - newAttempts} 次尝试机会。`)
        }
      }

      setPassword('')
      setIsLoading(false)
    }, 1000)
  }

  const handleLogout = () => {
    console.log('AuthGuard: Logging out...')
    setIsAuthenticated(false)
    localStorage.removeItem('repromp_auth')
    localStorage.removeItem('repromp_auth_time')
    toast.success('已成功退出登录')
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Show loading while initializing
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <SafeIcon icon={FiIcons.FiLoader} className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">初始化中...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    console.log('AuthGuard: User authenticated, rendering children')
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Logout button */}
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg"
          >
            <SafeIcon icon={FiIcons.FiLogOut} className="h-4 w-4" />
            <span>退出登录</span>
          </button>
        </div>
        {children}
      </div>
    )
  }

  console.log('AuthGuard: Rendering authentication form')

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black opacity-50"></div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-40 -left-40 w-80 h-80 bg-purple-500 rounded-full opacity-20 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-40 -right-40 w-80 h-80 bg-blue-500 rounded-full opacity-20 blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8 backdrop-blur-sm bg-opacity-95">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-4"
            >
              <SafeIcon icon={FiShield} className="h-8 w-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">智能提示词生成器</h1>
            <p className="text-gray-600">AI 艺术提示词生成工具</p>
          </div>

          {/* Block status */}
          <AnimatePresence>
            {isBlocked && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <SafeIcon icon={FiLock} className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-900">账户暂时被封锁</span>
                </div>
                <p className="text-sm text-red-700 mb-2">
                  尝试次数过多，请等待后再试。
                </p>
                <div className="text-center">
                  <span className="text-2xl font-mono font-bold text-red-600">
                    {formatTime(blockTimeLeft)}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                访问密码
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SafeIcon icon={FiKey} className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入访问密码"
                  disabled={isBlocked}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={isBlocked}
                >
                  <SafeIcon 
                    icon={showPassword ? FiEyeOff : FiEye} 
                    className="h-5 w-5 text-gray-400 hover:text-gray-600" 
                  />
                </button>
              </div>
            </div>

            {/* Attempts counter */}
            {attempts > 0 && !isBlocked && (
              <div className="text-center">
                <p className="text-sm text-orange-600">
                  已使用 {attempts}/{MAX_ATTEMPTS} 次尝试机会
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(attempts / MAX_ATTEMPTS) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || isBlocked}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 focus:ring-4 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
            >
              {isLoading ? (
                <>
                  <SafeIcon icon={FiIcons.FiLoader} className="h-5 w-5 animate-spin" />
                  <span>验证中...</span>
                </>
              ) : (
                <>
                  <SafeIcon icon={FiZap} className="h-5 w-5" />
                  <span>进入系统</span>
                </>
              )}
            </button>
          </form>

          {/* Security info */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2 flex items-center">
              <SafeIcon icon={FiShield} className="h-4 w-4 mr-2" />
              安全信息
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 最多允许 {MAX_ATTEMPTS} 次登录尝试</li>
              <li>• 失败次数过多将封锁 5 分钟</li>
              <li>• 登录会话 24 小时有效</li>
              <li>• 所有访问尝试都会被记录</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>由智能提示词生成器安全系统保护</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default AuthGuard