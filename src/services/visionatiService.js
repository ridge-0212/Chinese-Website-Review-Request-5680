import axios from 'axios';

const VISIONATI_API_URL = 'https://api.visionati.com/api';

class VisionatiService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: VISIONATI_API_URL,
      headers: {
        'X-API-Key': `Token ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async analyzeImage(options) {
    try {
      const payload = await this.buildPayload(options);
      console.log('Visionati API Payload:', payload);
      
      const response = await this.client.post('/fetch', payload);
      console.log('Visionati API Response:', response.data);
      
      // Handle async response
      if (response.data.response_uri) {
        return this.pollForResults(response.data.request_id);
      }
      
      return this.formatResponse(response.data);
    } catch (error) {
      console.error('Visionati API Error:', error);
      if (error.response) {
        console.error('Error Response:', error.response.data);
        throw new Error(`Image analysis failed: ${error.response.data?.error || error.response.statusText}`);
      } else if (error.request) {
        throw new Error('Network error: Unable to connect to Visionati API');
      } else {
        throw new Error(`Image analysis failed: ${error.message}`);
      }
    }
  }

  async buildPayload(options) {
    const payload = {
      feature: options.features || ['tags', 'descriptions', 'colors', 'nsfw'],
      backend: options.backends || ['openai', 'googlevision', 'clarifai'],
      role: options.role || 'general',
      language: options.language || 'English',
      tag_score: options.tag_score || 0.85
    };

    // Add custom prompt if provided
    if (options.prompt) {
      payload.prompt = options.prompt;
    }

    // Handle file upload
    if (options.file) {
      if (options.file instanceof File) {
        const base64 = await this.convertFileToBase64(options.file);
        payload.file = [base64];
        payload.file_name = [options.file.name];
      } else {
        payload.file = [options.file];
      }
    }

    // Handle URL
    if (options.url) {
      payload.url = [options.url];
    }

    return payload;
  }

  async pollForResults(requestId, maxAttempts = 30, interval = 2000) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await this.client.get(`/response/${requestId}`);
        
        if (response.data.status === 'processing') {
          await new Promise(resolve => setTimeout(resolve, interval));
          continue;
        }
        
        return this.formatResponse(response.data);
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          throw new Error('Analysis timeout - results not ready');
        }
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
  }

  formatResponse(data) {
    console.log('Formatting response:', data);
    
    if (!data.all?.assets?.[0]) {
      throw new Error('Invalid response format');
    }

    const asset = data.all.assets[0];

    // Extract and format description
    let description = '';
    if (asset.descriptions && asset.descriptions.length > 0) {
      description = asset.descriptions[0].description;
    }

    // Extract tags
    const tags = asset.tags ? Object.keys(asset.tags).slice(0, 10) : [];

    // Extract colors
    const colors = asset.colors ? Object.keys(asset.colors).slice(0, 5) : [];

    // Return formatted response with all data
    return {
      description,
      tags,
      colors,
      all: data, // Include full response for detailed analysis
      credits_paid: data.credits_paid,
      credits: data.credits,
      request_id: data.request_id
    };
  }

  convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove data URL prefix to get just the base64 string
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  }

  // Get available backends
  getAvailableBackends() {
    return [
      { id: 'openai', label: 'OpenAI', recommended: true },
      { id: 'googlevision', label: 'Google Vision', recommended: true },
      { id: 'clarifai', label: 'Clarifai', recommended: true },
      { id: 'gemini', label: 'Gemini', recommended: true },
      { id: 'claude', label: 'Claude', recommended: true },
      { id: 'grok', label: 'Grok', recommended: true },
      { id: 'llava', label: 'LLaVA', recommended: false },
      { id: 'bakllava', label: 'BakLLaVA', recommended: false },
      { id: 'jinaai', label: 'Jina AI', recommended: false },
      { id: 'imagga', label: 'Imagga', recommended: false },
      { id: 'rekognition', label: 'AWS Rekognition', recommended: false }
    ];
  }

  // Get available features
  getAvailableFeatures() {
    return [
      { id: 'tags', label: 'Tags' },
      { id: 'descriptions', label: 'Descriptions' },
      { id: 'colors', label: 'Colors' },
      { id: 'nsfw', label: 'NSFW Check' },
      { id: 'faces', label: 'Faces' },
      { id: 'texts', label: 'Text Detection' },
      { id: 'brands', label: 'Brand Detection' }
    ];
  }

  // Get available roles
  getAvailableRoles() {
    return [
      { id: 'general', label: 'General' },
      { id: 'artist', label: 'Artist' },
      { id: 'caption', label: 'Caption' },
      { id: 'comedian', label: 'Comedian' },
      { id: 'critic', label: 'Critic' },
      { id: 'ecommerce', label: 'E-commerce' },
      { id: 'inspector', label: 'Inspector' },
      { id: 'promoter', label: 'Promoter' },
      { id: 'prompt', label: 'Prompt Generator' },
      { id: 'realtor', label: 'Real Estate' },
      { id: 'tweet', label: 'Tweet' }
    ];
  }
}

export default VisionatiService;