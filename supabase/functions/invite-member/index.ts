import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role, organization')
      .eq('id', user.id)
      .single()

    if (callerProfile?.role !== 'Admin') {
      throw new Error('Only admins can invite members')
    }

    const { email, fullName, role, color, initials } = await req.json()
    if (!email || !fullName) throw new Error('email and fullName are required')

    const derivedInitials = initials ?? fullName.trim().split(' ')
      .map((w: string) => w[0]?.toUpperCase() ?? '')
      .slice(0, 2)
      .join('')

    // Generate invite link — Supabase does NOT send any email with this method
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email,
      options: {
        data: {
          full_name:    fullName,
          role,
          color,
          initials:     derivedInitials,
          organization: callerProfile.organization,
        },
      },
    })

    if (linkError) {
      const msg = linkError.message?.toLowerCase() ?? ''
      if (msg.includes('already been registered') || msg.includes('already exists') || msg.includes('user already')) {
        throw new Error('A user with this email already exists.')
      }
      if (msg.includes('invalid email') || msg.includes('unable to validate')) {
        throw new Error('The email address is invalid.')
      }
      throw new Error(linkError.message)
    }

    const inviteUrl = linkData.properties?.action_link
    if (!inviteUrl) throw new Error('Failed to generate invite link')

    // Send email via Resend HTTP API — no SMTP needed
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) throw new Error('RESEND_API_KEY is not configured')

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Tempo <onboarding@resend.dev>',
        to:   [email],
        subject: "You've been invited to join Tempo",
        html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <h2>You've been invited to Tempo</h2>
          <p>Hi ${fullName}, you've been invited to join your team on Tempo as <strong>${role}</strong>.</p>
          <a href="${inviteUrl}" style="display:inline-block;background:#c8602a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Accept Invite</a>
          <p style="color:#aaa;font-size:12px;margin-top:24px">If you were not expecting this invitation, you can ignore this email. This link expires in 24 hours.</p>
        </div>`,
      }),
    })

    if (!emailRes.ok) {
      const errBody = await emailRes.json().catch(() => ({})) as Record<string, unknown>
      throw new Error(`Resend error: ${errBody?.message ?? emailRes.statusText}`)
    }

    // Pre-create profile so member appears in UI immediately
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id:           linkData.user.id,
          full_name:    fullName,
          email,
          role,
          color,
          initials:     derivedInitials,
          organization: callerProfile.organization,
          is_active:    true,
        },
        { onConflict: 'id' },
      )

    if (profileError) {
      const profileErrMsg = profileError.message ?? profileError.details ?? JSON.stringify(profileError)
      console.error('Profile upsert failed (invite was sent):', profileErrMsg)
      return new Response(
        JSON.stringify({ success: true, warning: `Invite sent but profile sync failed: ${profileErrMsg}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: unknown) {
    let message = 'Unknown error'
    if (err instanceof Error) {
      message = err.message
    } else if (err && typeof err === 'object') {
      const e = err as Record<string, unknown>
      message = (e.message as string) ?? (e.details as string) ?? JSON.stringify(err)
    }
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
