import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { copyPrompt } from '../utils/clipboard';

const { FiCopy, FiZap, FiRefreshCw } = FiIcons;

const PromptItem = ({ prompt, index }) => {
  const handleCopy = () => {
    copyPrompt(prompt);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <SafeIcon icon={FiZap} className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium text-gray-700">
            {prompt.variation || `提示词 ${index + 1}`}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors"
        >
          <SafeIcon icon={FiCopy} className="h-4 w-4" />
          <span>复制</span>
        </button>
      </div>

      <p className="text-gray-700 leading-relaxed mb-3">
        {prompt.text}
      </p>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>风格: {prompt.style}</span>
        <span>{new Date(prompt.timestamp).toLocaleTimeString()}</span>
      </div>
    </motion.div>
  );
};

const PromptList = ({ prompts, isGenerating, onRegenerate }) => {
  if (isGenerating) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center space-x-3 py-8">
          <SafeIcon icon={FiIcons.FiLoader} className="h-6 w-6 animate-spin text-purple-600" />
          <p className="text-gray-600">正在生成您的 AI 提示词...</p>
        </div>
      </div>
    );
  }

  if (!prompts || prompts.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <SafeIcon icon={FiZap} className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">生成的提示词</h3>
          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
            {prompts.length}
          </span>
        </div>
        <button
          onClick={onRegenerate}
          className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          <SafeIcon icon={FiRefreshCw} className="h-4 w-4" />
          <span>重新生成</span>
        </button>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {prompts.map((prompt, index) => (
            <PromptItem key={index} prompt={prompt} index={index} />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default PromptList;