import sys
sys.path.append('.')
from app.core.database import get_supabase_client
supabase = get_supabase_client()
res1 = supabase.table('join_requests').delete().neq('status', 'invalid').execute()
res2 = supabase.table('notifications').delete().neq('type', 'invalid').execute()
print(f'Deleted {len(res1.data) if hasattr(res1, "data") and res1.data else 0} join requests')
print(f'Deleted {len(res2.data) if hasattr(res2, "data") and res2.data else 0} notifications')
