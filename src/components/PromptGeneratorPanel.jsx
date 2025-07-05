import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useSettingsStore } from '../store/useStore';

const { FiZap, FiSettings, FiRefreshCw, FiCheck, FiX, FiEdit3 } = FiIcons;

const PromptGeneratorPanel = ({ onGeneratePrompts, isGenerating, hasDescription }) => {
  const { defaultTemplateParams, setDefaultTemplateParams } = useSettingsStore();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showManualPrompt, setShowManualPrompt] = useState(false);
  const [templateParams, setTemplateParams] = useState({
    ...defaultTemplateParams,
    manualPrompt: defaultTemplateParams.manualPrompt || ''
  });

  // Load saved settings on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('simple_prompt_settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setTemplateParams(prev => ({ ...prev, ...settings }));
        setShowAdvanced(settings.showAdvanced || false);
        setShowManualPrompt(settings.showManualPrompt || false);
        console.log('Loaded saved simple prompt settings:', settings);
      } catch (error) {
        console.error('Error loading saved settings:', error);
      }
    }
  }, []);

  // Save settings whenever they change
  useEffect(() => {
    const settings = {
      ...templateParams,
      showAdvanced,
      showManualPrompt
    };
    localStorage.setItem('simple_prompt_settings', JSON.stringify(settings));
    console.log('Saved simple prompt settings:', settings);
  }, [templateParams, showAdvanced, showManualPrompt]);

  const handleParamChange = (key, value) => {
    const newParams = { ...templateParams, [key]: value };
    setTemplateParams(newParams);
    setDefaultTemplateParams(newParams);
  };

  const handleManualPromptChange = (value) => {
    handleParamChange('manualPrompt', value);
  };

  const handleGenerate = () => {
    console.log('生成提示词，参数:', templateParams);
    onGeneratePrompts(templateParams);
  };

  const paramOptions = {
    style: ['Photorealistic', 'Artistic', 'Abstract', 'Minimalist', 'Vintage', 'Modern'],
    length: ['Short', 'Medium', 'Detailed', 'Comprehensive'],
    tone: ['Descriptive', 'Creative', 'Technical', 'Poetic', 'Dramatic'],
    artisticStyle: ['None', 'Renaissance', 'Impressionist', 'Surrealist', 'Pop Art', 'Digital Art'],
    mood: ['Neutral', 'Bright', 'Dark', 'Mysterious', 'Cheerful', 'Melancholic'],
    lighting: ['Natural', 'Dramatic', 'Soft', 'Intense', 'Golden Hour', 'Studio'],
    composition: ['Balanced', 'Rule of Thirds', 'Centered', 'Asymmetrical', 'Dynamic']
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <SafeIcon icon={FiZap} className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">AI Prompt Generator</h3>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowManualPrompt(!showManualPrompt)}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <SafeIcon icon={FiEdit3} className="h-4 w-4" />
            <span>Manual Input</span>
          </button>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <SafeIcon icon={FiSettings} className="h-4 w-4" />
            <span>{showAdvanced ? 'Hide' : 'Show'} Advanced</span>
          </button>
        </div>
      </div>

      {/* Status Display */}
      <div className="mb-4 p-3 rounded-lg bg-gray-50">
        <div className="flex items-center space-x-2">
          <SafeIcon icon={hasDescription ? FiCheck : FiX} className={`h-4 w-4 ${hasDescription ? 'text-green-600' : 'text-red-600'}`} />
          <span className={`text-sm font-medium ${hasDescription ? 'text-green-700' : 'text-red-700'}`}>
            {hasDescription ? 'Image Analyzed - Ready to Generate' : 'Please Analyze Image First'}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Manual Prompt Input */}
        {showManualPrompt && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 pb-4 border-b border-gray-200"
          >
            <div className="flex items-center space-x-2 mb-3">
              <SafeIcon icon={FiEdit3} className="h-4 w-4 text-blue-600" />
              <h4 className="font-medium text-gray-900">Manual Prompt Input</h4>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Prompt Instructions
              </label>
              <textarea
                value={templateParams.manualPrompt || ''}
                onChange={(e) => handleManualPromptChange(e.target.value)}
                placeholder="Enter specific instructions for prompt generation. For example: 'Focus on lighting and composition', 'Emphasize realistic textures', 'Create cinematic atmosphere'..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="4"
              />
              <p className="text-xs text-gray-500 mt-1">
                This will guide the AI model to generate prompts according to your specific requirements.
              </p>
            </div>

            {/* Manual prompt preview */}
            {templateParams.manualPrompt?.trim() && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h5 className="text-sm font-medium text-blue-900 mb-2">Custom Instructions:</h5>
                <p className="text-sm text-blue-700 break-words">
                  {templateParams.manualPrompt}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Basic Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Style
            </label>
            <select
              value={templateParams.style}
              onChange={(e) => handleParamChange('style', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {paramOptions.style.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Length
            </label>
            <select
              value={templateParams.length}
              onChange={(e) => handleParamChange('length', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {paramOptions.length.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Advanced Parameters */}
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
                  Tone
                </label>
                <select
                  value={templateParams.tone}
                  onChange={(e) => handleParamChange('tone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {paramOptions.tone.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Artistic Style
                </label>
                <select
                  value={templateParams.artisticStyle}
                  onChange={(e) => handleParamChange('artisticStyle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {paramOptions.artisticStyle.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mood
                </label>
                <select
                  value={templateParams.mood}
                  onChange={(e) => handleParamChange('mood', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {paramOptions.mood.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lighting
                </label>
                <select
                  value={templateParams.lighting}
                  onChange={(e) => handleParamChange('lighting', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {paramOptions.lighting.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Composition
                </label>
                <select
                  value={templateParams.composition}
                  onChange={(e) => handleParamChange('composition', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {paramOptions.composition.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!hasDescription || isGenerating}
          className="w-full mt-6 bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {isGenerating ? (
            <>
              <SafeIcon icon={FiIcons.FiLoader} className="h-5 w-5 animate-spin" />
              <span>Generating Prompts...</span>
            </>
          ) : (
            <>
              <SafeIcon icon={FiZap} className="h-5 w-5" />
              <span>Generate AI Art Prompts</span>
            </>
          )}
        </button>

        {/* Help Text */}
        {!hasDescription && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              💡 <strong>Tip:</strong> Please upload and analyze an image first, then generate AI art prompts based on the image content.
            </p>
          </div>
        )}

        {hasDescription && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700">
              ✅ <strong>Ready:</strong> Click "Generate AI Art Prompts" to create 5 different English prompt variations for AI art generation.
            </p>
            {templateParams.manualPrompt?.trim() && (
              <p className="text-sm text-green-700 mt-1">
                🎯 <strong>Custom Instructions:</strong> Prompts will be generated according to your specific requirements.
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PromptGeneratorPanel;