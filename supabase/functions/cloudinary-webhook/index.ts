import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const payload = await req.json()

    // التحقق من API Key للأمان
    const webhookKey = req.headers.get('x-api-key')
    const expectedKey = Deno.env.get('CLOUDINARY_WEBHOOK_KEY')

    if (webhookKey !== expectedKey) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Cloudinary webhook received:', payload)

    if (payload.notification_type === 'upload') {
      // حفظ الملف في قاعدة البيانات
      const { data: summary, error } = await supabase
        .from('summaries')
        .insert({
          title: payload.public_id || 'ملف جديد',
          pdf_url: payload.url,
          status: 'pending',
          subject: payload.tags?.[0] || 'غير محدد',
          year: payload.tags?.[1] || 'غير محدد',
          department: payload.tags?.[2] || 'ذكاء اصطناعي',
          content: `تم رفع الملف عبر Cloudinary: ${payload.public_id}`,
          contributor_name: payload.context?.custom?.contributor || null
        })
        .select()
        .single()

      if (error) throw error

      // إرسال إشعار للمدراء
      const { data: admins } = await supabase
        .from('admins')
        .select('user_id')

      if (admins && admins.length > 0) {
        const notifications = admins.map((admin: any) => ({
          user_id: admin.user_id,
          title: "ملف جديد مرفوع 📎",
          message: `تم رفع "${payload.public_id}" وينتظر المراجعة`,
          type: "admin_submission",
          related_id: summary.id,
          related_type: "summary",
          read: false
        }))

        await supabase.from('notifications').insert(notifications)
      }

      return new Response(
        JSON.stringify({ success: true, summary_id: summary.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ message: 'Webhook processed successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})