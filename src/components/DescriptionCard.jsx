import React from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { copyDescription } from '../utils/clipboard';

const { FiEye, FiCopy, FiTag, FiPalette } = FiIcons;

const DescriptionCard = ({ description, tags, colors, isAnalyzing }) => {
  if (isAnalyzing) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center space-x-3 py-8">
          <SafeIcon icon={FiIcons.FiLoader} className="h-6 w-6 animate-spin text-blue-600" />
          <p className="text-gray-600">正在分析您的图像...</p>
        </div>
      </div>
    );
  }

  if (!description) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <SafeIcon icon={FiEye} className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">图像描述</h3>
        </div>
        <button
          onClick={() => copyDescription(description)}
          className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
        >
          <SafeIcon icon={FiCopy} className="h-4 w-4" />
          <span>复制</span>
        </button>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-700 leading-relaxed">{description}</p>
        </div>

        {tags && tags.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <SafeIcon icon={FiTag} className="h-4 w-4 mr-2" />
              关键元素
            </h4>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {colors && colors.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <SafeIcon icon={FiPalette} className="h-4 w-4 mr-2" />
              主色调
            </h4>
            <div className="flex space-x-2">
              {colors.map((color, index) => (
                <div
                  key={index}
                  className="w-8 h-8 rounded-lg border border-gray-300 shadow-sm"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DescriptionCard;