// @ts-nocheck: Deno runtime types
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { nanoid } from "https://esm.sh/nanoid@3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Brevo API configuration
const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// Function to send password reset email
async function sendPasswordResetEmail(email: string, resetToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Use localhost for development, or configure a proper frontend URL
    const frontendUrl = 'http://localhost:5173'; // Change this for production
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const emailData = {
      sender: {
        name: 'مولكاس - منصة الملخصات',
        email: 'masarx.eg@gmail.com'
      },
      to: [{
        email: email
      }],
      subject: 'إعادة تعيين كلمة المرور - مولكاس',
      htmlContent: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>إعادة تعيين كلمة المرور</title>
        </head>
        <body style="font-family: 'Cairo', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">مولكاس</h1>
              <p style="color: #e8e8e8; margin: 10px 0 0 0; font-size: 16px;">منصة الملخصات الجامعية</p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #333; margin-bottom: 20px; text-align: center;">إعادة تعيين كلمة المرور</h2>

              <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
                مرحباً،
              </p>

              <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
                تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك في منصة مولكاس.
                لإعادة تعيين كلمة المرور، يرجى النقر على الزر أدناه:
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="${resetUrl}"
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                          color: white;
                          padding: 15px 30px;
                          text-decoration: none;
                          border-radius: 8px;
                          font-weight: bold;
                          display: inline-block;
                          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                          transition: all 0.3s ease;">
                  إعادة تعيين كلمة المرور
                </a>
              </div>

              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                إذا لم تقم بطلب إعادة التعيين، يمكنك تجاهل هذا الإيميل.
              </p>

              <p style="color: #999; font-size: 14px; line-height: 1.5;">
                <strong>ملاحظات مهمة:</strong><br>
                • هذا الرابط صالح لمدة 24 ساعة فقط<br>
                • لا تشارك هذا الرابط مع أي شخص<br>
                • إذا لم يعمل الزر، يمكنك نسخ ولصق الرابط التالي في المتصفح:<br>
                <span style="word-break: break-all; color: #667eea;">${resetUrl}</span>
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #666; margin: 0; font-size: 14px;">
                مع تحيات فريق<br>
                <strong>منصة مولكاس</strong>
              </p>
              <p style="color: #999; margin: 10px 0 0 0; font-size: 12px;">
                هذا إيميل آلي، يرجى عدم الرد عليه
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      textContent: `
        مولكاس - إعادة تعيين كلمة المرور

        مرحباً،

        تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك في منصة مولكاس.

        لإعادة تعيين كلمة المرور، يرجى زيارة الرابط التالي:
        ${resetUrl}

        إذا لم تقم بطلب إعادة التعيين، يمكنك تجاهل هذا الإيميل.

        ملاحظات مهمة:
        • هذا الرابط صالح لمدة 24 ساعة فقط
        • لا تشارك هذا الرابط مع أي شخص

        مع تحيات فريق منصة مولكاس
      `
    };

    console.log("BREVO_API_KEY present:", !!BREVO_API_KEY);
    console.log("BREVO_API_URL:", BREVO_API_URL);
    console.log("Sending email data:", JSON.stringify(emailData, null, 2));

    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY!,
        'content-type': 'application/json',
      },
      body: JSON.stringify(emailData)
    });

    console.log("Brevo response status:", response.status);
    const data = await response.json();
    console.log("Brevo response data:", data);

    if (!response.ok) {
      console.error('Brevo API error:', data);
      return { success: false, error: data.message || 'فشل في إرسال الإيميل' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending email via Brevo:', error);
    return { success: false, error: 'خطأ في الاتصال بخوادم الإيميل' };
  }
}

serve(async (req) => {
  console.log("🚀 PASSWORD RESET FUNCTION CALLED - Method:", req.method, "Timestamp:", new Date().toISOString());

  // Allow anonymous requests for password reset - no authentication required
  console.log("Request headers:", Object.fromEntries(req.headers.entries()));

  // Simple test response first
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({
        message: "Function is working",
        env: {
          supabaseUrl: Deno.env.get('SUPABASE_URL') ? "present" : "missing",
          serviceRoleKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? "present" : "missing",
          brevoApiKey: Deno.env.get('BREVO_API_KEY') ? "present" : "missing"
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Test Brevo API key
  if (req.method === 'PUT') {
    const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
    if (!BREVO_API_KEY) {
      return new Response(
        JSON.stringify({ error: "BREVO_API_KEY not found" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/account', {
        method: 'GET',
        headers: {
          'api-key': BREVO_API_KEY,
          'accept': 'application/json',
        },
      });

      const data = await response.json();

      return new Response(
        JSON.stringify({
          status: response.status,
          data: data,
          apiKeyValid: response.ok
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  // Test email sending
  if (req.method === 'PATCH') {
    const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
    if (!BREVO_API_KEY) {
      return new Response(
        JSON.stringify({ error: "BREVO_API_KEY not found" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const testEmailData = {
      sender: {
        name: 'مولكاس - اختبار',
        email: 'masarx.eg@gmail.com'
      },
      to: [{
        email: 'ahmedaboalayoun0016k@gmail.com'
      }],
      subject: 'اختبار إرسال الإيميل - مولكاس',
      htmlContent: '<h1>هذا اختبار للإيميل</h1><p>إذا وصلك ده يعني الإيميل شغال!</p>',
      textContent: 'هذا اختبار للإيميل. إذا وصلك ده يعني الإيميل شغال!'
    };

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': BREVO_API_KEY,
          'content-type': 'application/json',
        },
        body: JSON.stringify(testEmailData)
      });

      const data = await response.json();

      return new Response(
        JSON.stringify({
          status: response.status,
          data: data,
          emailSent: response.ok
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("About to read request body...");
    let body;
    try {
      body = await req.text();
      console.log("Raw body received:", body);
    } catch (bodyError) {
      console.error("Error reading body:", bodyError);
      return new Response(
        JSON.stringify({ error: "Failed to read request body", details: bodyError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let requestData;
    try {
      requestData = JSON.parse(body);
      console.log("Parsed request data:", requestData);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON", details: parseError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { email } = requestData;
    console.log("Email received:", email);

    // Check if email exists
    if (!email) {
      console.log("No email provided");
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client
    console.log("=== PASSWORD RESET REQUEST STARTED ===");
    console.log("Request timestamp:", new Date().toISOString());

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log("Environment check:", {
      supabaseUrl: supabaseUrl ? "✅ present" : "❌ missing",
      serviceRoleKey: serviceRoleKey ? "✅ present" : "❌ missing",
      brevoApiKey: Deno.env.get('BREVO_API_KEY') ? "✅ present" : "❌ missing"
    });

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("❌ Missing required environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ Environment variables OK, creating Supabase client...");

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey
    );

    console.log("Supabase client initialized successfully");

    // Create password reset token
    console.log("Creating password reset token for email:", email);

    // Find the user by email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();

    if (userError) {
      console.error("Error listing users:", userError);
      return new Response(
        JSON.stringify({ error: "Failed to find user" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const user = userData.users.find(u => u.email === email);

    if (!user) {
      console.log("User not found for email:", email, "- but we'll still create the token for security");
    }

    // Generate reset token
    const resetToken = nanoid(32);

    console.log("Generated token:", resetToken);

    // Insert token into database
    console.log("Inserting token into database...");
    console.log("About to insert token for email:", email);
    console.log("Using Supabase URL:", supabaseUrl);
    console.log("Using service role key present:", !!serviceRoleKey);

    const insertPayload = {
      user_id: user ? user.id : null,
      email: email,
      token: resetToken,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    console.log("Insert payload:", insertPayload);

    const { data: insertData, error: tokenError } = await supabaseAdmin
      .from('password_reset_tokens')
      .insert(insertPayload)
      .select();

    console.log("Insert completed - Data:", insertData, "Error:", tokenError);

    if (tokenError) {
      console.error("Error creating reset token:", tokenError);
      return new Response(
        JSON.stringify({
          error: "Failed to create reset token",
          details: tokenError
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Token created successfully, sending email...");

    // Send reset email
    console.log("Sending email to:", email);
    const emailResult = await sendPasswordResetEmail(email, resetToken);

    console.log("Email result:", emailResult);

    if (!emailResult.success) {
      console.error("Email sending failed:", emailResult.error);
      // Clean up the token if email failed
      await supabaseAdmin
        .from('password_reset_tokens')
        .delete()
        .eq('token', resetToken);

      return new Response(
        JSON.stringify({
          error: "Failed to send email",
          details: emailResult.error
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Password reset email sent successfully!");

    // Always return success for security (don't reveal if email exists)
    return new Response(
      JSON.stringify({
        success: true,
        message: "إذا كان البريد الإلكتروني مسجل في النظام، ستتلقى رسالة إعادة التعيين"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error in request-password-reset function:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});