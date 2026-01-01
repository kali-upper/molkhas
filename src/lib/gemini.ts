// Note: Gemini API calls are now handled securely via Supabase Edge Function
// No longer using direct Google Generative AI client for security reasons

// متغير لتتبع حالة الـ AI
let isAIWorking = true;

// Note: Gemini initialization is now handled securely in Supabase Edge Function
// No longer need client-side initialization for security reasons

// Lazy initialization will happen when first needed
console.log('⏸️ Skipping Gemini initialization during module load - will initialize lazily when needed');
console.log('🧪 API will be tested on first actual usage');

// Set initial status based on saved status
const savedStatus = localStorage.getItem('gemini_api_status');
if (savedStatus === 'working') {
  console.log('📊 Using saved status: working');
  isAIWorking = true;
} else if (savedStatus === 'quota_exceeded') {
  console.log('📊 Using saved status: quota exceeded (fallback mode)');
  isAIWorking = false;
} else if (savedStatus === 'error') {
  console.log('📊 Using saved status: error (fallback mode)');
  isAIWorking = false;
} else {
  console.log('📊 No saved status, assuming working');
  isAIWorking = true;
}



export interface ChatChunk {
  id: string;
  content: string;
  timestamp?: string;
  author?: string;
}

export class WhatsAppAssistant {
  private chatChunks: ChatChunk[] = [];

  // Parse WhatsApp export text
  parseWhatsAppExport(text: string): ChatChunk[] {
    const chunks: ChatChunk[] = [];

    // Handle different data formats
    if (text.includes('**1.') && text.includes('**2.')) {
      // This appears to be a structured summary format, split by numbered sections
      const sections = text.split(/\*\*\d+\./).filter(section => section.trim());
      let chunkIndex = 0;

      for (const section of sections) {
        if (section.trim()) {
          chunks.push({
            id: `chunk_${chunkIndex++}`,
            content: section.trim(),
            timestamp: new Date().toISOString(), // Use current time for imported data
            author: 'Summary'
          });
        }
      }
    } else {
      // Standard WhatsApp export parsing
      const lines = text.split('\n');
      let currentMessage = '';
      let currentTimestamp = '';
      let currentAuthor = '';

      for (const line of lines) {
        // WhatsApp export format: [12/17/25, 10:30:45 AM] Author: Message
        const timestampMatch = line.match(/^\[([^\]]+)\]/);

        if (timestampMatch) {
          // Save previous message if exists
          if (currentMessage.trim()) {
            chunks.push({
              id: `chunk_${chunks.length}`,
              content: currentMessage.trim(),
              timestamp: currentTimestamp,
              author: currentAuthor
            });
          }

          // Start new message
          const messagePart = line.replace(timestampMatch[0], '').trim();
          const colonIndex = messagePart.indexOf(':');

          if (colonIndex !== -1) {
            currentAuthor = messagePart.substring(0, colonIndex).trim();
            currentMessage = messagePart.substring(colonIndex + 1).trim();
          } else {
            currentAuthor = 'System';
            currentMessage = messagePart;
          }

          currentTimestamp = timestampMatch[1];
        } else if (line.trim()) {
          // Continuation of previous message
          currentMessage += '\n' + line;
        }
      }

      // Save last message
      if (currentMessage.trim()) {
        chunks.push({
          id: `chunk_${chunks.length}`,
          content: currentMessage.trim(),
          timestamp: currentTimestamp,
          author: currentAuthor
        });
      }
    }

    this.chatChunks = chunks;
    console.log(`📊 Parsed into ${chunks.length} chunks`);
    return chunks;
  }

  // Search for relevant chunks based on query
  searchRelevantChunks(query: string, maxResults: number = 5): ChatChunk[] {
    if (!query.trim()) return [];

    const queryLower = query.toLowerCase();
    const scoredChunks = this.chatChunks
      // فلترة أولية: استبعاد الرسائل المحذوفة، النظام، النقط، الرسائل الهزلية أو القصيرة جداً
      .filter(chunk => {
        const c = chunk.content.trim();

        if (!c || c === '.' || c.length < 6) return false;
        if (/this message was deleted/i.test(c)) return false;
        if (chunk.author === 'System') return false;
        if (/^(اه|ايوه|تمام|نعم|طيب|لا)$/i.test(c)) return false; // ردود سريعة بلا معنى
        if (/^<Media omitted>/i.test(c)) return false;

        return true;
      })
      .map(chunk => {
        const contentLower = chunk.content.toLowerCase();
        const authorLower = chunk.author?.toLowerCase() || '';

        // Simple scoring based on keyword matches
        let score = 0;

        // Exact phrase match gets highest score
        if (contentLower.includes(queryLower)) {
          score += 10;
        }

        // Individual word matches
        const queryWords = queryLower.split(/\s+/);
        for (const word of queryWords) {
          if (word.length > 1) { // Allow 2+ letter words for Arabic
            // Check for exact word matches and partial matches
            const wordRegex = new RegExp(`\\b${word}\\b`, 'i'); // Word boundaries
            if (wordRegex.test(contentLower)) {
              score += 4; // Higher score for word boundary matches
            } else if (contentLower.includes(word)) {
              score += 2; // Lower score for partial matches
            }
            if (authorLower.includes(word)) {
              score += 2;
            }
          }
        }

        // Additional scoring for Arabic-specific patterns
        if (queryLower.includes('متى') && contentLower.includes('موعد')) score += 3;
        if (queryLower.includes('كيف') && contentLower.includes('طريقة')) score += 3;
        if (queryLower.includes('ما') && contentLower.includes('معلومات')) score += 3;

        // Recent messages get slight boost (if timestamp available)
        if (chunk.timestamp) {
          score += 0.1;
        }

        return { chunk, score };
      });

    // Sort by score and return top results
    return scoredChunks
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(item => item.chunk);
  }




  // Generate AI response using secure Supabase Edge Function
  async generateResponse(query: string): Promise<string> {
    console.log('🤖 Starting generateResponse for query:', query);
    console.log('📊 Total chat chunks available:', this.chatChunks.length);

    const relevantChunks = this.searchRelevantChunks(query, 8);
    console.log('🔍 Found relevant chunks:', relevantChunks.length);

    if (relevantChunks.length === 0) {
      const totalMessages = this.getStats().totalMessages;
      return `لم أجد معلومات ذات صلة في محادثات المجموعة (${totalMessages} رسائل متاحة) للإجابة على سؤالك. يرجى:\n\n1. إعادة صياغة السؤال بطريقة مختلفة\n2. التأكد من أن المحادثات تحتوي على معلومات حول هذا الموضوع\n3. تحميل محادثات واتساب أكثر شمولاً إذا لزم الأمر.\n\n💡 جرب أسئلة مثل: "متى موعد الامتحان؟" أو "ما هي متطلبات المادة؟"`;
    }

    try {
      // Note: Authentication is handled by Supabase Edge Function
      const userId = null; // Will be handled by Edge Function

      // Call Supabase Edge Function instead of direct API
      const { supabase } = await import('./supabase');

      console.log('🚀 Calling Supabase Edge Function...');

      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          query,
          relevantChunks,
          userId
        }
      });

      if (error) {
        console.error('❌ Edge Function error:', error);
        throw error;
      }

      console.log('✅ Edge Function response received');
      return data.response;

    } catch (error: unknown) {
      console.error('❌ Error calling Edge Function:', error);

      // Fallback to showing relevant chunks
      console.log('📋 Using fallback - showing relevant chunks');

      const context = relevantChunks
        .slice(0, 3)
        .map(chunk => `${chunk.author || 'مستخدم'}: ${chunk.content}`)
        .join('\n\n');

      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('429') || errorMessage.includes('quota')) {
        return `⏰ جميع مفاتيح API المتاحة انتهت حدودها اليومية!\n\nبناءً على المحادثات المتاحة، إليك المعلومات ذات الصلة:\n\n${context}\n\n💡 انتظر 24 ساعة لإعادة التعيين التلقائي أو أضف بطاقة ائتمان لترقية الخطة.`;
      } else {
        return `⚠️ مشكلة في خدمة الذكاء الاصطناعي حالياً.\n\nبناءً على المحادثات المتاحة، إليك المعلومات ذات الصلة:\n\n${context}\n\n💡 جرب إعادة تحميل الصفحة أو المحاولة مرة أخرى لاحقاً.`;
      }
    }
  }

  // Get all chunks
  getAllChunks(): ChatChunk[] {
    return this.chatChunks;
  }

  // Clear all data
  clearData(): void {
    this.chatChunks = [];
  }

  // Get statistics
  getStats() {
    return {
      totalChunks: this.chatChunks.length,
      totalMessages: this.chatChunks.length,
      authors: [...new Set(this.chatChunks.map(c => c.author).filter(Boolean))].length
    };
  }

  // Check AI status
  getAIStatus() {
    const customApiKey = localStorage.getItem('user_gemini_api_key');
    const quotaErrorTimestamp = localStorage.getItem('gemini_quota_error');

    // Calculate hours until quota reset (24 hours from quota error)
    let hoursUntilReset = 0;
    if (quotaErrorTimestamp) {
      const errorTime = new Date(quotaErrorTimestamp).getTime();
      const now = Date.now();
      const resetTime = errorTime + (24 * 60 * 60 * 1000); // 24 hours in milliseconds
      const msUntilReset = resetTime - now;
      hoursUntilReset = Math.max(0, Math.ceil(msUntilReset / (60 * 60 * 1000)));
    }

    return {
      isAIWorking,
      hasApiKey: true, // Edge Function handles API keys securely
      hasCustomApiKey: !!customApiKey,
      customApiKeyMasked: customApiKey ? `${customApiKey.substring(0, 8)}...${customApiKey.substring(customApiKey.length - 4)}` : null,
      hasModel: true, // Edge Function handles model initialization
      lastQuotaError: localStorage.getItem('gemini_quota_error'),
      hoursUntilReset,
      status: 'secure_edge_function', // Indicate secure implementation
    };
  }

  // Force re-enable AI (useful after quota reset)
  async forceReEnableAI(): Promise<boolean> {
    try {
      console.log('🔄 Force re-enabling AI...');

      // Test the Edge Function instead of direct API
      const { supabase } = await import('./supabase');

      const { error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          query: 'test',
          relevantChunks: [{ content: 'test', author: 'system' }],
          userId: null
        }
      });

      if (error) {
        console.log('❌ Edge Function test failed:', error);
        localStorage.setItem('gemini_api_status', 'error');
        return false;
      }

      isAIWorking = true;
      localStorage.setItem('gemini_api_status', 'working');
      localStorage.removeItem('gemini_quota_error');
      localStorage.setItem('gemini_last_test', Date.now().toString());
      console.log('✅ AI re-enabled successfully via Edge Function');
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log('❌ Failed to re-enable AI:', errorMessage);

      if (errorMessage.includes('429') || errorMessage.includes('quota')) {
        localStorage.setItem('gemini_quota_error', new Date().toISOString());
        localStorage.setItem('gemini_api_status', 'quota_exceeded');
      } else {
        localStorage.setItem('gemini_api_status', 'error');
      }

      return false;
    }
  }

  async loadAllData(): Promise<void> {
    console.log('🔄 Loading WhatsApp data from GitHub...');

    const filesToLoad = [
      'https://raw.githubusercontent.com/kali-upper/whatsapp-group/refs/heads/main/data.txt'
    ];

    let totalLoaded = 0;

    for (const fileUrl of filesToLoad) {
      try {
        console.log(`📂 Loading: ${fileUrl}`);
        const response = await fetch(fileUrl);

        if (!response.ok) {
          console.warn(`⚠️ Failed to load ${fileUrl}: ${response.status}`);
          continue; // Skip this file and try next
        }

        const text = await response.text();
        const chunks = this.parseWhatsAppExport(text);
        totalLoaded += chunks.length;

        console.log(`✅ Loaded ${fileUrl}: ${chunks.length} messages`);
      } catch (error) {
        console.error(`❌ Error loading ${fileUrl}:`, error);
      }
    }

    // Also try to load local data.txt if available (for development)
    try {
      console.log('📂 Checking for local data.txt...');
      const localResponse = await fetch('/data.txt');
      if (localResponse.ok) {
        const localText = await localResponse.text();
        const localChunks = this.parseWhatsAppExport(localText);
        console.log(`✅ Loaded local data.txt: ${localChunks.length} messages`);
        totalLoaded += localChunks.length;
      }
    } catch {
      console.log('ℹ️ Local data.txt not available (this is normal in production)');
    }

    const stats = this.getStats();
    console.log('🎉 Data loading complete:', stats);

    if (totalLoaded < 10) {
      console.warn('⚠️ Very limited data loaded. Consider adding more chat files for better AI responses.');
    }
  }

  // Load data from a local file (for manual upload)
  async loadFromText(text: string): Promise<void> {
    console.log('🔄 Loading WhatsApp data from text...');
    const chunks = this.parseWhatsAppExport(text);
    console.log(`✅ Loaded from text: ${chunks.length} messages`);

    const stats = this.getStats();
    console.log('📊 Current stats:', stats);

    if (chunks.length < 10) {
      console.warn('⚠️ Limited data loaded. More data = better AI responses!');
    }
  }

  // Legacy function for backward compatibility
  async loadSampleData(): Promise<void> {
    return this.loadAllData();
  }

  // Method to reinitialize Gemini API status (for Edge Function system)
  async reinitializeGemini(): Promise<void> {
    console.log('🔄 Reinitializing Gemini API status...');

    try {
      // Clear any cached API key status
      localStorage.removeItem('gemini_api_status');
      localStorage.removeItem('gemini_quota_error');
      localStorage.removeItem('gemini_last_test');

      // Reset to default state
      isAIWorking = true;
      localStorage.setItem('gemini_api_status', 'working');
      console.log('✅ Gemini API status reinitialized successfully');
    } catch (error: unknown) {
      console.error('❌ Error reinitializing Gemini API status:', error);
      isAIWorking = false;
    }
  }
}

// Export singleton instance
export const whatsAppAssistant = new WhatsAppAssistant();
