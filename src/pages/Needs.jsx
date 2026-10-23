import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { CategoryBadge, PriorityBadge } from '../components/Badge'
import { Loading } from '../components/Loading'
import { ConfirmModal } from '../components/ConfirmModal'
import {
  AlertCircle,
  Plus,
  CheckCircle,
  RotateCcw,
  Trash2,
  Calendar,
  Layers,
  CheckCircle2,
  Sparkles
} from 'lucide-react'

export const Needs = () => {
  const { user, isAdmin } = useAuth()

  const [needs, setNeeds] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Filtros
  const [statusFilter, setStatusFilter] = useState('aberta') // 'todas' | 'aberta' | 'atendida'
  const [priorityFilter, setPriorityFilter] = useState('todas') // 'todas' | 'alta' | 'media' | 'baixa'

  // Modal de Nova Necessidade
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newNeed, setNewNeed] = useState({
    description: '',
    category: 'alimentos',
    priority: 'alta',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)

  // Modal de Exclusão (Admin)
  const [needToDelete, setNeedToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchNeeds = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('needs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setNeeds(data || [])
    } catch (err) {
      console.error('Erro ao buscar necessidades:', err)
      setErrorMessage('Falha ao carregar as necessidades prioritárias.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNeeds()
  }, [])

  const handleCreateNeed = async (e) => {
    e.preventDefault()
    if (!newNeed.description.trim()) {
      alert('Informe a descrição do item necessário.')
      return
    }

    try {
      setSubmitting(true)
      const payload = {
        description: newNeed.description.trim(),
        category: newNeed.category,
        priority: newNeed.priority,
        notes: newNeed.notes.trim() ? newNeed.notes.trim() : null,
        created_by: user?.id || null,
        status: 'aberta',
      }

      const { error } = await supabase.from('needs').insert([payload])
      if (error) throw error

      setSuccessMessage('Necessidade prioritária registrada com sucesso!')
      setTimeout(() => setSuccessMessage(''), 4000)

      setNewNeed({
        description: '',
        category: 'alimentos',
        priority: 'alta',
        notes: '',
      })
      setIsModalOpen(false)
      fetchNeeds()
    } catch (err) {
      console.error('Erro ao criar necessidade:', err)
      alert('Erro ao cadastrar necessidade: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (item) => {
    const newStatus = item.status === 'aberta' ? 'atendida' : 'aberta'
    try {
      const { error } = await supabase
        .from('needs')
        .update({ status: newStatus })
        .eq('id', item.id)

      if (error) throw error

      setSuccessMessage(`Status da necessidade alterado para "${newStatus}".`)
      setTimeout(() => setSuccessMessage(''), 3000)
      fetchNeeds()
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
      alert('Não foi possível alterar o status da necessidade.')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!needToDelete) return
    try {
      setIsDeleting(true)
      const { error } = await supabase
        .from('needs')
        .delete()
        .eq('id', needToDelete.id)

      if (error) throw error

      setSuccessMessage('Necessidade excluída com sucesso.')
      setTimeout(() => setSuccessMessage(''), 3000)
      setNeedToDelete(null)
      fetchNeeds()
    } catch (err) {
      console.error('Erro ao excluir necessidade:', err)
      alert('Falha ao excluir necessidade: ' + (err.message || 'Permissão negada'))
    } finally {
      setIsDeleting(false)
    }
  }

  // Filtragem
  const filteredNeeds = needs.filter((item) => {
    if (statusFilter !== 'todas' && item.status !== statusFilter) return false
    if (priorityFilter !== 'todas' && item.priority !== priorityFilter) return false
    return true
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Necessidades Prioritárias</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Mural de demandas urgentes da instituição para orientar campanhas de arrecadação
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-sm shadow-emerald-200 transition-all text-sm w-fit"
        >
          <Plus className="w-5 h-5" />
          <span>Cadastrar Demanda</span>
        </button>
      </div>

      {/* Alertas */}
      {successMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
        {/* Filtro de Status */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status:</span>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('aberta')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'aberta' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Abertas
            </button>
            <button
              onClick={() => setStatusFilter('atendida')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'atendida' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Atendidas
            </button>
            <button
              onClick={() => setStatusFilter('todas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'todas' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas
            </button>
          </div>
        </div>

        {/* Filtro de Prioridade */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prioridade:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="todas">Todas as prioridades</option>
            <option value="alta">Prioridade Alta</option>
            <option value="media">Prioridade Média</option>
            <option value="baixa">Prioridade Baixa</option>
          </select>
        </div>
      </div>

      {/* Lista de Necessidades */}
      {loading ? (
        <Loading message="Carregando quadro de necessidades..." />
      ) : filteredNeeds.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
          <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">Nenhuma necessidade encontrada</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Não existem demandas registradas com os filtros selecionados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNeeds.map((item) => {
            const isDone = item.status === 'atendida'
            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border p-5 shadow-sm transition-all flex flex-col justify-between ${
                  isDone ? 'border-slate-200 opacity-75 bg-slate-50/50' : 'border-slate-200 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <CategoryBadge category={item.category} />
                    <PriorityBadge priority={item.priority} />
                  </div>

                  <h3 className={`text-base font-bold mb-2 ${isDone ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                    {item.description}
                  </h3>

                  {item.notes && (
                    <p className="text-xs text-slate-500 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      "{item.notes}"
                    </p>
                  )}

                  <div className="flex items-center space-x-2 text-[11px] text-slate-400 mb-4">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Cadastrada em: {new Date(item.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                {/* Ações da Necessidade */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleStatus(item)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isDone
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    {isDone ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reabrir Demanda</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Marcar como Atendida</span>
                      </>
                    )}
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => setNeedToDelete(item)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Excluir demanda (admin)"
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

      {/* Modal de Cadastro de Necessidade */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-6 sm:p-8 border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 mb-1">Cadastrar Necessidade Prioritária</h3>
            <p className="text-xs text-slate-500 mb-6">
              Informe os itens com carência atual na instituição para mobilizar doadores.
            </p>

            <form onSubmit={handleCreateNeed} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descrição da Necessidade <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newNeed.description}
                  onChange={(e) => setNewNeed({ ...newNeed, description: e.target.value })}
                  placeholder="Ex.: Fórmulas Infantis, Fraldas Tamanho G, Casacos..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoria</label>
                  <select
                    value={newNeed.category}
                    onChange={(e) => setNewNeed({ ...newNeed, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="alimentos">Alimentos</option>
                    <option value="roupas">Roupas</option>
                    <option value="higiene">Higiene</option>
                    <option value="brinquedos">Brinquedos</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nível de Prioridade</label>
                  <select
                    value={newNeed.priority}
                    onChange={(e) => setNewNeed({ ...newNeed, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="alta">Prioridade Alta (Urgente)</option>
                    <option value="media">Prioridade Média</option>
                    <option value="baixa">Prioridade Baixa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Observações ou Motivo</label>
                <textarea
                  rows={2}
                  value={newNeed.notes}
                  onChange={(e) => setNewNeed({ ...newNeed, notes: e.target.value })}
                  placeholder="Ex.: Solicitação para famílias da creche comunitária..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm shadow-emerald-200 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : 'Salvar Necessidade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Exclusão */}
      <ConfirmModal
        isOpen={Boolean(needToDelete)}
        title="Excluir Demanda Prioritária"
        message={`Tem certeza que deseja excluir a necessidade "${needToDelete?.description}"?`}
        confirmText="Sim, excluir"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setNeedToDelete(null)}
        loading={isDeleting}
      />
    </div>
  )
}
