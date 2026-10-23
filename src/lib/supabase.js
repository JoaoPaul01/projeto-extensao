import { createClient } from '@supabase/supabase-js'

// Normaliza a URL do Supabase removendo eventuais sufixos como /rest/v1/ ou barras finais
const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

const cleanSupabaseUrl = rawUrl
  ? rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')
  : ''

export const isSupabaseConfigured = () => {
  return Boolean(
    cleanSupabaseUrl &&
    rawKey &&
    cleanSupabaseUrl !== 'https://seu-projeto.supabase.co' &&
    rawKey !== 'sua-chave-publica-anon-aqui'
  )
}

// Inicializa o cliente Supabase oficial com a URL base limpa e chave pública
export const supabase = createClient(
  cleanSupabaseUrl || 'https://placeholder.supabase.co',
  rawKey || 'placeholder-anon-key'
)
