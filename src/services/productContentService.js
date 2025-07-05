import StraicoService from './straicoService';

class ProductContentService extends StraicoService {
  async generateProductContent(description, productParams = {}, selectedModel = null, contentType = 'both') {
    try {
      console.log('Generating product content with params:', {
        description,
        productParams,
        selectedModel,
        contentType
      });

      // If a specific model is selected, use the API directly
      if (selectedModel) {
        return await this.generateContentWithModel(description, productParams, selectedModel, contentType);
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
          const jsonMatch = response.data.completion.match(/\[[\s\S]*\]/) || 
                           response.data.completion.match(/\{[\s\S]*\}/);
          
          if (jsonMatch) {
            const parsedContent = JSON.parse(jsonMatch[0]);
            if (Array.isArray(parsedContent)) {
              return parsedContent.map((item, index) => ({
                title: item.title || '',
                description: item.description || '',
                platform: productParams.platform || 'General',
                variation: item.variation || `Version ${index + 1}`,
                timestamp: new Date().toISOString()
              }));
            } else {
              // Single object response
              return [{
                title: parsedContent.title || '',
                description: parsedContent.description || '',
                platform: productParams.platform || 'General',
                variation: 'Generated Version',
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
    const category = productParams.category || 'General';
    const targetAudience = productParams.targetAudience || 'General';
    const platform = productParams.platform || 'General';
    const tone = productParams.tone || 'Professional';
    const priceRange = productParams.priceRange || 'Mid-range';
    const brandStyle = productParams.brandStyle || 'Modern';

    let systemPrompt = "You are an expert e-commerce copywriter specializing in creating compelling, direct-to-use product titles and descriptions for online marketplaces. ";
    systemPrompt += "Your output should be ready-to-use content that can be directly copied and pasted into e-commerce platforms. ";
    systemPrompt += "Focus on creating practical, sales-oriented content that drives conversions. ";

    if (category !== 'General') {
      systemPrompt += `Focus on ${category} products. `;
    }

    if (targetAudience !== 'General') {
      systemPrompt += `Target audience: ${targetAudience}. `;
    }

    if (platform !== 'General') {
      systemPrompt += `Optimize for ${platform} platform requirements and best practices. `;
    }

    systemPrompt += `Use a ${tone.toLowerCase()} tone. `;
    systemPrompt += `Position as ${priceRange.toLowerCase()} price range product. `;
    systemPrompt += `Reflect ${brandStyle.toLowerCase()} brand style. `;

    // Content type specific instructions
    if (contentType === 'title') {
      systemPrompt += "Focus ONLY on creating compelling, SEO-friendly product titles that are ready for immediate use on e-commerce platforms. ";
      systemPrompt += "Titles should be concise, descriptive, include key features, and follow platform best practices. ";
    } else if (contentType === 'description') {
      systemPrompt += "Focus ONLY on creating detailed, persuasive product descriptions that are ready for immediate use on e-commerce platforms. ";
      systemPrompt += "Descriptions should highlight benefits, features, specifications, and include compelling selling points. ";
    } else {
      systemPrompt += "Create both compelling titles AND detailed descriptions that are ready for immediate use on e-commerce platforms. ";
      systemPrompt += "Each title should be concise and SEO-friendly. Each description should be detailed and persuasive. ";
    }

    systemPrompt += "IMPORTANT: Generate ALL content in English only. Do not use any Chinese characters. ";
    systemPrompt += "Make the content professional, engaging, and optimized for e-commerce conversion. ";
    systemPrompt += "Avoid generic promotional language and focus on specific product benefits and features. ";

    return systemPrompt;
  }

  buildProductUserPrompt(description, productParams, contentType) {
    const keyFeatures = productParams.keyFeatures || '';
    const manualPrompt = productParams.manualPrompt || '';
    const category = productParams.category || 'general';
    const targetAudience = productParams.targetAudience || 'general';
    const platform = productParams.platform || 'e-commerce';
    const customInstructions = productParams.customInstructions || '';

    let prompt = `Based on this product image analysis, generate ready-to-use e-commerce content IN ENGLISH ONLY:\n\nProduct Analysis: ${description}\n\n`;

    if (keyFeatures.trim()) {
      prompt += `Key Features: ${keyFeatures}\n\n`;
    }

    if (customInstructions.trim()) {
      prompt += `Custom Instructions: ${customInstructions}\n\n`;
    }

    if (manualPrompt.trim()) {
      prompt += `Additional Requirements: ${manualPrompt}\n\n`;
    }

    // Content type specific requirements
    if (contentType === 'title') {
      prompt += `Please generate 5 different READY-TO-USE product titles IN ENGLISH that are:
- Compelling and attention-grabbing
- SEO-friendly with relevant keywords
- Optimized for ${platform} platform
- Targeted at ${targetAudience} audience
- Suitable for ${category} category
- Between 60-150 characters (platform dependent)
- Include key product features and benefits

IMPORTANT: These should be actual product titles ready to use on e-commerce platforms, NOT AI prompt descriptions.
Format as JSON array with objects containing 'title' and 'variation' fields.`;
    } else if (contentType === 'description') {
      prompt += `Please generate 3 different READY-TO-USE product descriptions IN ENGLISH that are:
- Detailed and informative about actual product features
- Highlight specific benefits and use cases
- Include technical specifications when relevant
- Persuasive and conversion-focused
- Optimized for ${platform} platform
- Targeted at ${targetAudience} audience
- 150-500 words depending on product complexity
- Include bullet points for key features
- Professional and trustworthy tone

IMPORTANT: These should be actual product descriptions ready to use on e-commerce platforms, NOT AI prompt descriptions.
Format as JSON array with objects containing 'description' and 'variation' fields.`;
    } else {
      prompt += `Please generate 3 different sets of READY-TO-USE product content IN ENGLISH, each containing:
- A compelling product title (60-150 characters, SEO-friendly, platform-optimized)
- A detailed product description (150-500 words, feature-focused, conversion-oriented)

Requirements:
- Optimize for ${platform} platform
- Target ${targetAudience} audience
- Suitable for ${category} category
- Focus on actual product features, benefits, and specifications
- Professional and sales-oriented language
- Include technical details and use cases
- Ready for immediate use on e-commerce platforms

IMPORTANT: These should be actual e-commerce content ready for immediate use, NOT AI prompt descriptions.
Format as JSON array with objects containing 'title', 'description', and 'variation' fields.`;
    }

    return prompt;
  }

  parseProductTextResponse(text, productParams, contentType) {
    const contents = [];
    
    // Clean the text and split into sections
    const cleanText = text.replace(/```json|```/g, '').trim();
    const sections = cleanText.split(/\n\s*\n/).filter(section => section.trim().length > 10);

    if (contentType === 'title') {
      // Extract titles only
      sections.slice(0, 5).forEach((section, index) => {
        const lines = section.split('\n').filter(line => line.trim().length > 5);
        lines.forEach((line) => {
          if (contents.length < 5) {
            const cleanedTitle = this.cleanProductTitle(line);
            if (cleanedTitle.length > 10) {
              contents.push({
                title: cleanedTitle,
                description: '',
                platform: productParams.platform || 'General',
                variation: `Title Version ${contents.length + 1}`,
                timestamp: new Date().toISOString()
              });
            }
          }
        });
      });
    } else if (contentType === 'description') {
      // Extract descriptions only
      sections.slice(0, 3).forEach((section, index) => {
        const cleanedDesc = this.cleanProductDescription(section);
        if (cleanedDesc.length > 50) {
          contents.push({
            title: '',
            description: cleanedDesc,
            platform: productParams.platform || 'General',
            variation: `Description Version ${index + 1}`,
            timestamp: new Date().toISOString()
          });
        }
      });
    } else {
      // Extract both titles and descriptions
      sections.forEach((section) => {
        if (contents.length < 3) {
          const lines = section.split('\n').filter(line => line.trim().length > 5);
          let title = '';
          let description = '';

          // Try to identify title and description parts
          lines.forEach(line => {
            const cleanLine = line.trim();
            if (cleanLine.length < 100 && !title) {
              // Likely a title
              title = this.cleanProductTitle(cleanLine);
            } else if (cleanLine.length > 50 && !description) {
              // Likely a description
              description = this.cleanProductDescription(cleanLine);
            }
          });

          // If we couldn't separate them, treat the whole section as description
          if (!title && !description) {
            description = this.cleanProductDescription(section);
            title = this.generateFallbackTitle(description, productParams);
          }

          if (title || description) {
            contents.push({
              title: title || this.generateFallbackTitle(description, productParams),
              description: description || this.generateFallbackDescription(title, productParams),
              platform: productParams.platform || 'General',
              variation: `Complete Version ${contents.length + 1}`,
              timestamp: new Date().toISOString()
            });
          }
        }
      });
    }

    // If we don't have enough content, generate fallback
    if (contents.length === 0) {
      return this.generateFallbackContent(text, productParams, contentType);
    }

    return contents;
  }

  cleanProductTitle(text) {
    return text
      .replace(/^\d+\.?\s*/, '')
      .replace(/^[-*•]\s*/, '')
      .replace(/^Title:\s*/i, '')
      .replace(/^Product\s*Title:\s*/i, '')
      .replace(/"/g, '')
      .trim();
  }

  cleanProductDescription(text) {
    return text
      .replace(/^\d+\.?\s*/, '')
      .replace(/^[-*•]\s*/, '')
      .replace(/^Description:\s*/i, '')
      .replace(/^Product\s*Description:\s*/i, '')
      .replace(/"/g, '')
      .trim();
  }

  generateFallbackTitle(description, productParams) {
    const category = productParams.category || 'Product';
    const words = description.split(' ').slice(0, 8).join(' ');
    return `Premium ${category} - ${words}`.substring(0, 100);
  }

  generateFallbackDescription(title, productParams) {
    const category = productParams.category || 'product';
    const targetAudience = productParams.targetAudience || 'customers';
    return `This high-quality ${category} is designed for ${targetAudience} who value excellence and reliability. Features premium construction and superior performance.`;
  }

  generateFallbackContent(description, productParams, contentType) {
    const contents = [];
    
    // Safely extract parameters with defaults
    const category = productParams.category || 'General';
    const targetAudience = productParams.targetAudience || 'General';
    const platform = productParams.platform || 'General';
    const tone = productParams.tone || 'Professional';
    const priceRange = productParams.priceRange || 'Mid-range';
    const brandStyle = productParams.brandStyle || 'Modern';

    // Simple fallback templates
    const templates = [
      {
        name: 'Professional Listing',
        title: `Premium ${category} - High Quality Product`,
        description: `Experience the difference with our premium ${category.toLowerCase()}. This high-quality product features advanced design and delivers exceptional performance. Perfect for ${targetAudience.toLowerCase()} who value excellence.\n\nKey Features:\n• Premium construction\n• Superior performance\n• Reliable operation\n\nWhy Choose This Product:\n• Enhanced performance\n• Long-lasting durability\n• User-friendly design\n\nIdeal for customers who value quality and reliability.`
      },
      {
        name: 'Feature-Focused',
        title: `${brandStyle} ${category} with Advanced Features`,
        description: `Discover superior performance with our ${category.toLowerCase()}. Engineered with advanced technology and built to last, this product delivers exceptional results.\n\n🌟 Premium Features:\n• Advanced engineering\n• Quality materials\n• Precision craftsmanship\n\n💪 Performance Benefits:\n• Optimal efficiency\n• Consistent results\n• Reliable operation\n\nPerfect for professional use and everyday applications.`
      },
      {
        name: 'Benefit-Driven',
        title: `Superior ${category} - ${tone} Quality for ${targetAudience}`,
        description: `Transform your experience with our premium ${category.toLowerCase()}. This quality solution addresses your needs while providing outstanding results.\n\n🎯 What You Get:\n• Premium quality product\n• Professional-grade performance\n• Reliable functionality\n\n📈 Results You'll See:\n• Improved efficiency\n• Enhanced performance\n• Greater satisfaction\n\nSpecifications: High-quality construction\nCompatibility: Universal design\nWarranty: Quality guarantee included`
      }
    ];

    templates.forEach((template, index) => {
      const content = {
        platform: platform,
        variation: template.name,
        timestamp: new Date().toISOString()
      };

      if (contentType === 'title' || contentType === 'both') {
        content.title = template.title;
      }

      if (contentType === 'description' || contentType === 'both') {
        content.description = template.description;
      }

      contents.push(content);
    });

    return contents.slice(0, contentType === 'title' ? 5 : 3);
  }
}

export default ProductContentService;