import React, { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { CategoryBadge, ConditionBadge } from '../components/Badge'
import { Loading } from '../components/Loading'
import { ConfirmModal } from '../components/ConfirmModal'
import {
  Search,
  Filter,
  Plus,
  Send,
  History,
  Trash2,
  AlertTriangle,
  Calendar,
  User,
  PackageCheck,
  RefreshCw,
  Box
} from 'lucide-react'

export const Inventory = ({ onNavigate, onSelectDonationForDestination, onSelectDonationForTimeline }) => {
  const { isAdmin } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Filtros e busca
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('todas')
  const [selectedCondition, setSelectedCondition] = useState('todos')
  const [stockStatus, setStockStatus] = useState('todos') // 'todos' | 'disponivel' | 'esgotado'
  const [nearExpiryOnly, setNearExpiryOnly] = useState(false)

  // Modal de confirmação de exclusão
  const [itemToDelete, setItemToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchInventory = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true)
      else setLoading(true)
      setErrorMessage('')

      if (!isSupabaseConfigured()) {
        setErrorMessage('Supabase não configurado.')
        return
      }

      // Consulta a view de estoque vw_inventory ou fallback para donations
      const { data, error } = await supabase
        .from('vw_inventory')
        .select('*')
        .order('entry_date', { ascending: false })

      if (error) {
        // Fallback caso a view não exista ainda
        console.warn('Erro ao consultar vw_inventory, tentando fallback para donations:', error.message)
        const { data: donationsData, error: donError } = await supabase
          .from('donations')
          .select('*, destinations(quantity)')
          .order('entry_date', { ascending: false })

        if (donError) throw donError

        const mapped = donationsData.map((d) => {
          const destined = (d.destinations || []).reduce((acc, curr) => acc + Number(curr.quantity), 0)
          return {
            ...d,
            quantity_received: Number(d.quantity),
            quantity_destined: destined,
            quantity_current: Number(d.quantity) - destined,
          }
        })
        setItems(mapped)
      } else {
        setItems(data || [])
      }
    } catch (err) {
      console.error('Falha ao carregar estoque:', err)
      setErrorMessage('Não foi possível carregar os itens do estoque. ' + (err.message || ''))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [])

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return
    try {
      setIsDeleting(true)
      const { error } = await supabase
        .from('donations')
        .delete()
        .eq('id', itemToDelete.id)

      if (error) throw error

      setSuccessMessage(`Doação "${itemToDelete.description}" excluída com sucesso.`)
      setTimeout(() => setSuccessMessage(''), 4000)
      setItemToDelete(null)
      fetchInventory(true)
    } catch (err) {
      console.error('Erro ao excluir:', err)
      alert('Erro ao excluir doação: ' + (err.message || 'Permissão negada'))
    } finally {
      setIsDeleting(false)
    }
  }

  // Filtragem dos itens
  const today = new Date()
  const fifteenDaysFromNow = new Date()
  fifteenDaysFromNow.setDate(today.getDate() + 15)

  const filteredItems = items.filter((item) => {
    // 1. Busca textual
    const matchesSearch =
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.donor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.notes?.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false

    // 2. Categoria
    if (selectedCategory !== 'todas' && item.category !== selectedCategory) return false

    // 3. Estado de conservação
    if (selectedCondition !== 'todos' && item.condition !== selectedCondition) return false

    // 4. Status de estoque
    const current = Number(item.quantity_current || 0)
    if (stockStatus === 'disponivel' && current <= 0) return false
    if (stockStatus === 'esgotado' && current > 0) return false

    // 5. Validade próxima (até 15 dias)
    if (nearExpiryOnly) {
      if (!item.expiration_date) return false
      const expDate = new Date(item.expiration_date)
      if (expDate > fifteenDaysFromNow) return false
    }

    return true
  })

  // Checagem visual de validade
  const getExpirationStatus = (expDateString) => {
    if (!expDateString) return null
    const expDate = new Date(expDateString + 'T23:59:59')
    const diffTime = expDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return { label: `Vencido (${Math.abs(diffDays)}d)`, level: 'expired' }
    }
    if (diffDays <= 7) {
      return { label: `Vence em ${diffDays}d`, level: 'critical' }
    }
    if (diffDays <= 15) {
      return { label: `Vence em ${diffDays}d`, level: 'warning' }
    }
    return { label: new Date(expDateString).toLocaleDateString('pt-BR'), level: 'ok' }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Estoque & Doações</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Gerenciamento completo das doações recebidas e controle de saldo em estoque
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => fetchInventory(true)}
            disabled={refreshing}
            className="p-2.5 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl transition-colors shadow-sm"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
          <button
            onClick={() => onNavigate('donation-form')}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-sm shadow-emerald-200 transition-all text-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Registrar Doação</span>
          </button>
        </div>
      </div>

      {/* Alerta de Sucesso */}
      {successMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center space-x-2 animate-fadeIn">
          <PackageCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Alerta de Erro */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Painel de Filtros e Busca */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm mb-6 space-y-4">
        {/* Barra de Busca */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por descrição do item, doador ou anotações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
          />
        </div>

        {/* Filtros em linha */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Categoria */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Categoria</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="todas">Todas as categorias</option>
              <option value="alimentos">Alimentos</option>
              <option value="roupas">Roupas</option>
              <option value="higiene">Higiene</option>
              <option value="brinquedos">Brinquedos</option>
              <option value="outros">Outros</option>
            </select>
          </div>

          {/* Estado de conservação */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Estado</label>
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="todos">Todos os estados</option>
              <option value="novo">Novo</option>
              <option value="bom">Bom estado</option>
              <option value="usado">Usado</option>
              <option value="necessita_atencao">Requer atenção</option>
            </select>
          </div>

          {/* Situação no Estoque */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Saldo em Estoque</label>
            <select
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="todos">Todos os itens</option>
              <option value="disponivel">Apenas com saldo disponível (&gt; 0)</option>
              <option value="esgotado">Apenas esgotados (saldo 0)</option>
            </select>
          </div>

          {/* Validade Próxima Check */}
          <div className="flex items-end">
            <label className="flex items-center space-x-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl w-full cursor-pointer hover:bg-slate-100/70 transition-colors">
              <input
                type="checkbox"
                checked={nearExpiryOnly}
                onChange={(e) => setNearExpiryOnly(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <span className="text-xs font-semibold text-slate-700">Validade próxima (&lt; 15d)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal: Lista ou Cards */}
      {loading ? (
        <Loading message="Carregando doações e estoque..." />
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Box className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">Nenhum item encontrado</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Não há doações cadastradas que correspondam aos filtros selecionados. Tente ajustar os termos de busca.
          </p>
          {(searchTerm || selectedCategory !== 'todas' || selectedCondition !== 'todos' || stockStatus !== 'todos' || nearExpiryOnly) && (
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('todas')
                setSelectedCondition('todos')
                setStockStatus('todos')
                setNearExpiryOnly(false)
              }}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Limpar todos os filtros
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const currentStock = Number(item.quantity_current || 0)
            const isAvailable = currentStock > 0
            const expStatus = getExpirationStatus(item.expiration_date)

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Badges de Categoria e Estado */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <CategoryBadge category={item.category} />
                    <ConditionBadge condition={item.condition} />
                  </div>

                  {/* Descrição do Item */}
                  <h3 className="text-base font-bold text-slate-800 leading-snug mb-1">
                    {item.description}
                  </h3>

                  {/* Doador e Data de Entrada */}
                  <div className="flex items-center space-x-3 text-xs text-slate-500 mb-4">
                    <span className="flex items-center space-x-1" title="Doador">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate max-w-[120px]">{item.donor_name || 'Anônimo'}</span>
                    </span>
                    <span className="flex items-center space-x-1" title="Data de Entrada">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(item.entry_date).toLocaleDateString('pt-BR')}</span>
                    </span>
                  </div>

                  {/* Quadro de Estoque (Recebido, Destinado, Atual) */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-slate-400">Recebido</span>
                      <span className="text-sm font-bold text-slate-700">
                        {item.quantity_received} <span className="text-[11px] font-normal text-slate-500">{item.unit}</span>
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-slate-400">Destinado</span>
                      <span className="text-sm font-bold text-slate-500">
                        {item.quantity_destined} <span className="text-[11px] font-normal">{item.unit}</span>
                      </span>
                    </div>
                    <div className={`rounded-lg py-0.5 ${isAvailable ? 'bg-emerald-100/70 text-emerald-800' : 'bg-slate-200/70 text-slate-500'}`}>
                      <span className="block text-[10px] font-bold uppercase">Saldo Atual</span>
                      <span className="text-sm font-extrabold">
                        {currentStock} <span className="text-[11px] font-medium">{item.unit}</span>
                      </span>
                    </div>
                  </div>

                  {/* Alerta de Validade se houver */}
                  {expStatus && (
                    <div
                      className={`mb-3 px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center space-x-1.5 ${
                        expStatus.level === 'expired'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : expStatus.level === 'critical'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : expStatus.level === 'warning'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Validade: {expStatus.label}</span>
                    </div>
                  )}

                  {/* Observações */}
                  {item.notes && (
                    <p className="text-xs text-slate-500 italic mb-4 line-clamp-2">
                      "{item.notes}"
                    </p>
                  )}
                </div>

                {/* Barra de Ações do Item */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
                  <div className="flex items-center space-x-1">
                    {/* Botão de Destinação */}
                    <button
                      onClick={() => onSelectDonationForDestination(item)}
                      disabled={!isAvailable}
                      className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        isAvailable
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                      title={isAvailable ? 'Registrar encaminhamento/saída' : 'Item esgotado no estoque'}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Destinar</span>
                    </button>

                    {/* Botão de Histórico / Linha do Tempo */}
                    <button
                      onClick={() => onSelectDonationForTimeline(item)}
                      className="flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      title="Ver linha do tempo e rastreabilidade deste item"
                    >
                      <History className="w-3.5 h-3.5 text-slate-400" />
                      <span>Histórico</span>
                    </button>
                  </div>

                  {/* Botão Excluir (Apenas Admin) */}
                  {isAdmin && (
                    <button
                      onClick={() => setItemToDelete(item)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Excluir doação (apenas administrador)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={Boolean(itemToDelete)}
        title="Excluir Doação"
        message={`Deseja realmente excluir a doação "${itemToDelete?.description}"? Todas as destinações vinculadas a ela também serão excluídas e o estoque será cancelado.`}
        confirmText="Sim, excluir doação"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setItemToDelete(null)}
        loading={isDeleting}
      />
    </div>
  )
}
