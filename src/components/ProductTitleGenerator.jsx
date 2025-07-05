import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useSettingsStore } from '../store/useStore';
import ModelSelector from './ModelSelector';

const { FiShoppingBag, FiSettings, FiRefreshCw, FiCheck, FiX, FiEdit3, FiCpu, FiTag, FiFileText, FiMessageSquare } = FiIcons;

const ProductTitleGenerator = ({ onGenerateContent, isGenerating, hasDescription, apiKey }) => {
  const { defaultTemplateParams, setDefaultTemplateParams } = useSettingsStore();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showManualPrompt, setShowManualPrompt] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showCustomInstructions, setShowCustomInstructions] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [contentType, setContentType] = useState('both'); // 'title', 'description', 'both'

  const [productParams, setProductParams] = useState({
    category: 'General',
    targetAudience: 'General',
    platform: 'General',
    tone: 'Professional',
    language: 'English',
    priceRange: 'Mid-range',
    brandStyle: 'Modern',
    keyFeatures: '',
    manualPrompt: '',
    customInstructions: '' // New field for custom generation instructions
  });

  // Load saved settings on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('product_generator_settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setProductParams(prev => ({
          ...prev,
          ...settings,
          language: 'English' // 强制设置为英文
        }));
        setShowAdvanced(settings.showAdvanced || false);
        setShowManualPrompt(settings.showManualPrompt || false);
        setShowModelSelector(settings.showModelSelector || false);
        setShowCustomInstructions(settings.showCustomInstructions || false);
        setSelectedModel(settings.selectedModel || null);
        setContentType(settings.contentType || 'both');
        console.log('Loaded saved product generator settings:', settings);
      } catch (error) {
        console.error('Error loading saved settings:', error);
      }
    }
  }, []);

  // Save settings whenever they change
  useEffect(() => {
    const settings = {
      ...productParams,
      showAdvanced,
      showManualPrompt,
      showModelSelector,
      showCustomInstructions,
      selectedModel,
      contentType
    };
    localStorage.setItem('product_generator_settings', JSON.stringify(settings));
    console.log('Saved product generator settings:', settings);
  }, [productParams, showAdvanced, showManualPrompt, showModelSelector, showCustomInstructions, selectedModel, contentType]);

  const handleParamChange = (key, value) => {
    const newParams = { ...productParams, [key]: value };
    setProductParams(newParams);
  };

  const handleModelSelect = (modelId) => {
    setSelectedModel(modelId);
  };

  const handleGenerate = () => {
    console.log('生成产品内容，参数:', { productParams, selectedModel, contentType });
    if (typeof onGenerateContent === 'function') {
      onGenerateContent(productParams, selectedModel, contentType);
    } else {
      console.error('onGenerateContent is not a function:', onGenerateContent);
    }
  };

  const paramOptions = {
    category: [
      'General', 'Fashion', 'Electronics', 'Home & Garden', 'Beauty & Health',
      'Sports & Outdoors', 'Toys & Games', 'Books & Media', 'Food & Beverages',
      'Automotive', 'Pet Supplies', 'Office Supplies', 'Jewelry', 'Tools & Hardware'
    ],
    targetAudience: [
      'General', 'Men', 'Women', 'Kids', 'Teens', 'Young Adults',
      'Professionals', 'Seniors', 'Students', 'Parents', 'Tech Enthusiasts', 'Fashion Lovers'
    ],
    platform: [
      'General', 'Amazon', 'eBay', 'Shopify', 'Etsy', 'Taobao', 'Tmall',
      'JD.com', 'Pinduoduo', 'WeChat Store', 'Douyin Shop', 'Xiaohongshu'
    ],
    tone: [
      'Professional', 'Friendly', 'Enthusiastic', 'Luxury', 'Casual',
      'Technical', 'Emotional', 'Urgent', 'Trustworthy', 'Innovative'
    ],
    language: [
      'English' // 只保留英文选项
    ],
    priceRange: [
      'Budget', 'Mid-range', 'Premium', 'Luxury'
    ],
    brandStyle: [
      'Modern', 'Classic', 'Minimalist', 'Bold', 'Elegant',
      'Playful', 'Professional', 'Trendy', 'Vintage', 'Tech-forward'
    ]
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <SafeIcon icon={FiShoppingBag} className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold text-gray-900">电商产品内容生成器 (英文输出)</h3>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowModelSelector(!showModelSelector)}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <SafeIcon icon={FiCpu} className="h-4 w-4" />
            <span>模型</span>
          </button>
          <button
            onClick={() => setShowCustomInstructions(!showCustomInstructions)}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <SafeIcon icon={FiMessageSquare} className="h-4 w-4" />
            <span>生成指令</span>
          </button>
          <button
            onClick={() => setShowManualPrompt(!showManualPrompt)}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <SafeIcon icon={FiEdit3} className="h-4 w-4" />
            <span>产品信息</span>
          </button>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <SafeIcon icon={FiSettings} className="h-4 w-4" />
            <span>{showAdvanced ? '隐藏高级' : '显示高级'}</span>
          </button>
        </div>
      </div>

      {/* Status Display */}
      <div className="mb-4 p-3 rounded-lg bg-gray-50">
        <div className="flex items-center space-x-2">
          <SafeIcon icon={hasDescription ? FiCheck : FiX} className={`h-4 w-4 ${hasDescription ? 'text-green-600' : 'text-red-600'}`} />
          <span className={`text-sm font-medium ${hasDescription ? 'text-green-700' : 'text-red-700'}`}>
            {hasDescription ? '图像已分析 - 可以生成产品内容 (英文)' : '请先分析产品图像'}
          </span>
        </div>
        {selectedModel && (
          <div className="flex items-center space-x-2 mt-2">
            <SafeIcon icon={FiCpu} className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-700">
              模型: {selectedModel}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Model Selection */}
        <AnimatePresence>
          {showModelSelector && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-b border-gray-200 pb-4"
            >
              <ModelSelector
                apiKey={apiKey}
                onModelSelect={handleModelSelect}
                selectedModel={selectedModel}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Custom Instructions Input */}
        <AnimatePresence>
          {showCustomInstructions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 pb-4 border-b border-gray-200"
            >
              <div className="flex items-center space-x-2 mb-3">
                <SafeIcon icon={FiMessageSquare} className="h-4 w-4 text-purple-600" />
                <h4 className="font-medium text-gray-900">自定义生成指令</h4>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  生成风格和要求 (英文)
                </label>
                <textarea
                  value={productParams.customInstructions || ''}
                  onChange={(e) => handleParamChange('customInstructions', e.target.value)}
                  placeholder="Enter specific instructions for content generation style. For example: 'Use persuasive marketing language', 'Focus on technical specifications', 'Emphasize luxury and premium quality', 'Write in a casual, friendly tone', 'Include emotional appeal', etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows="4"
                />
                <p className="text-xs text-gray-500 mt-1">
                  控制AI生成产品标题和描述的风格、语调和重点。这将直接影响最终生成内容的质量和风格。
                </p>
              </div>

              {/* Quick style presets */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">快速风格预设:</h5>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    'Use persuasive marketing language with emotional appeal',
                    'Focus on technical specifications and features',
                    'Emphasize luxury and premium quality',
                    'Write in casual, friendly tone for young audience',
                    'Professional B2B corporate style',
                    'Eco-friendly and sustainability focused'
                  ].map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => handleParamChange('customInstructions', preset)}
                      className="text-left p-2 text-xs bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 transition-colors"
                    >
                      {preset.length > 40 ? preset.substring(0, 40) + '...' : preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {productParams.customInstructions?.trim() && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <h5 className="text-sm font-medium text-purple-900 mb-2">生成指令预览:</h5>
                  <p className="text-sm text-purple-700 break-words">
                    {productParams.customInstructions}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Manual Prompt Input */}
        <AnimatePresence>
          {showManualPrompt && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 pb-4 border-b border-gray-200"
            >
              <div className="flex items-center space-x-2 mb-3">
                <SafeIcon icon={FiEdit3} className="h-4 w-4 text-blue-600" />
                <h4 className="font-medium text-gray-900">自定义产品信息</h4>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  关键特性描述 (英文)
                </label>
                <textarea
                  value={productParams.keyFeatures || ''}
                  onChange={(e) => handleParamChange('keyFeatures', e.target.value)}
                  placeholder="Enter product key features, selling points, advantages in English..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows="3"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  附加要求 (英文)
                </label>
                <textarea
                  value={productParams.manualPrompt || ''}
                  onChange={(e) => handleParamChange('manualPrompt', e.target.value)}
                  placeholder="Enter additional requirements in English, e.g., 'emphasize value for money', 'highlight premium quality', 'target young consumers'..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows="3"
                />
                <p className="text-xs text-gray-500 mt-1">
                  这将指导 AI 根据你的具体要求生成英文产品标题和描述。
                </p>
              </div>

              {/* Preview */}
              {(productParams.keyFeatures?.trim() || productParams.manualPrompt?.trim()) && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h5 className="text-sm font-medium text-blue-900 mb-2">产品信息预览:</h5>
                  {productParams.keyFeatures?.trim() && (
                    <p className="text-sm text-blue-700 mb-1">
                      <strong>关键特性:</strong> {productParams.keyFeatures}
                    </p>
                  )}
                  {productParams.manualPrompt?.trim() && (
                    <p className="text-sm text-blue-700">
                      <strong>附加要求:</strong> {productParams.manualPrompt}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            生成内容类型
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setContentType('title')}
              className={`p-3 rounded-lg border text-center transition-colors ${
                contentType === 'title'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <SafeIcon icon={FiTag} className="h-4 w-4 mx-auto mb-1" />
              <span className="text-sm font-medium">仅标题</span>
            </button>
            <button
              onClick={() => setContentType('description')}
              className={`p-3 rounded-lg border text-center transition-colors ${
                contentType === 'description'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <SafeIcon icon={FiFileText} className="h-4 w-4 mx-auto mb-1" />
              <span className="text-sm font-medium">仅描述</span>
            </button>
            <button
              onClick={() => setContentType('both')}
              className={`p-3 rounded-lg border text-center transition-colors ${
                contentType === 'both'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <SafeIcon icon={FiShoppingBag} className="h-4 w-4 mx-auto mb-1" />
              <span className="text-sm font-medium">标题+描述</span>
            </button>
          </div>
        </div>

        {/* Basic Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              产品类别
            </label>
            <select
              value={productParams.category}
              onChange={(e) => handleParamChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {paramOptions.category.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              目标受众
            </label>
            <select
              value={productParams.targetAudience}
              onChange={(e) => handleParamChange('targetAudience', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {paramOptions.targetAudience.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              销售平台
            </label>
            <select
              value={productParams.platform}
              onChange={(e) => handleParamChange('platform', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {paramOptions.platform.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              语调风格
            </label>
            <select
              value={productParams.tone}
              onChange={(e) => handleParamChange('tone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {paramOptions.tone.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Advanced Parameters */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 pt-4 border-t border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    输出语言
                  </label>
                  <select
                    value={productParams.language}
                    onChange={(e) => handleParamChange('language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    disabled={true} // 禁用选择，强制英文
                  >
                    {paramOptions.language.map(option => (
                      <option key={option} value={option}>
                        {option} (固定)
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    产品内容将以英文生成，适合国际市场
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    价格档次
                  </label>
                  <select
                    value={productParams.priceRange}
                    onChange={(e) => handleParamChange('priceRange', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {paramOptions.priceRange.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    品牌风格
                  </label>
                  <select
                    value={productParams.brandStyle}
                    onChange={(e) => handleParamChange('brandStyle', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {paramOptions.brandStyle.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!hasDescription || isGenerating}
          className="w-full mt-6 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {isGenerating ? (
            <>
              <SafeIcon icon={FiIcons.FiLoader} className="h-5 w-5 animate-spin" />
              <span>生成英文产品内容中...</span>
            </>
          ) : (
            <>
              <SafeIcon icon={FiShoppingBag} className="h-5 w-5" />
              <span>
                生成英文{contentType === 'title' ? '产品标题' : contentType === 'description' ? '产品描述' : '产品标题和描述'}
              </span>
              {selectedModel && <span className="text-green-200">({selectedModel.split('/')[1] || selectedModel})</span>}
            </>
          )}
        </button>

        {/* Help Text */}
        {!hasDescription && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              💡 <strong>提示:</strong> 请先上传产品图像并进行分析，然后基于图像内容生成英文产品标题和描述。
            </p>
          </div>
        )}

        {hasDescription && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700">
              ✅ <strong>就绪:</strong> 点击上方按钮生成专业的英文电商产品{contentType === 'title' ? '标题' : contentType === 'description' ? '描述' : '标题和描述'}。
            </p>
            {productParams.customInstructions?.trim() && (
              <p className="text-sm text-green-700 mt-1">
                🎨 <strong>生成风格:</strong> 将按照你设定的风格指令生成内容。
              </p>
            )}
            {(productParams.keyFeatures?.trim() || productParams.manualPrompt?.trim()) && (
              <p className="text-sm text-green-700 mt-1">
                🎯 <strong>自定义信息:</strong> 将根据你提供的产品特性和要求生成英文内容。
              </p>
            )}
            {selectedModel && (
              <p className="text-sm text-green-700 mt-1">
                🤖 <strong>AI 模型:</strong> 使用 {selectedModel} 进行高质量英文内容生成。
              </p>
            )}
            <p className="text-sm text-green-700 mt-1">
              🌍 <strong>语言输出:</strong> 所有内容将以英文生成，适合国际电商平台。
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProductTitleGenerator;