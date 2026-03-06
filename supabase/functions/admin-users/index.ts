import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'No authorization header' }, 401)
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // Verify caller identity
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: caller }, error: callerError } = await adminClient.auth.getUser(token)
    if (callerError || !caller) {
      console.error('Auth error:', callerError?.message)
      return jsonResponse({ error: 'Unauthorized: Invalid token' }, 401)
    }

    // Check super_admin role
    const { data: callerRole, error: roleError } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .single()

    if (roleError) {
      console.error('Role fetch error:', roleError.message)
      return jsonResponse({ error: 'Failed to verify role' }, 500)
    }

    if (!callerRole || callerRole.role !== 'super_admin') {
      return jsonResponse({ error: 'Forbidden: Super admin only' }, 403)
    }

    const body = await req.json()
    const { action, ...params } = body
    console.log('Action:', action, 'Params:', JSON.stringify(params))

    switch (action) {
      case 'create_user': {
        const { email, password, store_name, role } = params
        if (!email || !password || !store_name) {
          return jsonResponse({ error: 'email, password, dan store_name wajib diisi' }, 400)
        }
        if (password.length < 6) {
          return jsonResponse({ error: 'Password minimal 6 karakter' }, 400)
        }

        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { store_name },
        })

        if (createError) {
          console.error('Create user error:', createError.message)
          return jsonResponse({ error: createError.message }, 400)
        }

        // Wait a moment for the trigger to create the user_roles row
        await new Promise(resolve => setTimeout(resolve, 500))

        // Update role if not default 'user'
        const targetRole = role && ['admin', 'user'].includes(role) ? role : 'user'
        const { error: updateError } = await adminClient
          .from('user_roles')
          .update({ role: targetRole, approved: true })
          .eq('user_id', newUser.user.id)

        if (updateError) {
          console.error('Update role error:', updateError.message)
          // User was created but role update failed - try inserting instead
          const { error: insertError } = await adminClient
            .from('user_roles')
            .insert({ user_id: newUser.user.id, role: targetRole, approved: true })
          
          if (insertError) {
            console.error('Insert role error:', insertError.message)
          }
        }

        return jsonResponse({ success: true, user_id: newUser.user.id })
      }

      case 'reset_password': {
        const { user_id, new_password } = params
        if (!user_id || !new_password) {
          return jsonResponse({ error: 'user_id dan new_password wajib diisi' }, 400)
        }
        if (new_password.length < 6) {
          return jsonResponse({ error: 'Password minimal 6 karakter' }, 400)
        }

        const { error } = await adminClient.auth.admin.updateUserById(user_id, {
          password: new_password,
        })

        if (error) {
          console.error('Reset password error:', error.message)
          return jsonResponse({ error: error.message }, 500)
        }
        return jsonResponse({ success: true })
      }

      case 'update_role': {
        const { user_id, new_role } = params
        if (!user_id || !new_role) {
          return jsonResponse({ error: 'user_id dan new_role wajib diisi' }, 400)
        }
        if (!['admin', 'user'].includes(new_role)) {
          return jsonResponse({ error: 'Role tidak valid. Harus admin atau user.' }, 400)
        }

        // Prevent changing super_admin role
        const { data: targetUser } = await adminClient
          .from('user_roles')
          .select('role')
          .eq('user_id', user_id)
          .single()

        if (targetUser?.role === 'super_admin') {
          return jsonResponse({ error: 'Tidak dapat mengubah role Super Admin' }, 403)
        }

        // Upsert: update if exists, insert if not
        const { error } = await adminClient
          .from('user_roles')
          .upsert({ user_id, role: new_role }, { onConflict: 'user_id' })

        if (error) {
          console.error('Update role error:', error.message)
          // Fallback: try update then insert
          const { error: updateErr } = await adminClient
            .from('user_roles')
            .update({ role: new_role })
            .eq('user_id', user_id)
          if (updateErr) {
            return jsonResponse({ error: updateErr.message }, 500)
          }
        }
        return jsonResponse({ success: true })
      }

      case 'approve_user': {
        const { user_id, approved } = params
        if (!user_id || approved === undefined) {
          return jsonResponse({ error: 'user_id dan approved wajib diisi' }, 400)
        }

        // Prevent changing super_admin approval
        const { data: targetUser2 } = await adminClient
          .from('user_roles')
          .select('role')
          .eq('user_id', user_id)
          .single()

        if (targetUser2?.role === 'super_admin') {
          return jsonResponse({ error: 'Tidak dapat mengubah status Super Admin' }, 403)
        }

        // Upsert: handle missing row
        const { error } = await adminClient
          .from('user_roles')
          .upsert({ user_id, approved: !!approved, role: targetUser2?.role || 'user' }, { onConflict: 'user_id' })

        if (error) {
          console.error('Approve user error:', error.message)
          // Fallback
          const { error: updateErr } = await adminClient
            .from('user_roles')
            .update({ approved: !!approved })
            .eq('user_id', user_id)
          if (updateErr) {
            return jsonResponse({ error: updateErr.message }, 500)
          }
        }
        return jsonResponse({ success: true })
      }

      case 'list_users': {
        const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers()
        if (listError) {
          console.error('List users error:', listError.message)
          return jsonResponse({ error: listError.message }, 500)
        }

        const { data: roles, error: rolesError } = await adminClient
          .from('user_roles')
          .select('user_id, role, approved')

        if (rolesError) {
          console.error('Fetch roles error:', rolesError.message)
        }

        const roleMap = new Map((roles || []).map(r => [r.user_id, r]))

        const result = (users || []).map(u => ({
          id: u.id,
          email: u.email,
          role: roleMap.get(u.id)?.role || 'user',
          approved: roleMap.get(u.id)?.approved ?? false,
          created_at: u.created_at,
        }))

        return jsonResponse({ users: result })
      }

      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, 400)
    }
  } catch (error: any) {
    console.error('Unhandled error:', error.message, error.stack)
    return jsonResponse({ error: error.message || 'Internal server error' }, 500)
  }
})
