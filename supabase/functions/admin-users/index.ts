import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Verify the caller is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create client with caller's token to verify identity
    const callerClient = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false }
    })

    const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser(authHeader.replace('Bearer ', ''))
    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verify caller is super_admin using service role client
    const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
    
    const { data: callerRole } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .single()

    if (!callerRole || callerRole.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Super admin only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { action, ...params } = await req.json()

    switch (action) {
      case 'reset_password': {
        const { user_id, new_password } = params
        if (!user_id || !new_password) {
          return new Response(JSON.stringify({ error: 'user_id and new_password required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        if (new_password.length < 6) {
          return new Response(JSON.stringify({ error: 'Password minimal 6 karakter' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const { error } = await adminClient.auth.admin.updateUserById(user_id, {
          password: new_password
        })

        if (error) throw error
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'update_role': {
        const { user_id, new_role } = params
        if (!user_id || !new_role) {
          return new Response(JSON.stringify({ error: 'user_id and new_role required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        if (!['admin', 'user'].includes(new_role)) {
          return new Response(JSON.stringify({ error: 'Invalid role' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const { error } = await adminClient
          .from('user_roles')
          .update({ role: new_role })
          .eq('user_id', user_id)

        if (error) throw error
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'approve_user': {
        const { user_id, approved } = params
        if (!user_id || approved === undefined) {
          return new Response(JSON.stringify({ error: 'user_id and approved required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const { error } = await adminClient
          .from('user_roles')
          .update({ approved })
          .eq('user_id', user_id)

        if (error) throw error
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'list_users': {
        // Get all users from auth
        const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers()
        if (listError) throw listError

        // Get all roles
        const { data: roles } = await adminClient.from('user_roles').select('*')

        const roleMap = new Map((roles || []).map(r => [r.user_id, r]))

        const result = (users || []).map(u => ({
          id: u.id,
          email: u.email,
          role: roleMap.get(u.id)?.role || 'user',
          approved: roleMap.get(u.id)?.approved ?? false,
          created_at: u.created_at,
        }))

        return new Response(JSON.stringify({ users: result }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
