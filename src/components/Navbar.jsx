import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  Heart,
  LayoutDashboard,
  Package,
  PlusCircle,
  AlertCircle,
  FileText,
  LogOut,
  Menu,
  X,
  Shield,
  UserCheck
} from 'lucide-react'

export const Navbar = ({ currentTab, onNavigate }) => {
  const { user, profile, role, isAdmin, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'inventory', label: 'Estoque', icon: Package },
    { id: 'donation-form', label: 'Nova Doação', icon: PlusCircle },
    { id: 'needs', label: 'Necessidades', icon: AlertCircle },
    { id: 'reports', label: 'Relatórios', icon: FileText },
  ]

  const handleNavClick = (id) => {
    onNavigate(id)
    setMobileMenuOpen(false)
  }

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (err) {
      console.error('Erro ao sair:', err)
    }
  }

  const userName = profile?.name || (user?.email ? user.email.split('@')[0] : 'Usuário')

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo e Título da Instituição */}
          <div
            className="flex items-center space-x-3 cursor-pointer select-none"
            onClick={() => handleNavClick('dashboard')}
          >
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm shadow-emerald-200">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="text-lg font-black text-slate-800 tracking-tight">Acolher</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                Gestão Solidária
              </span>
            </div>
          </div>

          {/* Links de navegação desktop */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = currentTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Perfil e Ações do Usuário (Desktop) */}
          <div className="hidden md:flex items-center space-x-3 pl-4 border-l border-slate-200">
            <div className="text-right">
              <div className="text-xs font-bold text-slate-800 max-w-[140px] truncate">
                {userName}
              </div>
              <div className="flex items-center justify-end space-x-1 mt-0.5">
                {isAdmin ? (
                  <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded">
                    <Shield className="w-3 h-3 mr-0.5" /> Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                    <UserCheck className="w-3 h-3 mr-0.5" /> Voluntário
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Encerrar sessão"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Botão Hambúrguer Mobile */}
          <div className="flex items-center space-x-2 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Gaveta Mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg animate-fadeIn">
          {/* Info do Usuário Mobile */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl mb-3">
            <div>
              <p className="text-sm font-bold text-slate-800">{userName}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            {isAdmin ? (
              <span className="inline-flex items-center text-xs font-bold px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">
                <Shield className="w-3 h-3 mr-1" /> Admin
              </span>
            ) : (
              <span className="inline-flex items-center text-xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                <UserCheck className="w-3 h-3 mr-1" /> Voluntário
              </span>
            )}
          </div>

          {/* Itens do Menu Mobile */}
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-semibold transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            )
          })}

          <div className="pt-2 border-t border-slate-200 mt-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sair da conta</span>
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
