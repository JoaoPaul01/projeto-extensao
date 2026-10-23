import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { isSupabaseConfigured } from '../lib/supabase'
import { Heart, Lock, Mail, AlertCircle, ShieldCheck, Info } from 'lucide-react'

export const Login = () => {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const configured = isSupabaseConfigured()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (!configured) {
      setErrorMessage('O sistema ainda não está conectado ao Supabase. Preencha as chaves no arquivo .env para continuar.')
      return
    }

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Por favor, informe seu e-mail e senha de acesso.')
      return
    }

    try {
      setLoading(true)
      await signIn(email.trim(), password)
    } catch (err) {
      console.error('Erro de autenticação:', err)
      if (err.message?.includes('Invalid login credentials') || err.message?.includes('invalid')) {
        setErrorMessage('E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.')
      } else if (err.message?.includes('Email not confirmed')) {
        setErrorMessage('Este e-mail ainda não foi confirmado no Supabase Auth. Marque como confirmado no painel.')
      } else {
        setErrorMessage(err.message || 'Falha ao autenticar. Tente novamente mais tarde.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-slate-50 to-teal-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Identidade Visual */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <Heart className="w-9 h-9 fill-current" />
          </div>
        </div>
        <h1 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
          Acolher
        </h1>
        <p className="mt-1 text-center text-sm font-medium text-emerald-700">
          Sistema de Gerenciamento de Doações
        </p>
        <p className="text-center text-xs text-slate-500 mt-1">
          Projeto de Extensão Universitária • ADS
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-100 sm:px-10">
          
          {/* Alerta de Configuração Supabase (se pendente) */}
          {!configured && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <div className="flex items-start space-x-2">
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-amber-900">Aguardando configuração do Supabase</p>
                  <p className="mt-1 leading-relaxed">
                    Copie o arquivo <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">.env.example</code> para <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">.env</code> e preencha suas variáveis <code className="font-mono">VITE_SUPABASE_URL</code> e <code className="font-mono">VITE_SUPABASE_ANON_KEY</code>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Mensagem de Erro */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                E-mail institucional
              </label>
              <div className="mt-1.5 relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@instituicao.org"
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                Senha de acesso
              </label>
              <div className="mt-1.5 relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-2xl shadow-md shadow-emerald-200 text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center space-x-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Acessando...</span>
                </span>
              ) : (
                'Entrar no Sistema'
              )}
            </button>
          </form>

          {/* Dica para Avaliação / Demonstração */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Ambiente de Demonstração Acadêmica.
              <br />
              Acesso restrito a colaboradores e voluntários credenciados.
            </p>
          </div>
        </div>

        {/* Aviso de Proteção de Dados (LGPD) */}
        <div className="mt-8 p-4 bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/80 text-xs text-slate-600 shadow-sm flex items-start space-x-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-slate-800">Privacidade e Proteção de Dados (LGPD):</span>{' '}
            Este sistema atua sob o princípio da minimização de dados. Não coletamos nem armazenamos
            informações pessoais de beneficiários (como CPF, telefone ou endereço residencial). As destinações
            são registradas apenas por ações coletivas ou instituições parceiras para fins de auditoria e transparência.
          </div>
        </div>
      </div>
    </div>
  )
}
