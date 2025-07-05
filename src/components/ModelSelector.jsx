import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import StraicoService from '../services/straicoService';

const { FiCpu, FiLoader, FiCheck, FiX, FiDollarSign, FiInfo } = FiIcons;

const ModelSelector = ({ apiKey, onModelSelect, selectedModel }) => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [filterProvider, setFilterProvider] = useState('all');

  const straicoService = apiKey ? new StraicoService(apiKey) : null;

  useEffect(() => {
    if (straicoService) {
      loadModels();
    }
  }, [straicoService]);

  const loadModels = async () => {
    setLoading(true);
    setError(null);
    try {
      const availableModels = await straicoService.getAvailableModels();
      setModels(availableModels);
      
      // Select first model by default if none selected
      if (!selectedModel && availableModels.length > 0) {
        onModelSelect(availableModels[0].id);
      }
    } catch (err) {
      setError(err.message);
      console.error('Failed to load models:', err);
    } finally {
      setLoading(false);
    }
  };

  const getUniqueProviders = () => {
    const providers = [...new Set(models.map(model => model.provider))];
    return providers.sort();
  };

  const getSortedAndFilteredModels = () => {
    let filteredModels = models;
    
    if (filterProvider !== 'all') {
      filteredModels = models.filter(model => model.provider === filterProvider);
    }

    return filteredModels.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'provider': 
          return a.provider.localeCompare(b.provider);
        case 'price':
          return (a.pricing?.coins || 0) - (b.pricing?.coins || 0);
        case 'output':
          return (b.maxOutput || 0) - (a.maxOutput || 0);
        default:
          return 0;
      }
    });
  };

  const formatPrice = (pricing) => {
    if (!pricing) return 'N/A';
    return `${pricing.coins} coins/${pricing.words} words`;
  };

  const formatOutput = (maxOutput) => {
    if (!maxOutput) return 'N/A';
    if (maxOutput >= 1000) {
      return `${(maxOutput / 1000).toFixed(1)}K tokens`;
    }
    return `${maxOutput} tokens`;
  };

  if (!apiKey) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <SafeIcon icon={FiX} className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">API Key Required</h3>
          <p className="text-gray-600">Please configure your Straico API key to select models.</p>
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
          <SafeIcon icon={FiCpu} className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">AI Model Selection</h2>
        </div>
        {loading && (
          <SafeIcon icon={FiLoader} className="h-5 w-5 text-blue-600 animate-spin" />
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <SafeIcon icon={FiX} className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Filters and Sorting */}
      {models.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Provider
            </label>
            <select
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Providers</option>
              {getUniqueProviders().map(provider => (
                <option key={provider} value={provider}>{provider}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort by
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Name</option>
              <option value="provider">Provider</option>
              <option value="price">Price (Low to High)</option>
              <option value="output">Output Capacity</option>
            </select>
          </div>
        </div>
      )}

      {models.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-4">
            Select the AI model you want to use for prompt generation ({getSortedAndFilteredModels().length} models available):
          </p>
          <div className="grid gap-3">
            {getSortedAndFilteredModels().map((model) => (
              <button
                key={model.id}
                onClick={() => onModelSelect(model.id)}
                className={`p-4 rounded-lg border text-left transition-all hover:shadow-md ${
                  selectedModel === model.id
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-opacity-20'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-medium text-gray-900">{model.name}</h3>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {model.provider}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{model.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <SafeIcon icon={FiDollarSign} className="h-3 w-3" />
                        <span>{formatPrice(model.pricing)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <SafeIcon icon={FiInfo} className="h-3 w-3" />
                        <span>Max: {formatOutput(model.maxOutput)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 font-mono">{model.id}</p>
                  </div>
                  {selectedModel === model.id && (
                    <SafeIcon icon={FiCheck} className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        !loading && (
          <div className="text-center py-8">
            <SafeIcon icon={FiCpu} className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No models available</p>
            <button
              onClick={loadModels}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        )
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">About Model Selection</h3>
        <p className="text-sm text-gray-600">
          Different models excel at different tasks. Consider cost, context length, and performance when choosing. 
          Higher coin costs typically indicate more capable models.
        </p>
      </div>
    </motion.div>
  );
};

export default ModelSelector;