from supabase import create_client, Client
from app.core.config import settings

# Usamos a Service Key (nível administrativo) para o Backend conseguir
# burlar as regras RLS e executar ações como orquestração de IA
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
