import React, { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Navbar } from './components/Navbar'
import { Loading } from './components/Loading'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Inventory } from './pages/Inventory'
import { DonationForm } from './pages/DonationForm'
import { DestinationForm } from './pages/DestinationForm'
import { Timeline } from './pages/Timeline'
import { Needs } from './pages/Needs'
import { Reports } from './pages/Reports'
import { Heart, ShieldCheck } from 'lucide-react'

const MainLayout = () => {
  const { user, loading } = useAuth()
  const [currentTab, setCurrentTab] = useState('dashboard')
  const [selectedDonation, setSelectedDonation] = useState(null)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loading message="Inicializando sistema seguro..." />
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  const handleSelectDonationForDestination = (donation) => {
    setSelectedDonation(donation)
    setCurrentTab('destination-form')
  }

  const handleSelectDonationForTimeline = (donation) => {
    setSelectedDonation(donation)
    setCurrentTab('timeline')
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 text-slate-800">
      {/* Barra de Navegação */}
      <Navbar currentTab={currentTab} onNavigate={(tab) => {
        if (tab !== 'destination-form' && tab !== 'timeline') {
          setSelectedDonation(null)
        }
        setCurrentTab(tab)
      }} />

      {/* Conteúdo da Tela Selecionada */}
      <main className="flex-1 pb-16">
        {currentTab === 'dashboard' && (
          <Dashboard
            onNavigate={setCurrentTab}
            onSelectDonationForDestination={handleSelectDonationForDestination}
          />
        )}
        {currentTab === 'inventory' && (
          <Inventory
            onNavigate={setCurrentTab}
            onSelectDonationForDestination={handleSelectDonationForDestination}
            onSelectDonationForTimeline={handleSelectDonationForTimeline}
          />
        )}
        {currentTab === 'donation-form' && (
          <DonationForm onNavigate={setCurrentTab} />
        )}
        {currentTab === 'destination-form' && (
          <DestinationForm
            selectedDonation={selectedDonation}
            onNavigate={setCurrentTab}
            onDestinedSuccess={() => {
              // Mantém atualizado o estado
            }}
          />
        )}
        {currentTab === 'timeline' && (
          <Timeline
            selectedDonation={selectedDonation}
            onNavigate={setCurrentTab}
          />
        )}
        {currentTab === 'needs' && <Needs />}
        {currentTab === 'reports' && <Reports />}
      </main>

      {/* Rodapé Acadêmico e LGPD */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
              <Heart className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="font-bold text-slate-700">Acolher • Gestão de Doações</span>
            <span>— Projeto de Extensão Universitária (ADS)</span>
          </div>

          <div className="flex items-center space-x-1.5 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Sistema com conformidade LGPD • Dados mínimos e auditáveis</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  )
}
