import axios from 'axios';

const STRAICO_API_URL = 'https://api.straico.com/v0';

class StraicoService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: STRAICO_API_URL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async generatePrompts(description, templateParams = {}, selectedModel = null) {
    try {
      console.log('Generating prompts with params:', { description, templateParams, selectedModel });

      // If a specific model is selected, use the API directly
      if (selectedModel) {
        return this.generatePromptsWithModel(description, templateParams, selectedModel);
      }

      // Otherwise use the fallback method
      const prompts = [];

      // Build base prompt from description and manual instructions
      const basePrompt = this.buildBasePrompt(description, templateParams);

      // Generate multiple English variations
      const variations = [
        { suffix: 'professional photography', prefix: 'masterful ', style: 'photographic' },
        { suffix: 'artistic illustration', prefix: 'creative ', style: 'artistic' },
        { suffix: 'digital art masterpiece', prefix: 'stunning ', style: 'digital' },
        { suffix: 'cinematic composition', prefix: 'dramatic ', style: 'cinematic' },
        { suffix: 'concept art', prefix: 'imaginative ', style: 'concept' }
      ];

      for (const variation of variations) {
        const prompt = this.generateSinglePrompt(basePrompt, variation, templateParams);
        prompts.push(prompt);
      }

      console.log('Generated prompts:', prompts);
      return prompts;
    } catch (error) {
      console.error('Straico API error:', error);
      // Fallback to template-based generation if API fails
      console.log('Using fallback prompt generation...');
      return this.generateFallbackPrompts(description, templateParams);
    }
  }

  async generatePromptsWithModel(description, templateParams, modelId) {
    try {
      console.log(`Using model ${modelId} for prompt generation`);

      const basePrompt = this.buildBasePrompt(description, templateParams);
      const systemPrompt = this.buildSystemPrompt(templateParams);

      const requestBody = {
        model: modelId,
        message: `Based on this image description, generate 5 different AI art prompts in English:

Description: ${basePrompt}

Requirements:
- Generate 5 unique variations for AI art creation
- Each prompt should be detailed and descriptive
- Include artistic style, lighting, composition details
- Make each prompt suitable for AI image generators like Midjourney, DALL-E, or Stable Diffusion
- Vary the artistic styles (photographic, artistic, digital art, cinematic, concept art)

Please format the response as a JSON array with objects containing 'text', 'style', and 'variation' fields.`,
        system_prompt: systemPrompt
      };

      console.log('API Request:', requestBody);

      const response = await this.client.post('/prompt/completion', requestBody);
      
      console.log('API Response:', response.data);

      if (response.data && response.data.completion) {
        try {
          // Try to parse JSON response
          const jsonMatch = response.data.completion.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsedPrompts = JSON.parse(jsonMatch[0]);
            return parsedPrompts.map((prompt, index) => ({
              text: prompt.text || prompt,
              style: prompt.style || 'generated',
              variation: prompt.variation || `AI Generated ${index + 1}`,
              timestamp: new Date().toISOString()
            }));
          }
        } catch (parseError) {
          console.log('Could not parse JSON, using text processing...');
        }

        // Fallback: process plain text response
        return this.parseTextResponse(response.data.completion, templateParams);
      }

      throw new Error('Invalid API response format');
    } catch (error) {
      console.error('Model-specific generation failed:', error);
      // Fallback to template-based generation
      return this.generateFallbackPrompts(description, templateParams);
    }
  }

  parseTextResponse(text, templateParams) {
    // Split by common delimiters and clean up
    const lines = text.split(/\n+/).filter(line => line.trim().length > 10);
    const prompts = [];

    const styles = ['photographic', 'artistic', 'digital', 'cinematic', 'concept'];

    lines.slice(0, 5).forEach((line, index) => {
      // Clean up the line
      let cleanedLine = line.replace(/^\d+\.?\s*/, '').replace(/^[-*]\s*/, '').trim();
      
      if (cleanedLine.length > 10) {
        prompts.push({
          text: cleanedLine,
          style: styles[index] || 'generated',
          variation: `AI Generated ${index + 1}`,
          timestamp: new Date().toISOString()
        });
      }
    });

    // If we don't have enough prompts, generate more
    while (prompts.length < 5) {
      const fallbackPrompts = this.generateFallbackPrompts(text, templateParams);
      prompts.push(...fallbackPrompts.slice(0, 5 - prompts.length));
    }

    return prompts.slice(0, 5);
  }

  buildSystemPrompt(templateParams) {
    const { style, tone, length, mood, lighting, composition } = templateParams;

    let systemPrompt = "You are an expert AI art prompt generator. ";
    
    if (style && style !== 'Photorealistic') {
      systemPrompt += `Focus on ${style.toLowerCase()} style. `;
    }
    
    if (tone) {
      systemPrompt += `Use a ${tone.toLowerCase()} tone. `;
    }
    
    if (length) {
      switch (length) {
        case 'Short':
          systemPrompt += "Keep prompts concise and focused. ";
          break;
        case 'Detailed':
          systemPrompt += "Create detailed and comprehensive prompts. ";
          break;
        case 'Comprehensive':
          systemPrompt += "Generate very detailed, comprehensive prompts with rich descriptions. ";
          break;
        default:
          systemPrompt += "Create moderately detailed prompts. ";
      }
    }

    systemPrompt += "Always generate prompts in English that are suitable for AI image generators.";

    return systemPrompt;
  }

  generateSinglePrompt(basePrompt, variation, templateParams) {
    const { style, mood, lighting, composition, artisticStyle, tone, length } = templateParams;

    let prompt = `${variation.prefix}${basePrompt}`;

    // Add style modifiers in English
    if (style && style !== 'none' && style !== 'Photorealistic') {
      prompt += `, ${style.toLowerCase()} style`;
    }

    if (artisticStyle && artisticStyle !== 'none' && artisticStyle !== 'None') {
      prompt += `, ${artisticStyle.toLowerCase()} inspired`;
    }

    // Add technical parameters in English
    const technical = [];
    if (lighting && lighting !== 'Natural') technical.push(`${lighting.toLowerCase()} lighting`);
    if (mood && mood !== 'Neutral') technical.push(`${mood.toLowerCase()} atmosphere`);
    if (composition && composition !== 'Balanced') technical.push(`${composition.toLowerCase()} composition`);

    if (technical.length > 0) {
      prompt += `, ${technical.join(', ')}`;
    }

    // Add quality suffixes based on length
    const qualitySuffixes = this.getQualitySuffixes(length);
    prompt += `, ${variation.suffix}, ${qualitySuffixes.join(', ')}`;

    return {
      text: prompt,
      style: style || 'photorealistic',
      variation: variation.suffix,
      timestamp: new Date().toISOString()
    };
  }

  generateFallbackPrompts(description, templateParams) {
    const prompts = [];
    const { style, mood, lighting, composition, artisticStyle, tone, length } = templateParams;

    // Base variations in English
    const variations = [
      { prefix: 'professional ', suffix: 'high quality photography', type: 'photo' },
      { prefix: 'artistic ', suffix: 'beautiful illustration', type: 'art' },
      { prefix: 'creative ', suffix: 'digital artwork', type: 'digital' },
      { prefix: 'stunning ', suffix: 'masterpiece', type: 'masterpiece' },
      { prefix: 'detailed ', suffix: 'concept art', type: 'concept' }
    ];

    variations.forEach(variation => {
      let prompt = `${variation.prefix}${description}`;

      // Add style in English
      if (style && style !== 'Photorealistic') {
        prompt += `, ${style.toLowerCase()} style`;
      }

      // Add artistic style in English
      if (artisticStyle && artisticStyle !== 'None') {
        prompt += `, ${artisticStyle.toLowerCase()} inspired`;
      }

      // Add mood and lighting in English
      if (mood && mood !== 'Neutral') {
        prompt += `, ${mood.toLowerCase()} atmosphere`;
      }

      if (lighting && lighting !== 'Natural') {
        prompt += `, ${lighting.toLowerCase()} lighting`;
      }

      // Add composition in English
      if (composition && composition !== 'Balanced') {
        prompt += `, ${composition.toLowerCase()} composition`;
      }

      // Add quality terms based on length
      const qualityTerms = this.getQualityTerms(length, variation.type);
      prompt += `, ${variation.suffix}, ${qualityTerms.join(', ')}`;

      prompts.push({
        text: prompt,
        style: style || 'photorealistic',
        variation: variation.suffix,
        timestamp: new Date().toISOString()
      });
    });

    return prompts;
  }

  getQualitySuffixes(length) {
    const base = ['highly detailed', 'professional quality'];

    switch (length) {
      case 'Short':
        return base;
      case 'Medium':
        return [...base, '8k resolution', 'award winning'];
      case 'Detailed':
        return [...base, '8k resolution', 'award winning', 'trending on artstation', 'hyperrealistic'];
      case 'Comprehensive':
        return [...base, '8k resolution', 'award winning', 'trending on artstation', 'hyperrealistic', 'studio lighting', 'sharp focus'];
      default:
        return base;
    }
  }

  getQualityTerms(length, type) {
    const baseTerms = {
      photo: ['sharp focus', 'professional photography'],
      art: ['beautiful artwork', 'detailed illustration'],
      digital: ['digital art', 'high resolution'],
      masterpiece: ['masterpiece', 'award winning'],
      concept: ['concept art', 'detailed design']
    };

    const enhancedTerms = {
      photo: ['8k photography', 'professional studio lighting', 'Canon 5D Mark IV'],
      art: ['trending on artstation', 'beautiful detailed art', 'intricate details'],
      digital: ['digital painting', 'concept art', 'matte painting'],
      masterpiece: ['museum quality', 'fine art', 'legendary artwork'],
      concept: ['game concept art', 'character design', 'environment design']
    };

    let terms = baseTerms[type] || baseTerms.photo;

    if (length === 'Detailed' || length === 'Comprehensive') {
      terms = [...terms, ...(enhancedTerms[type] || enhancedTerms.photo)];
    }

    return terms;
  }

  buildBasePrompt(description, params) {
    // Clean and enhance the description
    let basePrompt = description.trim();

    // Remove any existing quality descriptors to avoid duplication
    const qualityWords = ['high quality', 'detailed', 'professional', 'beautiful', 'stunning', 'amazing'];
    qualityWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      basePrompt = basePrompt.replace(regex, '').trim();
    });

    // Clean up extra spaces
    basePrompt = basePrompt.replace(/\s+/g, ' ').trim();

    // Add manual prompt instructions if provided
    if (params.manualPrompt && params.manualPrompt.trim()) {
      basePrompt = `${basePrompt}, ${params.manualPrompt.trim()}`;
    }

    // Add context based on parameters
    if (params.mood && params.mood !== 'Neutral') {
      basePrompt = `${params.mood.toLowerCase()} scene featuring ${basePrompt}`;
    }

    return basePrompt;
  }

  async getAvailableModels() {
    try {
      const response = await this.client.get('/models');
      
      if (response.data.success && response.data.data) {
        return response.data.data.map(model => ({
          id: model.model,
          name: model.name,
          provider: this.extractProvider(model.model),
          pricing: model.pricing,
          maxOutput: model.maxOutput,
          description: model.description || 'AI Language Model'
        }));
      }

      return this.getFallbackModels();
    } catch (error) {
      console.error('Failed to fetch models:', error);
      return this.getFallbackModels();
    }
  }

  extractProvider(modelId) {
    if (modelId.includes('anthropic/')) return 'Anthropic';
    if (modelId.includes('openai/')) return 'OpenAI';
    if (modelId.includes('google/')) return 'Google';
    if (modelId.includes('meta/')) return 'Meta';
    if (modelId.includes('mistral/')) return 'Mistral';
    if (modelId.includes('qwen/')) return 'Qwen';
    if (modelId.includes('deepseek/')) return 'DeepSeek';
    if (modelId.includes('claude/')) return 'Anthropic';
    if (modelId.includes('gpt/')) return 'OpenAI';
    return 'Other';
  }

  getFallbackModels() {
    return [
      {
        id: 'anthropic/claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
        provider: 'Anthropic',
        description: 'Advanced reasoning and creative writing',
        pricing: { coins: 3, words: 1000 },
        maxOutput: 4000
      },
      {
        id: 'openai/gpt-4o',
        name: 'GPT-4o',
        provider: 'OpenAI',
        description: 'Multimodal AI with vision capabilities',
        pricing: { coins: 5, words: 1000 },
        maxOutput: 4000
      },
      {
        id: 'google/gemini-pro-1.5',
        name: 'Gemini Pro 1.5',
        provider: 'Google',
        description: 'Large context window and multimodal',
        pricing: { coins: 4, words: 1000 },
        maxOutput: 8000
      },
      {
        id: 'qwen/qwen-2.5-72b-instruct',
        name: 'Qwen 2.5 72B',
        provider: 'Qwen',
        description: 'Alibaba\'s advanced language model',
        pricing: { coins: 2, words: 1000 },
        maxOutput: 6000
      },
      {
        id: 'deepseek/deepseek-chat',
        name: 'DeepSeek Chat',
        provider: 'DeepSeek',
        description: 'Cost-effective reasoning model',
        pricing: { coins: 1, words: 1000 },
        maxOutput: 4000
      }
    ];
  }
}

export default StraicoService;