import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useUIStore, useSettingsStore } from '../store/useStore'
import { useSupabaseHistoryStore, useSupabaseSettingsStore } from '../store/useSupabaseStore'
import { useAuth } from '../hooks/useAuth'
import { useDatabase } from '../hooks/useDatabase'
import VisionatiService from '../services/visionatiService'
import StraicoService from '../services/straicoService'
import ImageUploader from '../components/ImageUploader'
import ImageAnalyzer from '../components/ImageAnalyzer'
import DescriptionCard from '../components/DescriptionCard'
import PromptGeneratorPanel from '../components/PromptGeneratorPanel'
import PromptList from '../components/PromptList'
import toast from 'react-hot-toast'

const UploadPage = () => {
  const { user } = useAuth()
  const { logApiUsage } = useDatabase()

  // State management
  const { 
    isAnalyzing, 
    isGenerating, 
    currentImage, 
    currentDescription, 
    currentPrompts, 
    error, 
    setAnalyzing, 
    setGenerating, 
    setCurrentImage, 
    setCurrentDescription, 
    setCurrentPrompts, 
    setError, 
    reset 
  } = useUIStore()

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
      return
    }

    setCurrentImage(file)
    setCurrentDescription(null)
    setCurrentPrompts([])
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

      const result = await visionatiService.analyzeImage({
        file: file,
        features: ['tags', 'descriptions', 'colors', 'nsfw'],
        backends: ['openai', 'googlevision', 'clarifai'],
        role: 'general'
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
            features: ['tags', 'descriptions', 'colors', 'nsfw'],
            backends: ['openai', 'googlevision', 'clarifai'],
            role: 'general'
          },
          responseData: {
            credits_paid: result.credits_paid,
            credits_remaining: result.credits
          }
        })
      }

      console.log('分析结果:', result)
      setCurrentDescription(result.description)
      setAnalysisData(result)

      if (result.description) {
        toast.success('图像分析成功！现在可以生成提示词了。')
        
        // Update user stats
        if (window.updateUserStats) {
          window.updateUserStats('total_analyses', 1)
        }
      } else {
        toast.error('图像分析完成但未生成描述。')
      }
    } catch (err) {
      console.error('分析错误:', err)
      setError(err.message)
      toast.error('图像分析失败: ' + err.message)

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

  const handleGeneratePrompts = async (templateParams, selectedModel = null) => {
    console.log('开始生成提示词...', { currentDescription, templateParams, selectedModel })

    if (!currentDescription) {
      const errorMsg = '没有可用的描述来生成提示词。请先分析图像。'
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

    try {
      const straicoService = new StraicoService(straicoKey)
      const apiStartTime = Date.now()

      console.log('调用 generatePrompts，参数:', { description: currentDescription, templateParams, selectedModel })
      const prompts = await straicoService.generatePrompts(currentDescription, templateParams, selectedModel)

      // Log API usage
      if (user) {
        await logApiUsage({
          provider: 'straico',
          endpoint: selectedModel ? '/v0/prompt/completion' : '/fallback',
          method: 'POST',
          creditsUsed: prompts.length || 0,
          responseTime: Date.now() - apiStartTime,
          success: true,
          requestData: {
            description: currentDescription,
            templateParams: templateParams,
            selectedModel: selectedModel
          },
          responseData: {
            prompts_generated: prompts.length
          }
        })
      }

      console.log('生成的提示词:', prompts)

      if (prompts && prompts.length > 0) {
        setCurrentPrompts(prompts)

        // Save to history (Supabase or local)
        const historyEntry = {
          imageUrl: URL.createObjectURL(currentImage),
          imageName: currentImage.name,
          imageSize: currentImage.size,
          description: currentDescription,
          prompts: prompts,
          templateParams: { ...templateParams, selectedModel },
          tags: analysisData?.tags || [],
          colors: analysisData?.colors || [],
          analysisData: analysisData,
          processingTime: processingStartTime ? Date.now() - processingStartTime : null,
          creditsUsed: (analysisData?.credits_paid || 0) + (prompts.length || 0),
          analysisProvider: 'visionati',
          promptProvider: 'straico'
        }

        await addEntry(historyEntry)

        // Update user stats
        if (window.updateUserStats) {
          window.updateUserStats('total_prompts', prompts.length)
          window.updateUserStats('history_count', 1)
        }

        const modelText = selectedModel ? ` using ${selectedModel.split('/')[1] || selectedModel}` : ''
        toast.success(`成功生成 ${prompts.length} 个 AI 艺术提示词${modelText}！`)
      } else {
        throw new Error('未生成任何提示词')
      }
    } catch (err) {
      console.error('提示词生成错误:', err)
      setError(err.message)
      toast.error('提示词生成失败: ' + err.message)

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
      const params = settingsStore.defaultTemplateParams
      console.log('重新生成，参数:', params)
      handleGeneratePrompts(params)
    } else {
      toast.error('没有可用的描述。请先分析图像。')
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          创建 AI 艺术提示词
        </h1>
        <p className="text-gray-600">
          上传图像以自动生成详细的 AI 艺术提示词
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
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            简单上传
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'advanced'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            高级分析
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
              <PromptGeneratorPanel
                onGeneratePrompts={handleGeneratePrompts}
                isGenerating={isGenerating}
                hasDescription={Boolean(currentDescription)}
                apiKey={straicoKey}
              />
            </div>
          </div>
        ) : (
          <ImageAnalyzer apiKey={visionatiKey} />
        )}
      </div>

      {/* 全宽提示词列表 */}
      {activeTab === 'simple' && (
        <PromptList
          prompts={currentPrompts}
          isGenerating={isGenerating}
          onRegenerate={handleRegenerate}
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
          <p>当前提示词数量: {currentPrompts?.length || 0}</p>
          <p>正在分析: {isAnalyzing ? '是' : '否'}</p>
          <p>正在生成: {isGenerating ? '是' : '否'}</p>
          <p>使用存储: {user ? 'Supabase' : 'Local'}</p>
        </div>
      )}
    </div>
  )
}

export default UploadPage