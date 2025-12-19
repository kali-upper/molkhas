// Lazy import Google Generative AI to avoid bundling conflicts
let GoogleGenerativeAI: any = null;

// متغير لتتبع حالة الـ AI
let isAIWorking = true;

// Initialize Gemini API - Check localStorage first, then environment
const customApiKey = localStorage.getItem('user_gemini_api_key');
const envApiKey = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_KEY = customApiKey || envApiKey;

console.log('🔑 Custom API key in localStorage:', customApiKey ? 'YES' : 'NO');
console.log('🔑 Environment API key:', envApiKey ? 'YES' : 'NO');
console.log('🔑 Final API key loaded:', GEMINI_API_KEY ? 'YES' : 'NO');
console.log('🔑 Using custom API key:', !!customApiKey);

if (!GEMINI_API_KEY) {
  console.warn('⚠️ VITE_GEMINI_API_KEY environment variable is not set - WhatsApp AI features will be disabled');
  isAIWorking = false;
}

let genAI: any = null;
let model: any = null;

// Lazy initialization function
async function initializeGemini(): Promise<void> {
  if (genAI && model) return; // Already initialized

  try {
    // Dynamic import to avoid bundling conflicts
    const { GoogleGenerativeAI: GAI } = await import('@google/generative-ai');
    GoogleGenerativeAI = GAI;

    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    console.log('✅ Gemini model initialized successfully');
  } catch (error: unknown) {
    console.error('❌ Error initializing Gemini model:', error);
      console.log('💡 Make sure your API key is valid and has proper permissions');
      isAIWorking = false;
      throw error;
    }
}

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



  // Filter response for safety (مُعطل مؤقتًا لأن الرسائل مفلترة مسبقًا)
  private filterResponseForSafety(response: string): string {
    // بما أن الرسائل المصدر مفلترة بالفعل، لا نحتاج فلترة إضافية صارمة
    // لكن نحتفظ بالدالة للأمان المستقبلي
    return response;
  }

  // Generate AI response using relevant context
  async generateResponse(query: string): Promise<string> {
    console.log('🤖 Starting generateResponse for query:', query);
    console.log('📊 Total chat chunks available:', this.chatChunks.length);

    const relevantChunks = this.searchRelevantChunks(query, 8);
    console.log('🔍 Found relevant chunks:', relevantChunks.length);

    if (relevantChunks.length === 0) {
      const totalMessages = this.getStats().totalMessages;
      return `لم أجد معلومات ذات صلة في محادثات المجموعة (${totalMessages} رسائل متاحة) للإجابة على سؤالك. يرجى:\n\n1. إعادة صياغة السؤال بطريقة مختلفة\n2. التأكد من أن المحادثات تحتوي على معلومات حول هذا الموضوع\n3. تحميل محادثات واتساب أكثر شمولاً إذا لزم الأمر.\n\n💡 جرب أسئلة مثل: "متى موعد الامتحان؟" أو "ما هي متطلبات المادة؟"`;
    }

    // Check if Gemini is available and working
    if (!GEMINI_API_KEY || !model) {
      console.log('⚠️ Gemini not available (no API key or model), using fallback');

      // Only show relevant chunks with strict relevance check
      console.log('🔍 Checking relevance for query:', query);
      console.log('📊 Total relevant chunks found:', relevantChunks.length);

      const highlyRelevantChunks = relevantChunks.filter(chunk => {
        // Skip chunks that are too long (likely entire summaries)
        if (chunk.content.length > 2000) {
          console.log('⚠️ Skipping overly long chunk:', chunk.content.substring(0, 100) + '...');
          return false;
        }

        const contentLower = chunk.content.toLowerCase();
        const queryLower = query.toLowerCase();
        let score = 0;

        // Exact phrase match gets highest score
        if (contentLower.includes(queryLower)) score += 15;

        const queryWords = queryLower.split(/\s+/);
        let exactWordMatches = 0;

        for (const word of queryWords) {
          if (word.length > 1) {
            const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
            if (wordRegex.test(contentLower)) {
              score += 5; // Higher score for word boundary matches
              exactWordMatches++;
            } else if (contentLower.includes(word)) {
              score += 1; // Very low score for partial matches
            }
          }
        }

        // For Arabic questions, require at least 2 key words to match
        const arabicQuestionWords = ['متى', 'كيف', 'ما', 'أين', 'من', 'لماذا', 'كم', 'مين'];
        const hasQuestionWord = arabicQuestionWords.some(word => queryLower.includes(word));

        if (hasQuestionWord) {
          // For questions, require at least 2 exact word matches OR high relevance score
          const isRelevant = score >= 12 || (exactWordMatches >= 2 && score >= 8);
          console.log(`🔍 Question "${query}" - Chunk relevance:`, {
            score,
            exactWordMatches,
            contentPreview: chunk.content.substring(0, 100),
            isRelevant
          });
          return isRelevant;
        }

        // For non-questions, require higher relevance
        return score >= 15;
      });

      console.log('✅ Highly relevant chunks after filtering:', highlyRelevantChunks.length);

      if (highlyRelevantChunks.length === 0) {
        const statusMessage = !GEMINI_API_KEY
          ? "مفتاح API غير مُعد - اضف مفتاح API مخصص عبر زر '🔑 API Key'"
          : "مشكلة في تحميل نموذج الذكاء الاصطناعي";
        return `عذراً، لا أستطيع الإجابة على سؤالك حالياً بسبب ${statusMessage}. جرب إعادة صياغة السؤال أو أضف مفتاح API مخصص للحصول على إجابات أفضل.`;
      }

      // Enhanced fallback: Show only highly relevant messages (max 3)
      const context = highlyRelevantChunks
        .slice(0, 3)
        .map(chunk => `${chunk.author || 'مستخدم'}: ${chunk.content}`)
        .join('\n\n');

      const statusMessage = !GEMINI_API_KEY
        ? "مفتاح API غير مُعد - اضف مفتاح API مخصص عبر زر '🔑 API Key'"
        : "مشكلة في تحميل نموذج الذكاء الاصطناعي";

      return `بناءً على المحادثات المتاحة، إليك المعلومات ذات الصلة:\n\n${context}\n\n⚠️ ${statusMessage}`;
    }

    // If AI was disabled due to previous error, try to re-enable it
    if (!isAIWorking) {
      console.log('🔄 AI was disabled, attempting to re-enable...');
      try {
        // Ensure Gemini is initialized
        await initializeGemini();
        // Quick test to see if AI is working now
        const testResult = await model.generateContent('Test if AI is working');
        await testResult.response;
        isAIWorking = true;
        localStorage.setItem('gemini_api_status', 'working');
        localStorage.removeItem('gemini_quota_error');
        console.log('✅ AI re-enabled successfully');
      } catch (testError: unknown) {
        console.log('❌ AI still not working, staying in fallback mode');

        // Only show relevant chunks with strict relevance check
        const highlyRelevantChunks = relevantChunks.filter(chunk => {
          // Skip chunks that are too long (likely entire summaries)
          if (chunk.content.length > 2000) {
            return false;
          }

          const contentLower = chunk.content.toLowerCase();
          const queryLower = query.toLowerCase();
          let score = 0;

          // Exact phrase match gets highest score
          if (contentLower.includes(queryLower)) score += 15;

          const queryWords = queryLower.split(/\s+/);
          let exactWordMatches = 0;

          for (const word of queryWords) {
            if (word.length > 1) {
              const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
              if (wordRegex.test(contentLower)) {
                score += 5; // Higher score for word boundary matches
                exactWordMatches++;
              } else if (contentLower.includes(word)) {
                score += 1; // Very low score for partial matches
              }
            }
          }

          // For Arabic questions, require at least 2 key words to match
          const arabicQuestionWords = ['متى', 'كيف', 'ما', 'أين', 'من', 'لماذا', 'كم', 'مين'];
          const hasQuestionWord = arabicQuestionWords.some(word => queryLower.includes(word));

          if (hasQuestionWord) {
            // For questions, require at least 2 exact word matches OR high relevance score
            return score >= 12 || (exactWordMatches >= 2 && score >= 8);
          }

          // For non-questions, require higher relevance
          return score >= 15;
        });

      console.log('✅ Highly relevant chunks after filtering:', highlyRelevantChunks.length);

        const testErrorMsg = testError instanceof Error ? testError.message : String(testError);

        if (highlyRelevantChunks.length === 0) {
          if (testErrorMsg.includes('429') || testErrorMsg.includes('quota')) {
            const quotaReset = new Date();
            quotaReset.setHours(24, 0, 0, 0);
            const hoursLeft = Math.ceil((quotaReset.getTime() - new Date().getTime()) / (1000 * 60 * 60));
            return `⏰ تم تجاوز الحد المسموح (20 طلب يومياً). ${hoursLeft} ساعة حتى إعادة التعيين.\n💡 للحصول على إجابات ذكية، أضف مفتاح API مخصص عبر زر "🔑 API Key" لتحصل على حد أعلى (60+ طلب يومياً).`;
          } else {
            return `⚠️ الذكاء الاصطناعي غير متاح حالياً بسبب مشكلة تقنية. جرب إعادة تحميل الصفحة أو أضف مفتاح API مخصص.`;
          }
        }

        // Enhanced fallback: Show only highly relevant messages (max 3)
        const context = highlyRelevantChunks
          .slice(0, 3)
          .map(chunk => `${chunk.author || 'مستخدم'}: ${chunk.content}`)
          .join('\n\n');

        if (testErrorMsg.includes('429') || testErrorMsg.includes('quota')) {
          const quotaReset = new Date();
          quotaReset.setHours(24, 0, 0, 0);
          const hoursLeft = Math.ceil((quotaReset.getTime() - new Date().getTime()) / (1000 * 60 * 60));

          return `بناءً على المحادثات المتاحة، إليك المعلومات ذات الصلة:\n\n${context}\n\n⏰ تم تجاوز الحد المسموح (20 طلب يومياً). ${hoursLeft} ساعة حتى إعادة التعيين.\n💡 للحصول على إجابات ذكية، أضف مفتاح API مخصص عبر زر "🔑 API Key" لتحصل على حد أعلى (60+ طلب يومياً).`;
        } else {
          return `بناءً على المحادثات المتاحة، إليك المعلومات ذات الصلة:\n\n${context}\n\n⚠️ الذكاء الاصطناعي غير متاح حالياً بسبب مشكلة تقنية. جرب إعادة تحميل الصفحة أو أضف مفتاح API مخصص.`;
        }
      }
    }

    // Prepare context from relevant chunks
    const context = relevantChunks
      .map(chunk => `[${chunk.timestamp || 'Unknown time'}] ${chunk.author || 'Unknown'}: ${chunk.content}`)
      .join('\n\n');

    const prompt = `أنت مساعد ذكي مفيد يجيب عن الأسئلة بناءً على محادثات مجموعة واتساب جامعية باللغة العربية.

السياق من محادثات المجموعة:
${context}

سؤال المستخدم: ${query}

يرجى تقديم إجابة مفيدة ودقيقة باللغة العربية بناءً على المحادثات أعلاه. إذا لم يمكن الإجابة من السياق المتاح، قل ذلك بلباقة.

تعليمات مهمة:
- ركز على المعلومات التعليمية والجامعية فقط
- كن ودودًا ومحترمًا في الرد
- أشر إلى الرسائل أو الأشخاص المحددين عند الاقتضاء
- إذا كان السؤال عن موعد امتحان أو تفاصيل مادة، قدم المعلومات بشكل مباشر
- تجاهل أي محتوى غير لائق أو هزلي في السياق`;

    try {
      // Ensure Gemini is initialized before using it
      await initializeGemini();

      console.log('🚀 Calling Gemini AI with prompt length:', prompt.length);
      console.log('🔑 API Key present:', GEMINI_API_KEY ? 'YES' : 'NO');

      const result = await model.generateContent(prompt);
      console.log('✅ Gemini API call successful');

      const response = await result.response;
      const aiResponse = response.text();
      console.log('📝 AI Response received, length:', aiResponse.length);
      console.log('📝 AI Response preview:', aiResponse.substring(0, 100) + '...');

      return this.filterResponseForSafety(aiResponse);
    } catch (error: unknown) {
      console.error('❌ Error generating Gemini response:', error);

      // Update AI status on error
      isAIWorking = false;

      const errorMessage = error instanceof Error ? error.message : String(error);

      // More detailed error messages based on error type
      if (errorMessage.includes('API_KEY') || errorMessage.includes('api key')) {
        return "❌ مشكلة في مفتاح API: تأكد من صحة مفتاح Google Gemini API في متغيرات البيئة.";
      } else if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('limit')) {
        localStorage.setItem('gemini_quota_error', new Date().toISOString());
        const quotaReset = new Date();
        quotaReset.setHours(24, 0, 0, 0); // Next midnight UTC

        const hoursLeft = Math.ceil((quotaReset.getTime() - new Date().getTime()) / (1000 * 60 * 60));

        return `⏰ تم تجاوز الحد المسموح للاستخدام المجاني (20 طلب يومياً).\n\n📊 الحالة الحالية:\n• تم استخدام جميع الطلبات المسموحة اليوم\n• إعادة التعيين التلقائي: ${quotaReset.toLocaleString('ar-SA')}\n• الوقت المتبقي: ${hoursLeft} ساعة تقريباً\n\n💡 الحلول:\n• انتظر حتى منتصف الليل لإعادة التعيين التلقائي\n• أضف بطاقة ائتمان لترقية الخطة المجانية\n• استخدم النظام البديل حالياً (يعرض الرسائل ذات الصلة)\n\n🔗 لترقية الخطة: https://ai.google.dev/gemini-api/docs/rate-limits`;
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        return "🌐 مشكلة في الاتصال بالإنترنت. تأكد من اتصالك ثم أعد المحاولة.";
      } else if (errorMessage.includes('model') || errorMessage.includes('not found')) {
        return "🤖 مشكلة في نموذج الذكاء الاصطناعي. قد يكون النموذج غير متاح حالياً.";
      } else {
        return `❌ حدث خطأ تقني: ${errorMessage}\n\n💡 جرب إعادة تحميل الصفحة أو المحاولة مرة أخرى. إذا استمر الخطأ، تأكد من صحة مفتاح API.`;
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
    const quotaReset = localStorage.getItem('gemini_quota_reset');
    const now = new Date();
    const resetTime = quotaReset ? new Date(quotaReset) : null;
    const timeUntilReset = resetTime ? Math.max(0, resetTime.getTime() - now.getTime()) : 0;
    const hoursUntilReset = Math.ceil(timeUntilReset / (1000 * 60 * 60));
    const customApiKey = localStorage.getItem('user_gemini_api_key');

    return {
      isAIWorking,
      hasApiKey: !!GEMINI_API_KEY,
      hasCustomApiKey: !!customApiKey,
      customApiKeyMasked: customApiKey ? `${customApiKey.substring(0, 8)}...${customApiKey.substring(customApiKey.length - 4)}` : null,
      hasModel: !!model || !!GoogleGenerativeAI, // Check if library is loaded or model is initialized
      lastQuotaError: localStorage.getItem('gemini_quota_error'),
      quotaResetTime: quotaReset,
      hoursUntilReset: hoursUntilReset > 0 ? hoursUntilReset : 0,
      status: localStorage.getItem('gemini_api_status')
    };
  }

  // Force re-enable AI (useful after quota reset)
  async forceReEnableAI(): Promise<boolean> {
    if (!GEMINI_API_KEY) return false;

    try {
      // Ensure Gemini is initialized
      await initializeGemini();

      console.log('🔄 Force re-enabling AI...');
      const testResult = await model.generateContent('Test');
      await testResult.response;
      isAIWorking = true;
      localStorage.setItem('gemini_api_status', 'working');
      localStorage.removeItem('gemini_quota_error');
      localStorage.setItem('gemini_last_test', Date.now().toString());
      console.log('✅ AI re-enabled successfully');
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

  // Method to reinitialize Gemini with new API key
  async reinitializeGemini(): Promise<void> {
    console.log('🔄 Reinitializing Gemini API...');

    // Reset the module-level variables to force re-initialization
    genAI = null;
    model = null;
    GoogleGenerativeAI = null;

    try {
      await initializeGemini();
      isAIWorking = true;
      localStorage.setItem('gemini_api_status', 'working');
      console.log('✅ Gemini reinitialized successfully');
    } catch (error: unknown) {
      console.error('❌ Error reinitializing Gemini:', error);
      isAIWorking = false;
    }
  }
}

// Export singleton instance
export const whatsAppAssistant = new WhatsAppAssistant();
