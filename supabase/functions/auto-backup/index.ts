import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BackupData {
  products: any[];
  suppliers: any[];
  purchases: any[];
  debts: any[];
  expenses: any[];
  transactions: any[];
  projects: any[];
  profile: any;
  backupDate: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if this is a manual backup request with auth
    const authHeader = req.headers.get('Authorization');
    let targetUserId: string | null = null;

    if (authHeader) {
      // Manual backup - get user from auth header
      const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } }
      });
      
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      targetUserId = user.id;
    }

    // Get all users or specific user
    let userIds: string[] = [];
    
    if (targetUserId) {
      userIds = [targetUserId];
    } else {
      // Auto backup - get all users from profiles
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id');
      
      if (profilesError) throw profilesError;
      userIds = profiles?.map(p => p.id) || [];
    }

    console.log(`Processing backup for ${userIds.length} user(s)`);

    const results: { userId: string; success: boolean; error?: string }[] = [];

    for (const userId of userIds) {
      try {
        // Fetch all user data
        const [
          productsRes,
          suppliersRes,
          purchasesRes,
          debtsRes,
          expensesRes,
          transactionsRes,
          projectsRes,
          profileRes
        ] = await Promise.all([
          supabaseAdmin.from('products').select('*').eq('user_id', userId),
          supabaseAdmin.from('suppliers').select('*').eq('user_id', userId),
          supabaseAdmin.from('purchases').select('*').eq('user_id', userId),
          supabaseAdmin.from('debts').select('*').eq('user_id', userId),
          supabaseAdmin.from('expenses').select('*').eq('user_id', userId),
          supabaseAdmin.from('transactions').select('*').eq('user_id', userId),
          supabaseAdmin.from('projects').select('*').eq('user_id', userId),
          supabaseAdmin.from('profiles').select('*').eq('id', userId).single()
        ]);

        const backupData: BackupData = {
          products: productsRes.data || [],
          suppliers: suppliersRes.data || [],
          purchases: purchasesRes.data || [],
          debts: debtsRes.data || [],
          expenses: expensesRes.data || [],
          transactions: transactionsRes.data || [],
          projects: projectsRes.data || [],
          profile: profileRes.data || null,
          backupDate: new Date().toISOString()
        };

        // Insert backup
        const { error: insertError } = await supabaseAdmin
          .from('backups')
          .insert({
            user_id: userId,
            backup_data: backupData,
            backup_type: targetUserId ? 'manual' : 'auto'
          });

        if (insertError) throw insertError;

        // Keep only last 7 backups per user
        const { data: oldBackups } = await supabaseAdmin
          .from('backups')
          .select('id, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (oldBackups && oldBackups.length > 7) {
          const toDelete = oldBackups.slice(7).map(b => b.id);
          await supabaseAdmin
            .from('backups')
            .delete()
            .in('id', toDelete);
        }

        results.push({ userId, success: true });
      } catch (error) {
        console.error(`Backup failed for user ${userId}:`, error);
        results.push({ userId, success: false, error: String(error) });
      }
    }

    const successCount = results.filter(r => r.success).length;
    
    return new Response(JSON.stringify({
      message: `Backup completed for ${successCount}/${userIds.length} users`,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Backup error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
