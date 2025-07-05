import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useUIStore, useSettingsStore } from '../store/useStore'
import { useSupabaseHistoryStore, useSupabaseSettingsStore } from '../store/useSupabaseStore'
import { useAuth } from '../hooks/useAuth'
import { useDatabase } from '../hooks/useDatabase'
import VisionatiService from '../services/visionatiService'
import ProductContentService from '../services/productContentService'
import ImageUploader from '../components/ImageUploader'
import ImageAnalyzer from '../components/ImageAnalyzer'
import DescriptionCard from '../components/DescriptionCard'
import ProductTitleGenerator from '../components/ProductTitleGenerator'
import ProductContentList from '../components/ProductContentList'
import toast from 'react-hot-toast'

const ProductPage = () => {
  const { user } = useAuth()
  const { logApiUsage } = useDatabase()

  // State management
  const { 
    isAnalyzing, 
    isGenerating, 
    currentImage, 
    currentDescription, 
    error, 
    setAnalyzing, 
    setGenerating, 
    setCurrentImage, 
    setCurrentDescription, 
    setError, 
    reset 
  } = useUIStore()

  // Product-specific state
  const [currentProductContent, setCurrentProductContent] = useState([])
  const [currentContentType, setCurrentContentType] = useState('both')

  // Always call all hooks - determine which to use after
  const supabaseHistoryStore = useSupabaseHistoryStore()
  const localHistoryStore = useSettingsStore()
  const supabaseSettingsStore = useSupabaseSettingsStore()
  const localSettingsStore = useSettingsStore()

  // Select the appropriate store based on user authentication
  const historyStore = user ? supabaseHistoryStore : localHistoryStore
  const settingsStore = user ? supabaseSettingsStore : localSettingsStore

  const { addEntry } = historyStore
  const { visionatiKey, straicoKey } = settingsStore

  const [analysisData, setAnalysisData] = useState(null)
  const [activeTab, setActiveTab] = useState('simple')
  const [processingStartTime, setProcessingStartTime] = useState(null)

  const handleImageSelect = async (file) => {
    if (!file) {
      reset()
      setAnalysisData(null)
      setCurrentProductContent([])
      return
    }

    setCurrentImage(file)
    setCurrentDescription(null)
    setCurrentProductContent([])
    setError(null)

    if (!visionatiKey) {
      setError('请先在设置中配置您的 Visionati API 密钥')
      return
    }

    setAnalyzing(true)
    setProcessingStartTime(Date.now())

    try {
      const visionatiService = new VisionatiService(visionatiKey)

      // Log API usage start
      const apiStartTime = Date.now()

      // Use e-commerce specific analysis settings with English output
      const result = await visionatiService.analyzeImage({
        file: file,
        features: ['tags', 'descriptions', 'colors', 'brands', 'texts'],
        backends: ['openai', 'googlevision', 'clarifai'],
        role: 'ecommerce', // Specific role for e-commerce
        language: 'English', // 修改为英文输出
        prompt: 'Analyze this product image and provide detailed descriptions in English focusing on e-commerce product features, benefits, and selling points suitable for online marketplace listings.'
      })

      // Log API usage
      if (user) {
        await logApiUsage({
          provider: 'visionati',
          endpoint: '/api/fetch',
          method: 'POST',
          creditsUsed: result.credits_paid || 0,
          responseTime: Date.now() - apiStartTime,
          success: true,
          requestData: {
            features: ['tags', 'descriptions', 'colors', 'brands', 'texts'],
            backends: ['openai', 'googlevision', 'clarifai'],
            role: 'ecommerce',
            language: 'English'
          },
          responseData: {
            credits_paid: result.credits_paid,
            credits_remaining: result.credits
          }
        })
      }

      console.log('产品图像分析结果:', result)
      setCurrentDescription(result.description)
      setAnalysisData(result)

      if (result.description) {
        toast.success('产品图像分析成功！现在可以生成产品标题和描述了。')
        
        // Update user stats
        if (window.updateUserStats) {
          window.updateUserStats('total_analyses', 1)
        }
      } else {
        toast.error('产品图像分析完成但未生成描述。')
      }
    } catch (err) {
      console.error('产品图像分析错误:', err)
      setError(err.message)
      toast.error('产品图像分析失败: ' + err.message)

      // Log API usage failure
      if (user) {
        await logApiUsage({
          provider: 'visionati',
          endpoint: '/api/fetch',
          method: 'POST',
          creditsUsed: 0,
          responseTime: Date.now() - (processingStartTime || Date.now()),
          success: false,
          errorMessage: err.message
        })
      }
    } finally {
      setAnalyzing(false)
    }
  }

  const handleGenerateProductContent = async (productParams, selectedModel = null, contentType = 'both') => {
    console.log('开始生成产品内容...', { currentDescription, productParams, selectedModel, contentType })

    if (!currentDescription) {
      const errorMsg = '没有可用的产品描述来生成内容。请先分析产品图像。'
      setError(errorMsg)
      toast.error(errorMsg)
      return
    }

    if (!straicoKey) {
      const errorMsg = '请先在设置中配置您的 Straico API 密钥'
      setError(errorMsg)
      toast.error(errorMsg)
      return
    }

    setGenerating(true)
    setError(null)
    setCurrentContentType(contentType)

    try {
      const productContentService = new ProductContentService(straicoKey)
      const apiStartTime = Date.now()

      console.log('调用 generateProductContent，参数:', { description: currentDescription, productParams, selectedModel, contentType })
      const productContents = await productContentService.generateProductContent(currentDescription, productParams, selectedModel, contentType)

      // Log API usage
      if (user) {
        await logApiUsage({
          provider: 'straico',
          endpoint: selectedModel ? '/v0/prompt/completion' : '/fallback',
          method: 'POST',
          creditsUsed: productContents.length || 0,
          responseTime: Date.now() - apiStartTime,
          success: true,
          requestData: {
            description: currentDescription,
            productParams: productParams,
            selectedModel: selectedModel,
            contentType: contentType
          },
          responseData: {
            contents_generated: productContents.length
          }
        })
      }

      console.log('生成的产品内容:', productContents)

      if (productContents && productContents.length > 0) {
        setCurrentProductContent(productContents)

        // Save to history (Supabase or local)
        const historyEntry = {
          imageUrl: URL.createObjectURL(currentImage),
          imageName: currentImage.name,
          imageSize: currentImage.size,
          description: currentDescription,
          prompts: productContents, // Store product content as prompts for compatibility
          templateParams: { ...productParams, selectedModel, contentType },
          tags: analysisData?.tags || [],
          colors: analysisData?.colors || [],
          analysisData: analysisData,
          processingTime: processingStartTime ? Date.now() - processingStartTime : null,
          creditsUsed: (analysisData?.credits_paid || 0) + (productContents.length || 0),
          analysisProvider: 'visionati',
          promptProvider: 'straico',
          contentType: 'product' // Mark as product content
        }

        // 修复 addEntry 函数调用错误
        if (typeof addEntry === 'function') {
          await addEntry(historyEntry)
        } else {
          console.warn('addEntry is not a function, storing locally instead')
          // 如果 addEntry 不是函数，则存储到本地 localStorage
          const existingHistory = JSON.parse(localStorage.getItem('product_history') || '[]')
          const newEntry = {
            ...historyEntry,
            id: Date.now().toString(),
            createdAt: new Date().toISOString()
          }
          existingHistory.unshift(newEntry)
          localStorage.setItem('product_history', JSON.stringify(existingHistory.slice(0, 50))) // 只保留最近50条
        }

        // Update user stats
        if (window.updateUserStats) {
          window.updateUserStats('total_prompts', productContents.length)
          window.updateUserStats('history_count', 1)
        }

        const modelText = selectedModel ? ` 使用 ${selectedModel.split('/')[1] || selectedModel}` : ''
        const typeText = contentType === 'title' ? '产品标题' : contentType === 'description' ? '产品描述' : '产品内容'
        toast.success(`成功生成 ${productContents.length} 个${typeText}${modelText}！`)
      } else {
        throw new Error('未生成任何产品内容')
      }
    } catch (err) {
      console.error('产品内容生成错误:', err)
      setError(err.message)
      toast.error('产品内容生成失败: ' + err.message)

      // Log API usage failure
      if (user) {
        await logApiUsage({
          provider: 'straico',
          endpoint: selectedModel ? '/v0/prompt/completion' : '/fallback',
          method: 'POST',
          creditsUsed: 0,
          responseTime: Date.now() - Date.now(),
          success: false,
          errorMessage: err.message
        })
      }
    } finally {
      setGenerating(false)
    }
  }

  const handleRegenerate = () => {
    if (currentDescription) {
      // Use the last used parameters
      const savedSettings = localStorage.getItem('product_generator_settings')
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings)
          console.log('重新生成产品内容，参数:', settings)
          handleGenerateProductContent(settings, settings.selectedModel, settings.contentType || 'both')
        } catch (error) {
          console.error('Error loading saved settings for regeneration:', error)
          toast.error('重新生成失败，请重新设置参数。')
        }
      } else {
        toast.error('没有保存的参数。请重新设置参数。')
      }
    } else {
      toast.error('没有可用的产品描述。请先分析产品图像。')
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          电商产品内容生成器
        </h1>
        <p className="text-gray-600">
          上传产品图像，自动生成专业的电商产品标题和描述（英文输出）
        </p>
        {user && (
          <p className="text-sm text-blue-600 mt-2">
            ✓ 已登录，您的数据将自动保存到云端
          </p>
        )}
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-red-700">{error}</p>
          </div>
        </motion.div>
      )}

      {/* 选项卡导航 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('simple')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'simple'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            产品内容生成
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'advanced'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            高级产品分析
          </button>
        </div>

        {activeTab === 'simple' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左列 */}
            <div className="space-y-6">
              <ImageUploader
                onImageSelect={handleImageSelect}
                currentImage={currentImage}
                isAnalyzing={isAnalyzing}
              />
              <DescriptionCard
                description={currentDescription}
                tags={analysisData?.tags}
                colors={analysisData?.colors}
                isAnalyzing={isAnalyzing}
              />
            </div>

            {/* 右列 */}
            <div className="space-y-6">
              <ProductTitleGenerator
                onGenerateContent={handleGenerateProductContent}
                isGenerating={isGenerating}
                hasDescription={Boolean(currentDescription)}
                apiKey={straicoKey}
              />
            </div>
          </div>
        ) : (
          <ImageAnalyzer apiKey={visionatiKey} mode="product" />
        )}
      </div>

      {/* 全宽产品内容列表 */}
      {activeTab === 'simple' && (
        <ProductContentList
          contents={currentProductContent}
          isGenerating={isGenerating}
          onRegenerate={handleRegenerate}
          contentType={currentContentType}
        />
      )}

      {/* 调试信息（生产环境中删除） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 rounded-lg p-4 text-xs text-gray-600">
          <h4 className="font-medium mb-2">调试信息:</h4>
          <p>用户已登录: {user ? '是' : '否'}</p>
          <p>有描述: {currentDescription ? '是' : '否'}</p>
          <p>有 Visionati 密钥: {visionatiKey ? '是' : '否'}</p>
          <p>有 Straico 密钥: {straicoKey ? '是' : '否'}</p>
          <p>当前产品内容数量: {currentProductContent?.length || 0}</p>
          <p>内容类型: {currentContentType}</p>
          <p>正在分析: {isAnalyzing ? '是' : '否'}</p>
          <p>正在生成: {isGenerating ? '是' : '否'}</p>
          <p>使用存储: {user ? 'Supabase' : 'Local'}</p>
          <p>addEntry 函数类型: {typeof addEntry}</p>
        </div>
      )}
    </div>
  )
}

export default ProductPage