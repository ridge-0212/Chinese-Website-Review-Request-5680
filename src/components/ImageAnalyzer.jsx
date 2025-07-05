import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import VisionatiService from '../services/visionatiService';
import StraicoService from '../services/straicoService';
import ProductContentService from '../services/productContentService';
import ModelSelector from './ModelSelector';
import { useSettingsStore } from '../store/useStore';
import { copyPrompt } from '../utils/clipboard';
import toast from 'react-hot-toast';

const {
  FiUpload, FiImage, FiVideo, FiLink, FiLoader, FiCheck, FiX, FiEye, FiTag, FiPalette,
  FiSettings, FiCpu, FiZap, FiCopy, FiRefreshCw, FiEdit3, FiMessageSquare, FiShoppingBag
} = FiIcons;

const ImageAnalyzer = ({ apiKey, mode = 'prompt' }) => { // 添加 mode 属性
  const [analysisMode, setAnalysisMode] = useState('upload');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [results, setResults] = useState(null);
  const [generatedPrompts, setGeneratedPrompts] = useState([]);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPromptGenerator, setShowPromptGenerator] = useState(false);
  const [showManualPrompt, setShowManualPrompt] = useState(false);
  const [showVisionatiPrompt, setShowVisionatiPrompt] = useState(false);
  
  // 新增：产品内容生成相关状态
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showCustomInstructions, setShowCustomInstructions] = useState(false);
  const [showProductParams, setShowProductParams] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [contentType, setContentType] = useState('both');

  // Analysis configuration with localStorage persistence
  const [selectedFeatures, setSelectedFeatures] = useState(['tags', 'descriptions', 'colors', 'nsfw']);
  const [selectedBackends, setSelectedBackends] = useState(['openai', 'googlevision', 'clarifai']);
  const [selectedRole, setSelectedRole] = useState(mode === 'product' ? 'ecommerce' : 'general');
  const [language, setLanguage] = useState(mode === 'product' ? 'English' : 'English');
  const [tagScore, setTagScore] = useState(0.85);
  const [customPrompt, setCustomPrompt] = useState('');

  // Visionati analysis prompt
  const [visionatiPrompt, setVisionatiPrompt] = useState('');

  // Manual prompt configuration
  const [manualPrompt, setManualPrompt] = useState('');

  // 新增：产品内容生成参数
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
    customInstructions: ''
  });

  const { straicoKey, defaultTemplateParams } = useSettingsStore();
  const visionatiService = apiKey ? new VisionatiService(apiKey) : null;
  const straicoService = straicoKey ? new StraicoService(straicoKey) : null;
  const productContentService = straicoKey ? new ProductContentService(straicoKey) : null;

  // 根据模式设置默认值
  useEffect(() => {
    if (mode === 'product') {
      setSelectedRole('ecommerce');
      setLanguage('English');
      setSelectedFeatures(['tags', 'descriptions', 'colors', 'brands', 'texts']);
      setVisionatiPrompt('Analyze this product image and provide detailed descriptions in English focusing on e-commerce product features, benefits, and selling points suitable for online marketplace listings.');
    }
  }, [mode]);

  // Load saved settings on component mount
  useEffect(() => {
    const settingsKey = mode === 'product' ? 'advanced_product_analysis_settings' : 'advanced_analysis_settings';
    const savedSettings = localStorage.getItem(settingsKey);
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setSelectedFeatures(settings.selectedFeatures || (mode === 'product' ? ['tags', 'descriptions', 'colors', 'brands', 'texts'] : ['tags', 'descriptions', 'colors', 'nsfw']));
        setSelectedBackends(settings.selectedBackends || ['openai', 'googlevision', 'clarifai']);
        setSelectedRole(settings.selectedRole || (mode === 'product' ? 'ecommerce' : 'general'));
        setLanguage(settings.language || 'English');
        setTagScore(settings.tagScore || 0.85);
        setCustomPrompt(settings.customPrompt || '');
        setVisionatiPrompt(settings.visionatiPrompt || (mode === 'product' ? 'Analyze this product image and provide detailed descriptions in English focusing on e-commerce product features, benefits, and selling points suitable for online marketplace listings.' : ''));
        setManualPrompt(settings.manualPrompt || '');
        setShowAdvanced(settings.showAdvanced || false);
        setShowManualPrompt(settings.showManualPrompt || false);
        setShowVisionatiPrompt(settings.showVisionatiPrompt || false);
        
        // 新增：加载产品内容生成设置
        setShowModelSelector(settings.showModelSelector || false);
        setShowCustomInstructions(settings.showCustomInstructions || false);
        setShowProductParams(settings.showProductParams || false);
        setSelectedModel(settings.selectedModel || null);
        setContentType(settings.contentType || 'both');
        setProductParams(prev => ({
          ...prev,
          ...settings.productParams,
          language: 'English'
        }));
        
        console.log('Loaded saved advanced analysis settings:', settings);
      } catch (error) {
        console.error('Error loading saved settings:', error);
      }
    }
  }, [mode]);

  // Save settings whenever they change
  const saveSettings = useCallback(() => {
    const settings = {
      selectedFeatures,
      selectedBackends,
      selectedRole,
      language,
      tagScore,
      customPrompt,
      visionatiPrompt,
      manualPrompt,
      showAdvanced,
      showManualPrompt,
      showVisionatiPrompt,
      // 新增：保存产品内容生成设置
      showModelSelector,
      showCustomInstructions,
      showProductParams,
      selectedModel,
      contentType,
      productParams
    };
    const settingsKey = mode === 'product' ? 'advanced_product_analysis_settings' : 'advanced_analysis_settings';
    localStorage.setItem(settingsKey, JSON.stringify(settings));
    console.log('Saved advanced analysis settings:', settings);
  }, [
    selectedFeatures, selectedBackends, selectedRole, language, tagScore, customPrompt,
    visionatiPrompt, manualPrompt, showAdvanced, showManualPrompt, showVisionatiPrompt,
    showModelSelector, showCustomInstructions, showProductParams, selectedModel,
    contentType, productParams, mode
  ]);

  // Save settings whenever any setting changes
  useEffect(() => {
    saveSettings();
  }, [saveSettings]);

  // 新增：处理产品参数变化
  const handleProductParamChange = (key, value) => {
    const newParams = { ...productParams, [key]: value };
    setProductParams(newParams);
  };

  // 新增：处理模型选择
  const handleModelSelect = (modelId) => {
    setSelectedModel(modelId);
  };

  // Available features
  const features = [
    { id: 'tags', label: '标签', icon: FiTag, description: '从内容中提取相关标签' },
    { id: 'descriptions', label: '描述', icon: FiEye, description: '生成详细描述' },
    { id: 'colors', label: '颜色', icon: FiPalette, description: '分析主要颜色' },
    { id: 'nsfw', label: 'NSFW检查', icon: FiCheck, description: '内容安全分析' },
    { id: 'faces', label: '人脸', icon: FiEye, description: '检测图像中的人脸' },
    { id: 'texts', label: '文字检测', icon: FiEye, description: '从图像中提取文字' },
    { id: 'brands', label: '品牌检测', icon: FiTag, description: '识别品牌和标志' }
  ];

  // Available AI backends
  const backends = [
    { id: 'openai', label: 'OpenAI', icon: FiZap, recommended: true, description: 'GPT-4 Vision 详细分析' },
    { id: 'googlevision', label: 'Google Vision', icon: FiEye, recommended: true, description: 'Google 计算机视觉 API' },
    { id: 'clarifai', label: 'Clarifai', icon: FiCpu, recommended: true, description: '先进的图像识别' },
    { id: 'gemini', label: 'Gemini', icon: FiZap, recommended: true, description: 'Google 多模态 AI' },
    { id: 'claude', label: 'Claude', icon: FiZap, recommended: true, description: 'Anthropic 视觉模型' },
    { id: 'grok', label: 'Grok', icon: FiZap, recommended: true, description: 'X 的 AI 视觉模型' },
    { id: 'llava', label: 'LLaVA', icon: FiCpu, recommended: false, description: '大型语言和视觉助手' },
    { id: 'bakllava', label: 'BakLLaVA', icon: FiCpu, recommended: false, description: '增强型 LLaVA 模型' },
    { id: 'jinaai', label: 'Jina AI', icon: FiCpu, recommended: false, description: 'Jina 多模态 AI' },
    { id: 'imagga', label: 'Imagga', icon: FiImage, recommended: false, description: '图像识别和标记' },
    { id: 'rekognition', label: 'AWS Rekognition', icon: FiEye, recommended: false, description: 'Amazon 图像分析' }
  ];

  // Available roles
  const roles = [
    { id: 'general', label: '通用', description: '默认通用分析' },
    { id: 'artist', label: '艺术家', description: '艺术解读和分析' },
    { id: 'caption', label: '标题', description: '简短、精确的标题' },
    { id: 'comedian', label: '幽默', description: '幽默的描述' },
    { id: 'critic', label: '评论家', description: '详细的批评分析' },
    { id: 'ecommerce', label: '电商', description: '在线商店的产品描述' },
    { id: 'inspector', label: '检查员', description: '最详细、全面的检查' },
    { id: 'promoter', label: '推广员', description: '营销导向的描述' },
    { id: 'prompt', label: '提示词生成器', description: '为 AI 艺术创作生成提示词' },
    { id: 'realtor', label: '房产', description: '房产和房地产描述' },
    { id: 'tweet', label: '推文', description: '社交媒体友好的描述' }
  ];

  // Popular languages
  const languages = [
    'English', 'Chinese', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
    'Russian', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Dutch', 'Swedish',
    'Norwegian', 'Danish', 'Finnish'
  ];

  // 新增：产品参数选项
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
    priceRange: [
      'Budget', 'Mid-range', 'Premium', 'Luxury'
    ],
    brandStyle: [
      'Modern', 'Classic', 'Minimalist', 'Bold', 'Elegant',
      'Playful', 'Professional', 'Trendy', 'Vintage', 'Tech-forward'
    ]
  };

  // Preset prompts for Visionati analysis
  const presetVisionatiPrompts = mode === 'product' ? [
    {
      name: 'E-commerce Product Focus',
      prompt: 'Analyze this product image and provide detailed descriptions in English focusing on e-commerce product features, benefits, and selling points suitable for online marketplace listings.'
    },
    {
      name: 'Product Features & Benefits',
      prompt: 'Describe this product focusing on its key features, benefits, target audience, and competitive advantages. Include details about materials, functionality, and value proposition.'
    },
    {
      name: 'Marketing & Sales Focus',
      prompt: 'Analyze this product from a marketing perspective, highlighting selling points, target demographics, usage scenarios, and promotional angles for e-commerce platforms.'
    },
    {
      name: 'Technical Product Details',
      prompt: 'Provide technical analysis of this product including specifications, build quality, materials, dimensions, and functional characteristics relevant for product listings.'
    },
    {
      name: 'Brand & Style Analysis',
      prompt: 'Focus on the brand positioning, design style, aesthetic appeal, and market positioning of this product for brand-conscious consumers.'
    },
    {
      name: 'Customer Value Proposition',
      prompt: 'Analyze this product from a customer value perspective, focusing on problem-solving capabilities, user benefits, and reasons to purchase.'
    }
  ] : [
    {
      name: 'Art-focused Analysis',
      prompt: 'Analyze this image with focus on artistic elements, composition, lighting, color palette, style, and mood. Provide detailed description suitable for AI art prompt generation.'
    },
    {
      name: 'Photography Analysis',
      prompt: 'Describe this image from a photographer\'s perspective, including camera angle, lighting conditions, depth of field, composition techniques, and photographic style.'
    },
    {
      name: 'Detailed Scene Description',
      prompt: 'Provide a comprehensive description of this scene including all visible objects, their positions, colors, textures, lighting, atmosphere, and overall mood.'
    },
    {
      name: 'Character & Portrait Focus',
      prompt: 'Focus on describing people or characters in this image, including their appearance, clothing, expressions, poses, and the environment around them.'
    },
    {
      name: 'Environment & Landscape',
      prompt: 'Describe the environment, landscape, or setting in detail, including natural elements, architecture, weather conditions, and spatial relationships.'
    },
    {
      name: 'Technical & Professional',
      prompt: 'Provide a technical analysis of this image including visual elements, design principles, color theory, and professional photography/art techniques used.'
    }
  ];

  const handleFileUpload = useCallback((event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResults(null);
      setGeneratedPrompts([]);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  }, []);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError(null);
      setResults(null);
      setGeneratedPrompts([]);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target.result);
      };
      reader.readAsDataURL(droppedFile);
    }
  }, []);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
  }, []);

  const handleUrlChange = (event) => {
    setUrl(event.target.value);
    setError(null);
    setResults(null);
    setGeneratedPrompts([]);
    setFilePreview(null);
  };

  const analyzeContent = async () => {
    if (!visionatiService) {
      setError('请先配置您的 Visionati API 密钥');
      return;
    }

    if (!file && !url) {
      setError('请上传文件或输入 URL');
      return;
    }

    if (selectedFeatures.length === 0) {
      setError('请选择至少一个分析功能');
      return;
    }

    if (selectedBackends.length === 0) {
      setError('请选择至少一个 AI 后端');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResults(null);
    setGeneratedPrompts([]);

    try {
      const analysisOptions = {
        features: selectedFeatures,
        backends: selectedBackends,
        role: selectedRole,
        language: language,
        tag_score: tagScore
      };

      // Use Visionati custom prompt if provided, otherwise use customPrompt
      const finalPrompt = visionatiPrompt.trim() || customPrompt.trim();
      if (finalPrompt) {
        analysisOptions.prompt = finalPrompt;
      }

      if (analysisMode === 'upload' && file) {
        analysisOptions.file = file;
      } else if (analysisMode === 'url' && url) {
        analysisOptions.url = url;
      }

      console.log('开始分析，选项:', analysisOptions);
      const result = await visionatiService.analyzeImage(analysisOptions);
      console.log('分析结果:', result);

      setResults(result);

      // Show prompt generator if we have description
      if (result.description) {
        setShowPromptGenerator(true);
      }

      // Update user stats
      if (window.updateUserStats) {
        window.updateUserStats('total_analyses', 1);
      }

      toast.success('分析完成成功！');
    } catch (err) {
      console.error('分析错误:', err);
      setError(err.message);
      toast.error('分析失败: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generatePrompts = async () => {
    if (!results?.description) {
      setError(mode === 'product' ? '没有可用的描述来生成产品内容' : '没有可用的描述来生成提示词');
      return;
    }

    if (mode === 'product') {
      if (!productContentService) {
        setError('请在设置中配置您的 Straico API 密钥');
        return;
      }
    } else {
      if (!straicoService) {
        setError('请在设置中配置您的 Straico API 密钥');
        return;
      }
    }

    setIsGeneratingPrompts(true);
    setError(null);

    try {
      let prompts;
      if (mode === 'product') {
        // Generate product content
        const templateParams = {
          ...defaultTemplateParams,
          ...productParams,
          manualPrompt: manualPrompt
        };
        prompts = await productContentService.generateProductContent(
          results.description,
          templateParams,
          selectedModel,
          contentType
        );
      } else {
        // Generate AI art prompts
        const templateParams = {
          ...defaultTemplateParams,
          manualPrompt: manualPrompt
        };
        prompts = await straicoService.generatePrompts(results.description, templateParams, selectedModel);
      }

      setGeneratedPrompts(prompts);

      // Update user stats
      if (window.updateUserStats) {
        window.updateUserStats('total_prompts', prompts.length);
      }

      const contentType = mode === 'product' ? '产品内容' : 'AI 艺术提示词';
      toast.success(`生成了 ${prompts.length} 个${contentType}！`);
    } catch (err) {
      console.error('内容生成错误:', err);
      setError(err.message);
      const errorType = mode === 'product' ? '产品内容' : '提示词';
      toast.error(`${errorType}生成失败: ` + err.message);
    } finally {
      setIsGeneratingPrompts(false);
    }
  };

  const toggleFeature = (featureId) => {
    setSelectedFeatures(prev =>
      prev.includes(featureId)
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };

  const toggleBackend = (backendId) => {
    setSelectedBackends(prev =>
      prev.includes(backendId)
        ? prev.filter(id => id !== backendId)
        : [...prev, backendId]
    );
  };

  const selectRecommendedBackends = () => {
    const recommended = backends.filter(b => b.recommended).map(b => b.id);
    setSelectedBackends(recommended);
  };

  const selectAllBackends = () => {
    setSelectedBackends(backends.map(b => b.id));
  };

  const clearFile = () => {
    setFile(null);
    setFilePreview(null);
    setResults(null);
    setGeneratedPrompts([]);
    setError(null);
  };

  const applyPresetPrompt = (prompt) => {
    setVisionatiPrompt(prompt);
    toast.success('预设提示词已应用！');
  };

  // Rest of the component remains the same...
  const renderResults = () => {
    if (!results || !results.all || !results.all.assets) return null;

    const asset = results.all.assets[0];
    if (!asset) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <SafeIcon icon={FiCheck} className="h-5 w-5 text-green-600" />
            <h3 className="font-medium text-green-900">分析完成</h3>
          </div>
          <p className="text-sm text-green-700 mt-1">
            使用积分: {results.credits_paid} | 剩余: {results.credits}
          </p>
          <p className="text-sm text-green-700">
            使用的后端: {selectedBackends.join(', ')}
          </p>
          {(visionatiPrompt.trim() || customPrompt.trim()) && (
            <p className="text-sm text-green-700 mt-1">
              ✓ 使用了自定义分析提示词
            </p>
          )}
        </div>

        {/* Tags */}
        {asset.tags && Object.keys(asset.tags).length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <SafeIcon icon={FiTag} className="h-4 w-4 mr-2" />
              标签
            </h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(asset.tags).map(([tag, data]) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  title={`来源: ${data.map(d => d.source).join(', ')}`}
                >
                  {tag} ({(data[0].score * 100).toFixed(1)}%)
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Descriptions */}
        {asset.descriptions && asset.descriptions.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <SafeIcon icon={FiEye} className="h-4 w-4 mr-2" />
              描述
            </h4>
            <div className="space-y-3">
              {asset.descriptions.map((desc, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <p className="text-gray-700">{desc.description}</p>
                  <p className="text-xs text-gray-500 mt-1">来源: {desc.source}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Colors */}
        {asset.colors && Object.keys(asset.colors).length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <SafeIcon icon={FiPalette} className="h-4 w-4 mr-2" />
              主要颜色
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Object.entries(asset.colors).slice(0, 8).map(([hex, data]) => (
                <div key={hex} className="flex items-center space-x-2">
                  <div
                    className="w-8 h-8 rounded-lg border border-gray-300"
                    style={{ backgroundColor: hex }}
                  />
                  <div>
                    <p className="text-xs font-mono text-gray-600">{hex}</p>
                    <p className="text-xs text-gray-500">
                      {(data[0].pixel_fraction * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NSFW Check */}
        {asset.nsfw && asset.nsfw.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="font-medium text-gray-900 mb-3">内容安全</h4>
            <div className="space-y-2">
              {asset.nsfw.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span className={`text-sm font-medium ${item.label === 'sfw' || item.label === 'safe' ? 'text-green-600' : 'text-red-600'}`}>
                    {item.score ? `${(item.score * 100).toFixed(1)}%` : item.likelihood}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Faces */}
        {asset.faces && asset.faces.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="font-medium text-gray-900 mb-3">人脸检测</h4>
            <p className="text-sm text-gray-600">
              检测到 {asset.faces.length} 张人脸
            </p>
          </div>
        )}

        {/* Text Detection */}
        {asset.texts && asset.texts.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="font-medium text-gray-900 mb-3">文字检测</h4>
            <div className="space-y-2">
              {asset.texts.map((text, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded">
                  <p className="text-sm text-gray-700">{text.text}</p>
                  {text.confidence && (
                    <p className="text-xs text-gray-500">
                      置信度: {(text.confidence * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Brands */}
        {asset.brands && asset.brands.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="font-medium text-gray-900 mb-3">品牌检测</h4>
            <div className="flex flex-wrap gap-2">
              {asset.brands.map((brand, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                >
                  {brand.name} ({(brand.confidence * 100).toFixed(1)}%)
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Errors */}
        {results.all.errors && results.all.errors.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">警告</h4>
            <div className="space-y-1">
              {results.all.errors.map((error, index) => (
                <p key={index} className="text-sm text-yellow-800">
                  {error}
                </p>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  if (!apiKey) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <SafeIcon icon={FiX} className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">需要 API 密钥</h3>
          <p className="text-gray-600">请配置您的 Visionati API 密钥以使用图像分析功能。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analysis Mode Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          <SafeIcon icon={FiImage} className="inline h-5 w-5 mr-2" />
          {mode === 'product' ? '高级产品图像分析' : '高级图像和视频分析'}
        </h2>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setAnalysisMode('upload')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              analysisMode === 'upload'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <SafeIcon icon={FiUpload} className="inline h-4 w-4 mr-2" />
            上传文件
          </button>
          <button
            onClick={() => setAnalysisMode('url')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              analysisMode === 'url'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <SafeIcon icon={FiLink} className="inline h-4 w-4 mr-2" />
            URL 链接
          </button>
        </div>

        {/* File Upload */}
        {analysisMode === 'upload' && (
          <div className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
            >
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
                id="advanced-file-upload"
              />
              <label htmlFor="advanced-file-upload" className="cursor-pointer">
                <SafeIcon icon={FiUpload} className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  {file ? file.name : '点击上传或拖放文件'}
                </p>
                <p className="text-sm text-gray-500">
                  图像和视频，最大 10MB
                </p>
              </label>
            </div>

            {/* File Preview */}
            {file && filePreview && (
              <div className="relative">
                <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                  <img
                    src={filePreview}
                    alt="预览"
                    className="max-h-48 max-w-full rounded-lg shadow-sm"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">{file.name}</p>
                    <p>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button
                    onClick={clearFile}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <SafeIcon icon={FiX} className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* URL Input */}
        {analysisMode === 'url' && (
          <div className="space-y-4">
            <input
              type="url"
              value={url}
              onChange={handleUrlChange}
              placeholder="输入图像或视频 URL"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {/* URL Preview */}
            {url && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">预览:</p>
                <img
                  src={url}
                  alt="URL 预览"
                  className="max-h-48 max-w-full rounded-lg shadow-sm"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div className="hidden text-sm text-red-600">
                  无法从 URL 加载图像
                </div>
              </div>
            )}
          </div>
        )}

        {/* Visionati Analysis Prompt Configuration */}
        <div className="mt-6 space-y-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiMessageSquare} className="h-5 w-5 text-green-600" />
              <h3 className="font-medium text-gray-900">Analysis Prompt Configuration</h3>
            </div>
            <button
              onClick={() => setShowVisionatiPrompt(!showVisionatiPrompt)}
              className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <SafeIcon icon={FiMessageSquare} className="h-4 w-4" />
              <span>{showVisionatiPrompt ? 'Hide' : 'Configure'} Analysis Prompt</span>
            </button>
          </div>

          {/* Visionati Prompt Input */}
          <AnimatePresence>
            {showVisionatiPrompt && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Custom Analysis Instruction</h4>
                  <p className="text-sm text-green-700 mb-3">
                    {mode === 'product'
                      ? 'Define how Visionati should analyze your product image to generate descriptions suitable for e-commerce.'
                      : 'Define how Visionati should analyze your image to generate descriptions that match your requirements.'
                    }
                  </p>

                  {/* Preset Prompts */}
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-green-900 mb-2">Quick Presets:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {presetVisionatiPrompts.map((preset, index) => (
                        <button
                          key={index}
                          onClick={() => applyPresetPrompt(preset.prompt)}
                          className="text-left p-2 text-xs bg-white border border-green-300 rounded hover:bg-green-50 transition-colors"
                          title={preset.prompt}
                        >
                          <span className="font-medium text-green-800">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    value={visionatiPrompt}
                    onChange={(e) => setVisionatiPrompt(e.target.value)}
                    placeholder={mode === 'product'
                      ? "Enter custom analysis instructions for product images. For example: 'Focus on product features and benefits for e-commerce listings' or 'Emphasize product quality and value proposition'"
                      : "Enter custom analysis instructions for Visionati. For example: 'Focus on artistic composition and lighting details for AI art generation' or 'Describe this image emphasizing photographic techniques and visual aesthetics'"
                    }
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    rows="4"
                  />

                  <div className="mt-2 flex items-start space-x-2">
                    <SafeIcon icon={FiCheck} className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-green-700">
                      {mode === 'product'
                        ? 'This instruction will guide how Visionati analyzes your product image, ensuring the generated description aligns with e-commerce requirements.'
                        : 'This instruction will guide how Visionati analyzes your image, ensuring the generated description aligns with your specific needs for AI art prompt creation.'
                      }
                    </p>
                  </div>

                  {/* Current prompt preview */}
                  {visionatiPrompt?.trim() && (
                    <div className="mt-3 p-3 bg-white border border-green-300 rounded-lg">
                      <h6 className="text-xs font-medium text-green-900 mb-1">Current Analysis Instruction:</h6>
                      <p className="text-xs text-green-700 break-words">
                        {visionatiPrompt}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Analysis status indicator */}
          <div className="flex items-center space-x-2 text-sm">
            <SafeIcon icon={visionatiPrompt.trim() ? FiCheck : FiMessageSquare} className={`h-4 w-4 ${visionatiPrompt.trim() ? 'text-green-600' : 'text-gray-400'}`} />
            <span className={visionatiPrompt.trim() ? 'text-green-700' : 'text-gray-500'}>
              {visionatiPrompt.trim() ? 'Custom analysis prompt configured' : 'Using default analysis (click to customize)'}
            </span>
          </div>
        </div>

        {/* Advanced Settings Toggle */}
        <div className="mt-6 flex items-center justify-between">
          <h3 className="font-medium text-gray-900">分析配置</h3>
          <div className="flex space-x-2">
            {/* 新增：产品内容生成控制按钮 */}
            {mode === 'product' && (
              <>
                <button
                  onClick={() => setShowModelSelector(!showModelSelector)}
                  className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <SafeIcon icon={FiCpu} className="h-4 w-4" />
                  <span>模型选择</span>
                </button>
                <button
                  onClick={() => setShowCustomInstructions(!showCustomInstructions)}
                  className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <SafeIcon icon={FiMessageSquare} className="h-4 w-4" />
                  <span>生成指令</span>
                </button>
                <button
                  onClick={() => setShowProductParams(!showProductParams)}
                  className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <SafeIcon icon={FiShoppingBag} className="h-4 w-4" />
                  <span>产品参数</span>
                </button>
              </>
            )}
            <button
              onClick={() => setShowManualPrompt(!showManualPrompt)}
              className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <SafeIcon icon={FiEdit3} className="h-4 w-4" />
              <span>{mode === 'product' ? 'Product Content Generation' : 'Prompt Generation'}</span>
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

        {/* 新增：Model Selection */}
        {mode === 'product' && (
          <AnimatePresence>
            {showModelSelector && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 space-y-4 pt-4 border-t border-gray-200"
              >
                <ModelSelector
                  apiKey={straicoKey}
                  onModelSelect={handleModelSelect}
                  selectedModel={selectedModel}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* 新增：Custom Instructions Input */}
        {mode === 'product' && (
          <AnimatePresence>
            {showCustomInstructions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 space-y-4 pt-4 border-t border-gray-200"
              >
                <div className="flex items-center space-x-2 mb-3">
                  <SafeIcon icon={FiMessageSquare} className="h-4 w-4 text-purple-600" />
                  <h4 className="font-medium text-gray-900">自定义生成指令 (Product Content)</h4>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    生成风格和要求 (英文)
                  </label>
                  <textarea
                    value={productParams.customInstructions || ''}
                    onChange={(e) => handleProductParamChange('customInstructions', e.target.value)}
                    placeholder="Enter specific instructions for content generation style. For example: 'Use persuasive marketing language', 'Focus on technical specifications', 'Emphasize luxury and premium quality'..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows="4"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    控制AI生成产品标题和描述的风格、语调和重点。
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
                        onClick={() => handleProductParamChange('customInstructions', preset)}
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
        )}

        {/* 新增：Product Parameters Configuration */}
        {mode === 'product' && (
          <AnimatePresence>
            {showProductParams && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 space-y-4 pt-4 border-t border-gray-200"
              >
                <div className="flex items-center space-x-2 mb-3">
                  <SafeIcon icon={FiShoppingBag} className="h-4 w-4 text-green-600" />
                  <h4 className="font-medium text-gray-900">产品内容生成参数</h4>
                </div>

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
                      <SafeIcon icon={FiEdit3} className="h-4 w-4 mx-auto mb-1" />
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
                      onChange={(e) => handleProductParamChange('category', e.target.value)}
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
                      onChange={(e) => handleProductParamChange('targetAudience', e.target.value)}
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
                      onChange={(e) => handleProductParamChange('platform', e.target.value)}
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
                      onChange={(e) => handleProductParamChange('tone', e.target.value)}
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

                {/* Additional Product Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      关键特性描述 (英文)
                    </label>
                    <textarea
                      value={productParams.keyFeatures || ''}
                      onChange={(e) => handleProductParamChange('keyFeatures', e.target.value)}
                      placeholder="Enter product key features, selling points, advantages in English..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                      rows="3"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Manual Prompt Configuration */}
        {showManualPrompt && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 space-y-4 pt-4 border-t border-gray-200"
          >
            <div className="flex items-center space-x-2 mb-3">
              <SafeIcon icon={FiEdit3} className="h-4 w-4 text-blue-600" />
              <h4 className="font-medium text-gray-900">
                {mode === 'product' ? 'Product Content Generation Instructions' : 'Prompt Generation Instructions'}
              </h4>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {mode === 'product' ? 'Custom Instructions for Product Content Generation' : 'Custom Instructions for Final Prompt Generation'}
              </label>
              <textarea
                value={manualPrompt}
                onChange={(e) => setManualPrompt(e.target.value)}
                placeholder={mode === 'product'
                  ? "Enter specific instructions for product content generation. For example: 'Emphasize premium quality', 'Target young consumers', 'Highlight eco-friendly features'..."
                  : "Enter specific instructions for final AI art prompt generation. For example: 'Focus on lighting and composition', 'Emphasize realistic textures', 'Create cinematic atmosphere'..."
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="4"
              />
              <p className="text-xs text-gray-500 mt-1">
                {mode === 'product'
                  ? 'This will guide the final product content generation step (different from image analysis above).'
                  : 'This will guide the final AI art prompt generation step (different from image analysis above).'
                }
              </p>
            </div>

            {/* Manual prompt preview */}
            {manualPrompt?.trim() && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h5 className="text-sm font-medium text-blue-900 mb-2">
                  {mode === 'product' ? 'Product Content Instructions:' : 'Final Prompt Instructions:'}
                </h5>
                <p className="text-sm text-blue-700 break-words">
                  {manualPrompt}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Feature Selection */}
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-3">分析功能</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {features.map((feature) => (
              <button
                key={feature.id}
                onClick={() => toggleFeature(feature.id)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  selectedFeatures.includes(feature.id)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
                title={feature.description}
              >
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={feature.icon} className="h-4 w-4" />
                  <span className="text-sm font-medium">{feature.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* AI Backend Selection */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">AI 后端</h4>
            <div className="flex space-x-2">
              <button
                onClick={selectRecommendedBackends}
                className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              >
                推荐
              </button>
              <button
                onClick={selectAllBackends}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                全选
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {backends.map((backend) => (
              <button
                key={backend.id}
                onClick={() => toggleBackend(backend.id)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  selectedBackends.includes(backend.id)
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
                title={backend.description}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <SafeIcon icon={backend.icon} className="h-4 w-4" />
                    <span className="text-sm font-medium">{backend.label}</span>
                  </div>
                  {backend.recommended && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      ⭐
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            已选择: {selectedBackends.length} 个后端。更多后端=更高成本但更好的准确性。
          </p>
        </div>

        {/* Advanced Settings */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-6 border-t border-gray-200 space-y-4"
            >
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分析角色
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id} title={role.description}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {roles.find(r => r.id === selectedRole)?.description}
                </p>
              </div>

              {/* Custom Prompt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Legacy 自定义提示词 (可选)
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="输入自定义提示词来覆盖选择的角色..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                />
                <p className="text-xs text-gray-500 mt-1">
                  注意: 如果上方设置了 Analysis Prompt，将优先使用上方的设置。
                </p>
              </div>

              {/* Language Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  语言
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {languages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang === 'Chinese' ? '中文' : lang}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tag Score Threshold */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  标签分数阈值: {tagScore}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={tagScore}
                  onChange={(e) => setTagScore(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0 (所有标签)</span>
                  <span>1 (仅高置信度)</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cost Estimation */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">成本估算</h4>
          <div className="text-sm text-gray-600">
            <p>功能: {selectedFeatures.length} × 后端: {selectedBackends.length}</p>
            <p>估计成本: ~{Math.max(1, Math.min(6, selectedFeatures.length * selectedBackends.length / 2))} 积分</p>
          </div>
        </div>

        {/* Analyze Button */}
        <button
          onClick={analyzeContent}
          disabled={isAnalyzing || (!file && !url) || selectedFeatures.length === 0 || selectedBackends.length === 0}
          className="w-full mt-6 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isAnalyzing ? (
            <>
              <SafeIcon icon={FiLoader} className="inline h-4 w-4 mr-2 animate-spin" />
              使用 {selectedBackends.length} 个 AI 后端分析中...
            </>
          ) : (
            <>
              <SafeIcon icon={FiEye} className="inline h-4 w-4 mr-2" />
              {mode === 'product' ? '分析产品图像' : '分析内容'}
              {visionatiPrompt.trim() && <span className="ml-1 text-green-200">(自定义分析)</span>}
            </>
          )}
        </button>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <div className="flex items-center">
                <SafeIcon icon={FiX} className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results */}
      {results && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">分析结果</h3>
          {renderResults()}
        </div>
      )}

      {/* Content Generator */}
      {showPromptGenerator && results?.description && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <SafeIcon icon={mode === 'product' ? FiShoppingBag : FiZap} className={`h-5 w-5 ${mode === 'product' ? 'text-green-600' : 'text-purple-600'}`} />
              <h3 className="text-lg font-semibold text-gray-900">
                {mode === 'product' ? 'Product Content Generator' : 'AI Prompt Generator'}
              </h3>
            </div>
            {!straicoKey && (
              <div className="text-sm text-red-600">
                Configure Straico API key in settings
              </div>
            )}
          </div>

          <div className="p-4 bg-gray-50 rounded-lg mb-4">
            <p className="text-sm text-gray-600 mb-2">Based on analysis:</p>
            <p className="text-gray-700">{results.description}</p>
          </div>

          {/* Manual prompt display for advanced mode */}
          {manualPrompt?.trim() && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <h5 className="text-sm font-medium text-blue-900 mb-2">
                {mode === 'product' ? 'Product Content Instructions:' : 'Final Prompt Instructions:'}
              </h5>
              <p className="text-sm text-blue-700 break-words">
                {manualPrompt}
              </p>
            </div>
          )}

          {/* 新增：显示产品内容生成配置 */}
          {mode === 'product' && (
            <div className="space-y-3 mb-4">
              {selectedModel && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <h5 className="text-sm font-medium text-green-900 mb-1">Selected AI Model:</h5>
                  <p className="text-sm text-green-700">{selectedModel}</p>
                </div>
              )}
              
              {productParams.customInstructions?.trim() && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <h5 className="text-sm font-medium text-purple-900 mb-1">Generation Style:</h5>
                  <p className="text-sm text-purple-700">{productParams.customInstructions}</p>
                </div>
              )}
              
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h5 className="text-sm font-medium text-blue-900 mb-1">Content Settings:</h5>
                <div className="text-sm text-blue-700 grid grid-cols-2 gap-2">
                  <p>Type: {contentType === 'title' ? 'Titles Only' : contentType === 'description' ? 'Descriptions Only' : 'Titles & Descriptions'}</p>
                  <p>Category: {productParams.category}</p>
                  <p>Platform: {productParams.platform}</p>
                  <p>Audience: {productParams.targetAudience}</p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={generatePrompts}
            disabled={isGeneratingPrompts || !straicoKey}
            className={`w-full ${mode === 'product' ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'} text-white py-3 px-6 rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors`}
          >
            {isGeneratingPrompts ? (
              <>
                <SafeIcon icon={FiLoader} className="inline h-4 w-4 mr-2 animate-spin" />
                {mode === 'product' ? 'Generating Product Content...' : 'Generating AI Art Prompts...'}
              </>
            ) : (
              <>
                <SafeIcon icon={mode === 'product' ? FiShoppingBag : FiZap} className="inline h-4 w-4 mr-2" />
                {mode === 'product' ? 'Generate Product Content' : 'Generate AI Art Prompts'}
                {selectedModel && <span className="ml-2 text-green-200">({selectedModel.split('/')[1] || selectedModel})</span>}
              </>
            )}
          </button>
        </div>
      )}

      {/* Generated Content */}
      {generatedPrompts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <SafeIcon icon={mode === 'product' ? FiShoppingBag : FiZap} className={`h-5 w-5 ${mode === 'product' ? 'text-green-600' : 'text-purple-600'}`} />
              <h3 className="text-lg font-semibold text-gray-900">
                {mode === 'product' ? 'Generated Product Content' : 'Generated AI Art Prompts'}
              </h3>
              <span className={`px-2 py-1 ${mode === 'product' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'} text-xs rounded-full`}>
                {generatedPrompts.length}
              </span>
            </div>
            <button
              onClick={generatePrompts}
              disabled={isGeneratingPrompts}
              className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <SafeIcon icon={FiRefreshCw} className="h-4 w-4" />
              <span>Regenerate</span>
            </button>
          </div>

          <div className="space-y-4">
            {generatedPrompts.map((prompt, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {prompt.variation || `${mode === 'product' ? 'Product Content' : 'Prompt'} ${index + 1}`}
                  </span>
                  <button
                    onClick={() => copyPrompt(prompt)}
                    className={`${mode === 'product' ? 'text-green-600 hover:text-green-700' : 'text-purple-600 hover:text-purple-700'} p-1`}
                  >
                    <SafeIcon icon={FiCopy} className="h-4 w-4" />
                  </button>
                </div>

                {mode === 'product' ? (
                  <div className="space-y-3">
                    {prompt.title && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Product Title</h4>
                        <p className="text-gray-900 font-medium leading-relaxed">
                          {prompt.title}
                        </p>
                      </div>
                    )}
                    {prompt.description && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Product Description</h4>
                        <p className="text-gray-700 leading-relaxed text-sm">
                          {prompt.description}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {prompt.text}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                  <span>Style: {prompt.style}</span>
                  <span>{new Date(prompt.timestamp).toLocaleTimeString()}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageAnalyzer;