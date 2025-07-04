import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiUpload, FiImage, FiX } = FiIcons;

const ImageUploader = ({ onImageSelect, currentImage, isAnalyzing }) => {
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      onImageSelect(file);
    }
  }, [onImageSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp']
    },
    multiple: false,
    disabled: isAnalyzing
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        {currentImage ? (
          <div className="space-y-4">
            <div className="relative inline-block">
              <img
                src={URL.createObjectURL(currentImage)}
                alt="已选择"
                className="max-h-48 rounded-lg shadow-md"
              />
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                  <div className="text-white text-center">
                    <SafeIcon icon={FiIcons.FiLoader} className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p className="text-sm">分析中...</p>
                  </div>
                </div>
              )}
            </div>
            <div className="text-sm text-gray-600">
              <p className="font-medium">{currentImage.name}</p>
              <p>{(currentImage.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <SafeIcon icon={FiUpload} className="h-12 w-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-lg font-medium text-gray-700">
                {isDragActive ? '在此放置图像' : '上传图像'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                拖放或点击选择 • JPG、PNG、GIF，最大 10MB
              </p>
            </div>
          </div>
        )}
      </div>

      {currentImage && !isAnalyzing && (
        <div className="flex justify-center">
          <button
            onClick={() => onImageSelect(null)}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <SafeIcon icon={FiX} className="h-4 w-4" />
            <span>移除图像</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;