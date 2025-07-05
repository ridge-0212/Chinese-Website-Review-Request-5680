import StraicoService from './straicoService';

class ProductContentService extends StraicoService {
  async generateProductContent(description, productParams = {}, selectedModel = null, contentType = 'both') {
    try {
      console.log('Generating product content with params:', { description, productParams, selectedModel, contentType });

      // If a specific model is selected, use the API directly
      if (selectedModel) {
        return this.generateContentWithModel(description, productParams, selectedModel, contentType);
      }

      // Otherwise use the fallback method
      return this.generateFallbackContent(description, productParams, contentType);
    } catch (error) {
      console.error('Product content generation error:', error);
      // Fallback to template-based generation if API fails
      console.log('Using fallback product content generation...');
      return this.generateFallbackContent(description, productParams, contentType);
    }
  }

  async generateContentWithModel(description, productParams, modelId, contentType) {
    try {
      console.log(`Using model ${modelId} for product content generation`);

      const systemPrompt = this.buildProductSystemPrompt(productParams, contentType);
      const userPrompt = this.buildProductUserPrompt(description, productParams, contentType);

      const requestBody = {
        model: modelId,
        message: userPrompt,
        system_prompt: systemPrompt
      };

      console.log('API Request:', requestBody);

      const response = await this.client.post('/prompt/completion', requestBody);
      
      console.log('API Response:', response.data);

      if (response.data && response.data.completion) {
        try {
          // Try to parse JSON response
          const jsonMatch = response.data.completion.match(/\[[\s\S]*\]/) || response.data.completion.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsedContent = JSON.parse(jsonMatch[0]);
            if (Array.isArray(parsedContent)) {
              return parsedContent.map((item, index) => ({
                title: item.title || '',
                description: item.description || '',
                platform: productParams.platform || 'General',
                variation: item.variation || `版本 ${index + 1}`,
                timestamp: new Date().toISOString()
              }));
            } else {
              // Single object response
              return [{
                title: parsedContent.title || '',
                description: parsedContent.description || '',
                platform: productParams.platform || 'General',
                variation: '生成版本',
                timestamp: new Date().toISOString()
              }];
            }
          }
        } catch (parseError) {
          console.log('Could not parse JSON, using text processing...');
        }

        // Fallback: process plain text response
        return this.parseProductTextResponse(response.data.completion, productParams, contentType);
      }

      throw new Error('Invalid API response format');
    } catch (error) {
      console.error('Model-specific product content generation failed:', error);
      // Fallback to template-based generation
      return this.generateFallbackContent(description, productParams, contentType);
    }
  }

  buildProductSystemPrompt(productParams, contentType) {
    const { category, targetAudience, platform, tone, language, priceRange, brandStyle } = productParams;

    let systemPrompt = "You are an expert e-commerce copywriter specializing in creating compelling product titles and descriptions. ";
    
    if (category && category !== 'General') {
      systemPrompt += `Focus on ${category} products. `;
    }
    
    if (targetAudience && targetAudience !== 'General') {
      systemPrompt += `Target audience: ${targetAudience}. `;
    }
    
    if (platform && platform !== 'General') {
      systemPrompt += `Optimize for ${platform} platform. `;
    }
    
    if (tone) {
      systemPrompt += `Use a ${tone.toLowerCase()} tone. `;
    }
    
    if (priceRange) {
      systemPrompt += `Position as ${priceRange.toLowerCase()} price range product. `;
    }
    
    if (brandStyle) {
      systemPrompt += `Reflect ${brandStyle.toLowerCase()} brand style. `;
    }

    // Content type specific instructions
    switch (contentType) {
      case 'title':
        systemPrompt += "Focus only on creating compelling, SEO-friendly product titles. ";
        break;
      case 'description':
        systemPrompt += "Focus only on creating detailed, persuasive product descriptions. ";
        break;
      default:
        systemPrompt += "Create both compelling titles and detailed descriptions. ";
    }

    if (language === 'Chinese' || language === 'Both') {
      systemPrompt += "Generate content in Chinese (Simplified). ";
    } else if (language === 'English') {
      systemPrompt += "Generate content in English. ";
    }

    systemPrompt += "Make the content engaging, informative, and optimized for e-commerce conversion.";

    return systemPrompt;
  }

  buildProductUserPrompt(description, productParams, contentType) {
    const { keyFeatures, manualPrompt, category, targetAudience, platform } = productParams;

    let prompt = `Based on this product image analysis, generate e-commerce content:\n\nProduct Analysis: ${description}\n\n`;

    if (keyFeatures && keyFeatures.trim()) {
      prompt += `Key Features: ${keyFeatures}\n\n`;
    }

    if (manualPrompt && manualPrompt.trim()) {
      prompt += `Special Requirements: ${manualPrompt}\n\n`;
    }

    // Content type specific requirements
    switch (contentType) {
      case 'title':
        prompt += `Please generate 5 different product titles that are:
- Compelling and attention-grabbing
- SEO-friendly with relevant keywords
- Appropriate for ${platform || 'e-commerce'} platform
- Targeted at ${targetAudience || 'general'} audience
- Suitable for ${category || 'general'} category

Format as JSON array with objects containing 'title' and 'variation' fields.`;
        break;
      
      case 'description':
        prompt += `Please generate 3 different product descriptions that are:
- Detailed and informative
- Highlight key benefits and features
- Persuasive and conversion-focused
- Appropriate for ${platform || 'e-commerce'} platform
- Targeted at ${targetAudience || 'general'} audience

Format as JSON array with objects containing 'description' and 'variation' fields.`;
        break;
      
      default:
        prompt += `Please generate 3 different sets of product content, each containing:
- A compelling product title (concise, SEO-friendly)
- A detailed product description (informative, persuasive)

Requirements:
- Optimize for ${platform || 'e-commerce'} platform
- Target ${targetAudience || 'general'} audience
- Suitable for ${category || 'general'} category
- Focus on conversion and engagement

Format as JSON array with objects containing 'title', 'description', and 'variation' fields.`;
    }

    return prompt;
  }

  parseProductTextResponse(text, productParams, contentType) {
    const contents = [];
    
    // Try to extract structured content from text
    const lines = text.split(/\n+/).filter(line => line.trim().length > 5);
    
    if (contentType === 'title') {
      // Extract titles only
      lines.slice(0, 5).forEach((line, index) => {
        const cleanedTitle = line.replace(/^\d+\.?\s*/, '').replace(/^[-*]\s*/, '').trim();
        if (cleanedTitle.length > 5) {
          contents.push({
            title: cleanedTitle,
            description: '',
            platform: productParams.platform || 'General',
            variation: `标题版本 ${index + 1}`,
            timestamp: new Date().toISOString()
          });
        }
      });
    } else if (contentType === 'description') {
      // Extract descriptions only
      lines.slice(0, 3).forEach((line, index) => {
        const cleanedDesc = line.replace(/^\d+\.?\s*/, '').replace(/^[-*]\s*/, '').trim();
        if (cleanedDesc.length > 10) {
          contents.push({
            title: '',
            description: cleanedDesc,
            platform: productParams.platform || 'General',
            variation: `描述版本 ${index + 1}`,
            timestamp: new Date().toISOString()
          });
        }
      });
    } else {
      // Extract both titles and descriptions
      for (let i = 0; i < Math.min(3, Math.floor(lines.length / 2)); i++) {
        const titleLine = lines[i * 2];
        const descLine = lines[i * 2 + 1];
        
        if (titleLine && descLine) {
          contents.push({
            title: titleLine.replace(/^\d+\.?\s*/, '').replace(/^[-*]\s*/, '').trim(),
            description: descLine.replace(/^\d+\.?\s*/, '').replace(/^[-*]\s*/, '').trim(),
            platform: productParams.platform || 'General',
            variation: `完整版本 ${i + 1}`,
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    // If we don't have enough content, generate fallback
    if (contents.length === 0) {
      return this.generateFallbackContent(text, productParams, contentType);
    }

    return contents;
  }

  generateFallbackContent(description, productParams, contentType) {
    const contents = [];
    const { category, targetAudience, platform, tone, language } = productParams;

    // Template-based generation for different content types
    const templates = this.getContentTemplates(contentType, productParams);

    templates.forEach((template, index) => {
      const content = {
        platform: platform || 'General',
        variation: template.name,
        timestamp: new Date().toISOString()
      };

      if (contentType === 'title' || contentType === 'both') {
        content.title = this.applyTemplate(template.title, description, productParams);
      }

      if (contentType === 'description' || contentType === 'both') {
        content.description = this.applyTemplate(template.description, description, productParams);
      }

      contents.push(content);
    });

    return contents;
  }

  getContentTemplates(contentType, productParams) {
    const { tone, priceRange, brandStyle } = productParams;

    const templates = [
      {
        name: '经典版本',
        title: '[PRODUCT] - [FEATURES] [QUALITY]',
        description: '这款[PRODUCT]具有[FEATURES]，专为[AUDIENCE]设计。[QUALITY]品质，[BENEFITS]。适合[USAGE]，是您的理想选择。'
      },
      {
        name: '营销版本', 
        title: '【[QUALITY]】[PRODUCT] [FEATURES] [BENEFIT]',
        description: '✨ [PRODUCT]震撼上市！[FEATURES]设计，[QUALITY]品质保证。[BENEFITS]，让您体验前所未有的[EXPERIENCE]。现在购买，享受[OFFER]！'
      },
      {
        name: '专业版本',
        title: '[BRAND_STYLE] [PRODUCT] | [KEY_FEATURE] | [QUALITY]品质',
        description: '专业[PRODUCT]，采用[FEATURES]技术。[QUALITY]材质制造，确保[BENEFITS]。经过严格测试，为[AUDIENCE]提供可靠的[SOLUTION]。'
      }
    ];

    // Adjust templates based on tone
    if (tone === 'Luxury') {
      templates.push({
        name: '奢华版本',
        title: '【奢华精选】[PRODUCT] - [PREMIUM_FEATURES]',
        description: '臻选[PRODUCT]，匠心工艺，[PREMIUM_FEATURES]。为追求品质生活的您而设计，每一处细节都彰显奢华品味。限量珍藏，尊享专属体验。'
      });
    }

    if (tone === 'Casual') {
      templates.push({
        name: '轻松版本',
        title: '[PRODUCT] 好用到飞起！[FEATURES]',
        description: '超好用的[PRODUCT]来啦！[FEATURES]真的很棒，用过的都说好。[BENEFITS]，生活更轻松。赶紧入手吧，不会后悔的！'
      });
    }

    return templates.slice(0, contentType === 'title' ? 5 : 3);
  }

  applyTemplate(template, description, productParams) {
    const { category, targetAudience, keyFeatures, priceRange } = productParams;

    // Extract product name from description
    const productName = this.extractProductName(description, category);
    
    let result = template
      .replace(/\[PRODUCT\]/g, productName)
      .replace(/\[FEATURES\]/g, keyFeatures || this.extractFeatures(description))
      .replace(/\[QUALITY\]/g, this.getQualityTerm(priceRange))
      .replace(/\[AUDIENCE\]/g, targetAudience || '用户')
      .replace(/\[BENEFITS\]/g, this.generateBenefits(description))
      .replace(/\[USAGE\]/g, this.generateUsage(category))
      .replace(/\[EXPERIENCE\]/g, this.generateExperience(category))
      .replace(/\[OFFER\]/g, '优惠价格')
      .replace(/\[SOLUTION\]/g, this.generateSolution(category))
      .replace(/\[BRAND_STYLE\]/g, productParams.brandStyle || '精品')
      .replace(/\[KEY_FEATURE\]/g, this.extractKeyFeature(description))
      .replace(/\[PREMIUM_FEATURES\]/g, this.generatePremiumFeatures(description));

    return result;
  }

  extractProductName(description, category) {
    // Simple product name extraction logic
    const words = description.split(' ').slice(0, 3);
    return words.join(' ') || category || '产品';
  }

  extractFeatures(description) {
    // Extract key features from description
    const features = description.substring(0, 50);
    return features || '优质特性';
  }

  extractKeyFeature(description) {
    // Extract the most prominent feature
    const words = description.split(' ');
    return words[0] || '创新';
  }

  getQualityTerm(priceRange) {
    const qualityTerms = {
      'Budget': '实用',
      'Mid-range': '优质',
      'Premium': '高端',
      'Luxury': '奢华'
    };
    return qualityTerms[priceRange] || '优质';
  }

  generateBenefits(description) {
    return '为您带来便利与舒适';
  }

  generateUsage(category) {
    const usageMap = {
      'Fashion': '日常穿搭',
      'Electronics': '日常使用',
      'Home & Garden': '家居生活',
      'Beauty & Health': '日常护理'
    };
    return usageMap[category] || '多种场合';
  }

  generateExperience(category) {
    const experienceMap = {
      'Fashion': '时尚体验',
      'Electronics': '科技体验', 
      'Home & Garden': '生活体验',
      'Beauty & Health': '美丽体验'
    };
    return experienceMap[category] || '优质体验';
  }

  generateSolution(category) {
    return '完美解决方案';
  }

  generatePremiumFeatures(description) {
    return '顶级工艺与卓越性能';
  }
}

export default ProductContentService;