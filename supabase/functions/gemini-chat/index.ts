// @ts-nocheck: Deno runtime types
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.24.1"

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Gemini API Keys (secure server-side)
const GENERAL_API_KEYS = [
  Deno.env.get('GENERAL_API_KEY_1'),
  Deno.env.get('GENERAL_API_KEY_2'),
  Deno.env.get('GENERAL_API_KEY_3'),
].filter(Boolean) // Filter out empty keys

// Personal API key (optional)
const PERSONAL_API_KEY = Deno.env.get('GEMINI_API_KEY')

// Track exhausted keys in database
interface ExhaustedKey {
  api_key: string
  exhausted_at: string
  user_id?: string
}

async function getExhaustedKeys(userId?: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('exhausted_api_keys')
    .select('api_key')
    .eq(userId ? 'user_id' : 'user_id', userId || null)

  if (error) {
    console.error('Error fetching exhausted keys:', error)
    return []
  }

  return data?.map(row => row.api_key) || []
}

// Rate limiting function
async function checkRateLimit(identifier: string, maxRequests: number = 5, windowMinutes: number = 1): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .rpc('check_rate_limit', {
        p_identifier: identifier,
        p_endpoint: 'gemini-chat',
        p_max_requests: maxRequests,
        p_window_minutes: windowMinutes
      })

    if (error) {
      console.error('Rate limit check error:', error)
      // Allow request on error to avoid blocking legitimate users
      return true
    }

    return data as boolean
  } catch (error) {
    console.error('Rate limit function error:', error)
    // Allow request on error
    return true
  }
}

// Get user admin status for rate limiting
async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', userId)
      .limit(1)

    return !error && data && data.length > 0
  } catch (error) {
    console.error('Admin check error:', error)
    return false
  }
}

async function markKeyAsExhausted(apiKey: string, userId?: string): Promise<void> {
  const { error } = await supabase
    .from('exhausted_api_keys')
    .insert({
      api_key: apiKey,
      user_id: userId,
      exhausted_at: new Date().toISOString()
    })

  if (error) {
    console.error('Error marking key as exhausted:', error)
  }
}

async function getAvailableGeneralKey(userId?: string): Promise<string | null> {
  const exhaustedKeys = await getExhaustedKeys(userId)

  for (const key of GENERAL_API_KEYS) {
    if (key && !exhaustedKeys.includes(key)) {
      return key
    }
  }

  return null
}

async function callGeminiAPI(apiKey: string, prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-3-flash-preview',
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
      thinkingConfig: {
        thinkingLevel: "high"
      },
    },
  })

  const result = await model.generateContent(prompt)
  const response = await result.response
  return response.text()
}

async function generateAIResponse(query: string, relevantChunks: any[], userId?: string): Promise<string> {
  // Try personal key first
  if (PERSONAL_API_KEY) {
    try {
      console.log('🔄 Trying personal API key...')

      const context = relevantChunks
        .map(chunk => `[${chunk.timestamp || 'Unknown time'}] ${chunk.author || 'Unknown'}: ${chunk.content}`)
        .join('\n\n')

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
- تجاهل أي محتوى غير لائق أو هزلي في السياق`

      return await callGeminiAPI(PERSONAL_API_KEY, prompt)
    } catch (error: any) {
      console.log('⏰ Personal API key exhausted, trying general keys...')

      // Mark personal key as exhausted for this user
      if (error.message?.includes('429') || error.message?.includes('quota')) {
        await markKeyAsExhausted(PERSONAL_API_KEY, userId)
      }

      // Try general keys
      const generalKey = await getAvailableGeneralKey(userId)
      if (generalKey) {
        try {
          console.log('🔄 Using general API key...')
          const prompt = `أنت مساعد ذكي مفيد يجيب عن الأسئلة بناءً على محادثات مجموعة واتساب جامعية باللغة العربية.

السياق من محادثات المجموعة:
${relevantChunks.map(chunk => `[${chunk.timestamp || 'Unknown time'}] ${chunk.author || 'Unknown'}: ${chunk.content}`).join('\n\n')}

سؤال المستخدم: ${query}

يرجى تقديم إجابة مفيدة ودقيقة باللغة العربية. هذه إجابة من نظام احتياطي بسبب انتهاء الحد الشخصي.`

          const response = await callGeminiAPI(generalKey, prompt)
          return `🤖 تم استخدام مفتاح API عام احتياطي (لأن الحد الشخصي انتهى)\n\n${response}`
        } catch (generalError: any) {
          console.log('❌ General API key also failed')

          // Mark general key as exhausted
          if (generalError.message?.includes('429') || generalError.message?.includes('quota')) {
            await markKeyAsExhausted(generalKey, userId)
          }

          // Try next general key
          const nextKey = await getAvailableGeneralKey(userId)
          if (nextKey) {
            try {
              const prompt = `أنت مساعد ذكي مفيد يجيب عن الأسئلة بناءً على محادثات مجموعة واتساب جامعية باللغة العربية.

السياق من محادثات المجموعة:
${relevantChunks.map(chunk => `[${chunk.timestamp || 'Unknown time'}] ${chunk.author || 'Unknown'}: ${chunk.content}`).join('\n\n')}

سؤال المستخدم: ${query}

يرجى تقديم إجابة مفيدة ودقيقة باللغة العربية. هذه محاولة ثانية من النظام الاحتياطي.`

              const response = await callGeminiAPI(nextKey, prompt)
              return `🤖 تم استخدام مفتاح API عام احتياطي (لأن الحد الشخصي انتهى)\n\n${response}`
            } catch (finalError: any) {
              console.log('🚫 All general API keys exhausted')
              await markKeyAsExhausted(nextKey, userId)
            }
          }
        }
      }
    }
  }

  // If no personal key, try general keys directly
  const generalKey = await getAvailableGeneralKey(userId)
  if (generalKey) {
    try {
      console.log('🔄 Using general API key (no personal key available)...')

      const context = relevantChunks
        .map(chunk => `[${chunk.timestamp || 'Unknown time'}] ${chunk.author || 'Unknown'}: ${chunk.content}`)
        .join('\n\n')

      const prompt = `أنت مساعد ذكي مفيد يجيب عن الأسئلة بناءً على محادثات مجموعة واتساب جامعية باللغة العربية.

السياق من محادثات المجموعة:
${context}

سؤال المستخدم: ${query}

يرجى تقديم إجابة مفيدة ودقيقة باللغة العربية.`

      return await callGeminiAPI(generalKey, prompt)
    } catch (error: any) {
      console.log('❌ General API key failed')
      await markKeyAsExhausted(generalKey, userId)
    }
  }

  // Fallback to showing relevant chunks
  console.log('📋 Using fallback - showing relevant chunks')
  const context = relevantChunks
    .slice(0, 3)
    .map(chunk => `${chunk.author || 'مستخدم'}: ${chunk.content}`)
    .join('\n\n')

  return `عذراً، لا أستطيع الإجابة على سؤالك حالياً بسبب مشاكل تقنية في خدمة الذكاء الاصطناعي. إليك المعلومات ذات الصلة من المحادثات:\n\n${context}\n\n💡 جرب إعادة تحميل الصفحة أو المحاولة مرة أخرى لاحقاً.`
}

Deno.serve(async (req) => {
  try {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      })
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Rate Limiting Protection
    const authHeader = req.headers.get('Authorization')
    const clientIP = req.headers.get('x-forwarded-for') ||
                     req.headers.get('x-real-ip') ||
                     'unknown-ip'

    let identifier: string
    let maxRequests: number
    let isAdmin = false

    // Extract user ID from JWT token if authenticated
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const { data: { user }, error } = await supabase.auth.getUser(token)

        if (!error && user) {
          identifier = user.id
          isAdmin = await isUserAdmin(user.id)
          maxRequests = isAdmin ? 20 : 5 // Admins: 20 req/min, Users: 5 req/min
        } else {
          // Invalid token, treat as unauthenticated
          identifier = clientIP
          maxRequests = 2 // Unauthenticated: 2 req/min
        }
      } catch (error) {
        console.error('Token verification error:', error)
        identifier = clientIP
        maxRequests = 2
      }
    } else {
      // No auth header, use IP for rate limiting
      identifier = clientIP
      maxRequests = 2 // Unauthenticated: 2 req/min
    }

    // Check rate limit
    const rateLimitAllowed = await checkRateLimit(identifier, maxRequests, 1)
    if (!rateLimitAllowed) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        message: `Too many requests. Limit: ${maxRequests} requests per minute.`,
        retryAfter: 60
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Retry-After': '60'
        }
      })
    }

    const { query, relevantChunks, userId } = await req.json()

    if (!query || !relevantChunks) {
      return new Response(JSON.stringify({ error: 'Missing required fields: query and relevantChunks' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const response = await generateAIResponse(query, relevantChunks, userId)

    // Content Security Policy for API responses (not directly applicable but good practice)
    const cspHeader = [
      "default-src 'self'",
      "script-src 'none'",
      "style-src 'none'",
      "img-src 'none'",
      "connect-src 'none'",
      "font-src 'none'",
      "object-src 'none'",
      "base-uri 'none'",
      "form-action 'none'",
      "frame-ancestors 'none'"
    ].join('; ');

    return new Response(JSON.stringify({ response }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    })

  } catch (error) {
    console.error('Edge Function Error:', error)

    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
})
