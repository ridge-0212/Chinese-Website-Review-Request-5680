import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useAuth } from '../hooks/useAuth';
import { useSettingsStore } from '../store/useStore';
import { useSupabaseSettingsStore } from '../store/useSupabaseStore';
import toast from 'react-hot-toast';

const { FiKey, FiEye, FiEyeOff, FiCheck, FiX, FiSave, FiTrash2, FiCloud, FiHardDrive } = FiIcons;

const ApiKeyManager = ({ onKeysChange }) => {
  const { user } = useAuth();
  
  // Always call all hooks first
  const supabaseStore = useSupabaseSettingsStore();
  const localStore = useSettingsStore();
  
  // Then select which store to use
  const settingsStore = user ? supabaseStore : localStore;
  
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
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 使用 useCallback 防止无限循环
  const loadKeys = useCallback(async () => {
    try {
      setIsLoading(true);
      
      if (user && settingsStore.loadSettings && !settingsStore.isInitialized) {
        // Load from Supabase for authenticated users
        console.log('Loading settings from Supabase...');
        await settingsStore.loadSettings();
      } else if (!user && settingsStore.initializeFromStorage && !settingsStore.isInitialized) {
        // Initialize from localStorage for guests
        console.log('Initializing from localStorage...');
        settingsStore.initializeFromStorage();
      }
      
      // Get keys from the store
      const visionatiKey = settingsStore.visionatiKey || localStorage.getItem('visionati_api_key') || '';
      const straicoKey = settingsStore.straicoKey || localStorage.getItem('straico_api_key') || '';
      
      const loadedKeys = {
        visionati: visionatiKey,
        straico: straicoKey
      };
      
      setKeys(loadedKeys);
      
      if (onKeysChange) {
        onKeysChange(loadedKeys);
      }
      
      // Validate existing keys
      validateAllKeys(loadedKeys);
      
      console.log('Loaded API keys from', user ? 'Supabase' : 'localStorage');
    } catch (error) {
      console.error('Error loading API keys:', error);
      toast.error('加载 API 密钥失败');
    } finally {
      setIsLoading(false);
    }
  }, [user, settingsStore, onKeysChange]);

  // Load keys on mount - 只在必要时执行
  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  // Watch for store changes - 使用 useCallback 防止依赖变化
  const handleStoreChanges = useCallback(() => {
    const storeKeys = {
      visionati: settingsStore.visionatiKey || '',
      straico: settingsStore.straicoKey || ''
    };
    
    // Only update if keys actually changed
    if (storeKeys.visionati !== keys.visionati || storeKeys.straico !== keys.straico) {
      setKeys(storeKeys);
      if (onKeysChange) {
        onKeysChange(storeKeys);
      }
      validateAllKeys(storeKeys);
    }
  }, [settingsStore.visionatiKey, settingsStore.straicoKey, keys.visionati, keys.straico, onKeysChange]);

  useEffect(() => {
    handleStoreChanges();
  }, [handleStoreChanges]);

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

    // Reset status
    setKeyStatus(prev => ({ ...prev, [service]: null }));

    // Validate if there's content
    if (value.trim()) {
      validateKey(service, value);
    }
  };

  const saveKeys = async () => {
    setIsSaving(true);
    try {
      if (user) {
        // Save to Supabase for authenticated users
        await settingsStore.setVisionatiKey(keys.visionati);
        await settingsStore.setStraicoKey(keys.straico);
        toast.success('API 密钥已保存到云端！');
      } else {
        // Save to localStorage for guest users
        Object.keys(keys).forEach(service => {
          if (keys[service]) {
            localStorage.setItem(`${service}_api_key`, keys[service]);
          } else {
            localStorage.removeItem(`${service}_api_key`);
          }
        });
        toast.success('API 密钥已保存到本地！');
      }

      // Notify parent component
      if (onKeysChange) {
        onKeysChange(keys);
      }

      setHasChanges(false);
    } catch (error) {
      console.error('保存密钥失败:', error);
      toast.error('保存 API 密钥失败: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const clearKey = async (service) => {
    const newKeys = { ...keys, [service]: '' };
    setKeys(newKeys);
    setHasChanges(true);
    
    // Clear from appropriate store
    try {
      if (user) {
        if (service === 'visionati') {
          await settingsStore.setVisionatiKey('');
        } else if (service === 'straico') {
          await settingsStore.setStraicoKey('');
        }
      } else {
        localStorage.removeItem(`${service}_api_key`);
      }
      
      setKeyStatus(prev => ({ ...prev, [service]: null }));
      toast.success(`${service} API 密钥已清除`);
    } catch (error) {
      console.error('清除密钥失败:', error);
      // Still update UI even if save fails
      setKeyStatus(prev => ({ ...prev, [service]: null }));
      toast.error('清除密钥失败，但界面已更新');
    }
  };

  const toggleShowKey = (service) => {
    setShowKeys(prev => ({ ...prev, [service]: !prev[service] }));
  };

  const validateKey = (service, key) => {
    if (!key || !key.trim()) {
      setKeyStatus(prev => ({ ...prev, [service]: 'invalid' }));
      return;
    }

    // Basic validation - check if key looks valid
    let isValid = false;
    switch (service) {
      case 'visionati':
        // Visionati keys usually start with specific pattern
        isValid = key.length >= 20 && key.trim() !== '';
        break;
      case 'straico':
        // Straico keys have specific format
        isValid = key.length >= 10 && key.trim() !== '';
        break;
      default:
        isValid = key.length > 10 && key.trim() !== '';
    }

    setKeyStatus(prev => ({ ...prev, [service]: isValid ? 'valid' : 'invalid' }));
  };

  // Sync with cloud (for authenticated users)
  const syncWithCloud = async () => {
    if (!user) {
      toast.error('请先登录以同步到云端');
      return;
    }

    setIsSaving(true);
    try {
      // Reset initialization flag and load fresh data
      settingsStore.resetInitialization();
      await settingsStore.loadSettings();
      
      // Get the latest keys
      const cloudKeys = {
        visionati: settingsStore.visionatiKey || '',
        straico: settingsStore.straicoKey || ''
      };
      
      setKeys(cloudKeys);
      if (onKeysChange) {
        onKeysChange(cloudKeys);
      }
      validateAllKeys(cloudKeys);
      
      toast.success('已从云端同步 API 密钥！');
      setHasChanges(false);
    } catch (error) {
      console.error('同步失败:', error);
      toast.error('同步失败: ' + error.message);
    } finally {
      setIsSaving(false);
    }
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
          disabled={isLoading}
          className="block w-full pl-10 pr-24 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
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
              disabled={isLoading}
              className="text-gray-400 hover:text-red-500 p-1 disabled:cursor-not-allowed"
              title="清除密钥"
            >
              <SafeIcon icon={FiTrash2} className="h-3 w-3" />
            </button>
          )}
          <button
            type="button"
            onClick={() => toggleShowKey(service)}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 p-1 disabled:cursor-not-allowed"
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

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <SafeIcon icon={FiIcons.FiLoader} className="h-6 w-6 animate-spin text-blue-600 mr-3" />
          <span className="text-gray-600">加载 API 配置中...</span>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center space-x-1">
            <SafeIcon 
              icon={user ? FiCloud : FiHardDrive} 
              className={`h-4 w-4 ${user ? 'text-blue-600' : 'text-gray-600'}`} 
            />
            <span className={`text-xs ${user ? 'text-blue-600' : 'text-gray-600'}`}>
              {user ? '云端存储' : '本地存储'}
            </span>
          </div>
        </div>
        <div className="flex space-x-2">
          {user && (
            <button
              onClick={syncWithCloud}
              disabled={isSaving || isLoading}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <SafeIcon icon={isSaving ? FiIcons.FiLoader : FiCloud} className={`h-4 w-4 ${isSaving ? 'animate-spin' : ''}`} />
              <span>从云端同步</span>
            </button>
          )}
          {hasChanges && (
            <button
              onClick={saveKeys}
              disabled={isSaving || isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <SafeIcon icon={isSaving ? FiIcons.FiLoader : FiSave} className={`h-4 w-4 ${isSaving ? 'animate-spin' : ''}`} />
              <span>{isSaving ? '保存中...' : '保存更改'}</span>
            </button>
          )}
        </div>
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
          disabled={!hasChanges || isSaving || isLoading}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <SafeIcon icon={isSaving ? FiIcons.FiLoader : FiSave} className={`h-4 w-4 ${isSaving ? 'animate-spin' : ''}`} />
          <span>
            {isSaving ? '保存中...' : hasChanges ? `保存到${user ? '云端' : '本地'}` : '无更改'}
          </span>
        </button>
      </div>

      {/* 存储说明 */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2 flex items-center">
          <SafeIcon icon={user ? FiCloud : FiHardDrive} className="h-4 w-4 mr-2" />
          存储方式
        </h3>
        <div className="text-sm text-gray-600 space-y-2">
          {user ? (
            <>
              <p>✅ <strong>云端存储：</strong> 您的 API 密钥已加密保存到 Supabase 云数据库</p>
              <p>🔄 <strong>自动同步：</strong> 在任何设备、任何浏览器上登录都可以使用</p>
              <p>🔒 <strong>安全保护：</strong> 数据加密传输和存储，只有您能访问</p>
              <p>💾 <strong>本地备份：</strong> 同时保存到本地以提供离线访问</p>
            </>
          ) : (
            <>
              <p>💾 <strong>本地存储：</strong> API 密钥保存在浏览器本地存储中</p>
              <p>⚠️ <strong>注意：</strong> 更换浏览器或清除数据会丢失密钥</p>
              <p>🔐 <strong>建议：</strong> 登录账户以享受云端同步功能</p>
            </>
          )}
        </div>
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

      {/* 登录提示（仅对未登录用户显示） */}
      {!user && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <SafeIcon icon={FiCloud} className="h-5 w-5 text-yellow-600" />
            <h3 className="font-medium text-yellow-900">升级到云端存储</h3>
          </div>
          <p className="text-sm text-yellow-800 mb-3">
            登录账户即可享受 API 密钥云端同步功能，在任何设备上都能使用您的配置。
          </p>
          <div className="text-xs text-yellow-700">
            <p>✅ 跨设备同步</p>
            <p>✅ 数据加密保护</p>
            <p>✅ 永不丢失</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ApiKeyManager;