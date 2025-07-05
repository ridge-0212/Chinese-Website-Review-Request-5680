import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { copyToClipboard } from '../utils/clipboard';

const { FiCopy, FiShoppingBag, FiRefreshCw, FiTag, FiFileText } = FiIcons;

const ProductContentItem = ({ content, index, type }) => {
  const handleCopy = () => {
    const textToCopy = type === 'title' ? content.title : 
                      type === 'description' ? content.description :
                      `${content.title}\n\n${content.description}`;
    copyToClipboard(textToCopy, `产品${type === 'title' ? '标题' : type === 'description' ? '描述' : '内容'}已复制！`);
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
          <SafeIcon icon={type === 'title' ? FiTag : type === 'description' ? FiFileText : FiShoppingBag} className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-gray-700">
            {content.variation || `产品内容 ${index + 1}`}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
        >
          <SafeIcon icon={FiCopy} className="h-4 w-4" />
          <span>复制</span>
        </button>
      </div>

      <div className="space-y-3">
        {content.title && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">产品标题</h4>
            <p className="text-gray-900 font-medium leading-relaxed">
              {content.title}
            </p>
          </div>
        )}

        {content.description && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">产品描述</h4>
            <p className="text-gray-700 leading-relaxed text-sm">
              {content.description}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 mt-4 pt-3 border-t border-gray-100">
        <span>平台: {content.platform || '通用'}</span>
        <span>{new Date(content.timestamp).toLocaleTimeString()}</span>
      </div>
    </motion.div>
  );
};

const ProductContentList = ({ contents, isGenerating, onRegenerate, contentType }) => {
  if (isGenerating) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center space-x-3 py-8">
          <SafeIcon icon={FiIcons.FiLoader} className="h-6 w-6 animate-spin text-green-600" />
          <p className="text-gray-600">正在生成您的产品内容...</p>
        </div>
      </div>
    );
  }

  if (!contents || contents.length === 0) {
    return null;
  }

  const getContentTypeLabel = () => {
    switch (contentType) {
      case 'title': return '产品标题';
      case 'description': return '产品描述';
      default: return '产品内容';
    }
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
          <h3 className="font-semibold text-gray-900">生成的{getContentTypeLabel()}</h3>
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
            {contents.length}
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
          {contents.map((content, index) => (
            <ProductContentItem
              key={index}
              content={content}
              index={index}
              type={contentType}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Usage Tips */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">使用建议</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• 根据不同平台的特点选择合适的标题长度</li>
          <li>• 产品描述可以根据需要进行适当调整</li>
          <li>• 建议结合实际产品特点进行个性化修改</li>
          <li>• 注意遵守各平台的内容规范和要求</li>
        </ul>
      </div>
    </motion.div>
  );
};

export default ProductContentList;