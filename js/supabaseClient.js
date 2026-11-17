// =====================================================================
// CONVITE EXCLUSIVO — Cliente Supabase
// =====================================================================
// Importa a biblioteca oficial do Supabase diretamente de um CDN (ESM),
// sem necessidade de npm/build step. Versão fixada deliberadamente —
// atualiza o número de versão aqui se precisares de uma mais recente.
// =====================================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { CONFIGURACAO } from './config.js';

export const supabase = createClient(
  CONFIGURACAO.SUPABASE_URL,
  CONFIGURACAO.SUPABASE_ANON_KEY,
  {
    auth: {
      // Página pública do convidado nunca precisa de sessão persistida
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
