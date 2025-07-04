import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import toast from 'react-hot-toast';

const { FiKey, FiEye, FiEyeOff, FiCheck, FiX, FiSave, FiTrash2 } = FiIcons;

const ApiKeyManager = ({ onKeysChange }) => {
  const [keys, setKeys] = useState({
    visionati: '',
    straico: ''
  });
  const [showKeys, setShowKeys] = useState({
    visionati: false,
    straico: false
  });
  const [keyStatus, setKeyStatus] = useState({
    visionati: null,
    straico: null
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // 从 localStorage 加载保存的密钥
    const savedKeys = {
      visionati: localStorage.getItem('visionati_api_key') || '',
      straico: localStorage.getItem('straico_api_key') || ''
    };
    setKeys(savedKeys);
    if (onKeysChange) {
      onKeysChange(savedKeys);
    }

    // 验证现有密钥
    validateAllKeys(savedKeys);
  }, []);

  const validateAllKeys = (keysToValidate) => {
    Object.keys(keysToValidate).forEach(service => {
      if (keysToValidate[service]) {
        validateKey(service, keysToValidate[service]);
      }
    });
  };

  const handleKeyChange = (service, value) => {
    const newKeys = { ...keys, [service]: value };
    setKeys(newKeys);
    setHasChanges(true);

    // 重置状态
    setKeyStatus(prev => ({ ...prev, [service]: null }));

    // 如果有内容则验证密钥
    if (value.trim()) {
      validateKey(service, value);
    }
  };

  const saveKeys = () => {
    try {
      // 保存到 localStorage
      Object.keys(keys).forEach(service => {
        if (keys[service]) {
          localStorage.setItem(`${service}_api_key`, keys[service]);
        } else {
          localStorage.removeItem(`${service}_api_key`);
        }
      });

      // 通知父组件
      if (onKeysChange) {
        onKeysChange(keys);
      }

      setHasChanges(false);
      toast.success('API 密钥保存成功！');
    } catch (error) {
      console.error('保存密钥失败:', error);
      toast.error('保存 API 密钥失败');
    }
  };

  const clearKey = (service) => {
    const newKeys = { ...keys, [service]: '' };
    setKeys(newKeys);
    setHasChanges(true);
    localStorage.removeItem(`${service}_api_key`);
    setKeyStatus(prev => ({ ...prev, [service]: null }));
    toast.success(`${service} API 密钥已清除`);
  };

  const toggleShowKey = (service) => {
    setShowKeys(prev => ({ ...prev, [service]: !prev[service] }));
  };

  const validateKey = (service, key) => {
    if (!key || !key.trim()) {
      setKeyStatus(prev => ({ ...prev, [service]: 'invalid' }));
      return;
    }

    // 基本验证 - 检查密钥是否看起来有效
    let isValid = false;
    switch (service) {
      case 'visionati':
        // Visionati 密钥通常以特定模式开头
        isValid = key.length >= 20 && key.trim() !== '';
        break;
      case 'straico':
        // Straico 密钥有特定格式
        isValid = key.length >= 10 && key.trim() !== '';
        break;
      default:
        isValid = key.length > 10 && key.trim() !== '';
    }

    setKeyStatus(prev => ({ ...prev, [service]: isValid ? 'valid' : 'invalid' }));
  };

  const KeyInput = ({ service, label, placeholder, description }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SafeIcon icon={FiKey} className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type={showKeys[service] ? 'text' : 'password'}
          value={keys[service]}
          onChange={(e) => handleKeyChange(service, e.target.value)}
          onBlur={() => validateKey(service, keys[service])}
          placeholder={placeholder}
          className="block w-full pl-10 pr-24 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        />
        <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
          {keyStatus[service] && (
            <SafeIcon
              icon={keyStatus[service] === 'valid' ? FiCheck : FiX}
              className={`h-4 w-4 ${keyStatus[service] === 'valid' ? 'text-green-500' : 'text-red-500'}`}
            />
          )}
          {keys[service] && (
            <button
              type="button"
              onClick={() => clearKey(service)}
              className="text-gray-400 hover:text-red-500 p-1"
              title="清除密钥"
            >
              <SafeIcon icon={FiTrash2} className="h-3 w-3" />
            </button>
          )}
          <button
            type="button"
            onClick={() => toggleShowKey(service)}
            className="text-gray-400 hover:text-gray-600 p-1"
            title={showKeys[service] ? '隐藏密钥' : '显示密钥'}
          >
            <SafeIcon icon={showKeys[service] ? FiEyeOff : FiEye} className="h-4 w-4" />
          </button>
        </div>
      </div>
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
      {keyStatus[service] === 'invalid' && keys[service] && (
        <p className="text-xs text-red-600">
          无效的 API 密钥格式。请检查您的密钥。
        </p>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <SafeIcon icon={FiKey} className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">API 配置</h2>
        </div>
        {hasChanges && (
          <button
            onClick={saveKeys}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <SafeIcon icon={FiSave} className="h-4 w-4" />
            <span>保存更改</span>
          </button>
        )}
      </div>

      <div className="space-y-6">
        <KeyInput
          service="visionati"
          label="Visionati API 密钥"
          placeholder="输入您的 Visionati API 密钥"
          description="用于图像分析和描述生成"
        />

        <KeyInput
          service="straico"
          label="Straico API 密钥"
          placeholder="输入您的 Straico API 密钥"
          description="用于 AI 提示词生成"
        />
      </div>

      {/* 保存按钮 */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <button
          onClick={saveKeys}
          disabled={!hasChanges}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <SafeIcon icon={FiSave} className="h-4 w-4" />
          <span>{hasChanges ? '保存 API 密钥' : '无更改'}</span>
        </button>
      </div>

      {/* 说明 */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">获取 API 密钥：</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            • <strong>Visionati:</strong> 在{' '}
            <a
              href="https://api.visionati.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-900"
            >
              api.visionati.com
            </a>
            {' '}注册
          </li>
          <li>
            • <strong>Straico:</strong> 在{' '}
            <a
              href="https://straico.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-900"
            >
              straico.com
            </a>
            {' '}获取密钥
          </li>
        </ul>
      </div>
    </motion.div>
  );
};

export default ApiKeyManager;