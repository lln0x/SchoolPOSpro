import React, { useState } from 'react';
import { Plus, Trash2, Search, DollarSign, Calendar, Tag, Download } from 'lucide-react';
import { Expense } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { format } from 'date-fns';

interface ExpensesViewProps {
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onGenerateReport: () => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  onAddExpense,
  onDeleteExpense,
  onGenerateReport
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Expense>>({
    description: '',
    amount: 0,
    category: 'General',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddExpense({
      id: `e-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      description: formData.description || '',
      amount: formData.amount || 0,
      category: formData.category || 'General',
      date: formData.date || format(new Date(), 'yyyy-MM-dd')
    });
    setIsModalOpen(false);
    setFormData({ description: '', amount: 0, category: 'General', date: format(new Date(), 'yyyy-MM-dd') });
  };

  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" size={20} />
          <input 
            type="text" 
            placeholder="Buscar egresos..."
            className="w-full pl-10 pr-4 py-3 bg-app-card border border-app rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="bg-app-card px-6 py-3 rounded-xl border border-app flex items-center gap-3">
            <span className="text-xs font-bold text-app-muted uppercase">Total Egresos</span>
            <span className="text-xl font-black text-rose-600">{formatCurrency(totalExpenses)}</span>
          </div>
          <button 
            onClick={onGenerateReport}
            className="px-6 py-3 bg-app-card text-app-main border border-app font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-app-main transition-all"
          >
            <Download size={20} /> Reporte General
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-app-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-app-primary-hover transition-all shadow-lg shadow-app-primary/20 flex-1 md:flex-none"
          >
            <Plus size={20} /> Nuevo Egreso
          </button>
        </div>
      </div>

      <div className="bg-app-card rounded-2xl border border-app shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-app-main text-app-muted text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Fecha</th>
                <th className="px-6 py-4 font-bold">Descripción</th>
                <th className="px-6 py-4 font-bold">Categoría</th>
                <th className="px-6 py-4 font-bold">Monto</th>
                <th className="px-6 py-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y border-app">
              {expenses
                .filter(e => e.description.toLowerCase().includes(searchTerm.toLowerCase()) || e.category.toLowerCase().includes(searchTerm.toLowerCase()))
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(expense => (
                <tr key={expense.id} className="hover:bg-app-main transition-colors">
                  <td className="px-6 py-4 text-sm text-app-muted">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      {format(new Date(expense.date), 'dd MMM, yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-app-main">{expense.description}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 bg-app-primary-light text-app-primary rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
                      <Tag size={10} />
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-rose-600">{formatCurrency(expense.amount)}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => onDeleteExpense(expense.id)} className="p-2 text-app-muted hover:text-rose-600 transition-all">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
          <div className="bg-app-card w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 bg-app-primary text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">Registrar Egreso</h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-2 rounded-xl transition-all">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-app-muted uppercase ml-1">Descripción</label>
                <input 
                  required
                  type="text" 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                  placeholder="Ej. Pago de luz, Compra de tizas..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-app-muted uppercase ml-1">Monto</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" size={16} />
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      value={formData.amount ?? ''}
                      onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                      className="w-full pl-10 pr-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-app-muted uppercase ml-1">Fecha</label>
                  <input 
                    required
                    type="date" 
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-app-muted uppercase ml-1">Categoría</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                >
                  <option value="General">General</option>
                  <option value="Servicios">Servicios</option>
                  <option value="Sueldos">Sueldos</option>
                  <option value="Materiales">Materiales</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-app-primary text-white font-bold rounded-2xl shadow-lg shadow-app-primary/20 hover:bg-app-primary-hover transition-all mt-4"
              >
                Registrar Egreso
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
