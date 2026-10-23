import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Busca os dados do perfil do usuário na tabela profiles
  const fetchProfile = async (userId, userEmail) => {
    try {
      if (!isSupabaseConfigured() || !userId) {
        setProfile(null)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.warn('Erro ao carregar perfil:', error.message)
      }

      if (data) {
        setProfile(data)
      } else {
        // Fallback: se o trigger ainda não tiver criado o perfil, assume dados básicos
        setProfile({
          id: userId,
          email: userEmail,
          name: userEmail ? userEmail.split('@')[0] : 'Usuário',
          role: 'voluntario',
        })
      }
    } catch (err) {
      console.error('Falha na consulta do perfil:', err)
      setProfile(null)
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    let mounted = true

    // 1. Obter sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        fetchProfile(currentUser.id, currentUser.email).finally(() => {
          if (mounted) setLoading(false)
        })
      } else {
        setProfile(null)
        setLoading(false)
      }
    }).catch((err) => {
      console.error('Erro ao verificar sessão inicial:', err)
      if (mounted) setLoading(false)
    })

    // 2. Ouvinte de mudanças na autenticação (login, logout, refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        await fetchProfile(currentUser.id, currentUser.email)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email, password) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase não configurado. Adicione suas chaves no arquivo .env.')
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    if (!isSupabaseConfigured()) return
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setProfile(null)
  }

  const role = profile?.role || 'voluntario'
  const isAdmin = role === 'admin'

  const value = {
    user,
    profile,
    role,
    isAdmin,
    loading,
    signIn,
    signOut,
    refreshProfile: () => user ? fetchProfile(user.id, user.email) : Promise.resolve(),
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider')
  }
  return context
}
