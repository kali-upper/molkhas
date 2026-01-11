// @ts-nocheck: Deno runtime types
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY!,
        'content-type': 'application/json',
      },
      body: JSON.stringify(emailData)
    });

    const data = await response.json();

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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Allow anonymous requests for password reset - no authentication required

  try {
    const body = await req.json();
    const { action } = body;

    // Handle email sending action
    if (action === 'send_reset_email') {
      const { email } = body;

      if (!email) {
        return new Response(
          JSON.stringify({ error: "Email is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Create Supabase client with service role key
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // Generate reset token
      const resetToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

      // Insert token into database
      const { error: insertError } = await supabaseAdmin
        .from('password_reset_tokens')
        .insert({
          user_id: null, // We'll need to get this from email
          email: email,
          token: resetToken,
          expires_at: expiresAt
        });

      if (insertError) {
        console.error('Error creating reset token:', insertError);
        return new Response(
          JSON.stringify({ error: "Failed to create reset token" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Send email
      const emailResult = await sendPasswordResetEmail(email, resetToken);
      if (!emailResult.success) {
        return new Response(
          JSON.stringify({ error: emailResult.error }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Password reset email sent" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Handle password reset action
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return new Response(
        JSON.stringify({ error: "Token and new password are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Clean token - remove any trailing :number (React dev artifact)
    const cleanToken = token.replace(/:\d+$/, '');

    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify the token
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from("password_reset_tokens")
      .select("user_id, email, expires_at, used_at")
      .eq("token", cleanToken)
      .single();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired reset token" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (tokenData.used_at) {
      return new Response(
        JSON.stringify({ error: "Token has already been used" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Token has expired" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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

    const user = userData.users.find(u => u.email === tokenData.email);

    if (!user) {
      console.error("User not found for email:", tokenData.email);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update the user's password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error("Error updating password:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update password" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Mark token as used
    const { error: markError } = await supabaseAdmin
      .from("password_reset_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("token", cleanToken);

    if (markError) {
      console.warn("Failed to mark token as used:", markError);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Password updated successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error in reset-password function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});