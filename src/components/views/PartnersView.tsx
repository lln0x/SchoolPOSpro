import React, { useState } from 'react';
import { Users, Plus, Trash2, Edit3, Percent } from 'lucide-react';
import { Partner } from '../../types';

interface PartnersViewProps {
  partners: Partner[];
  onAddPartner: (partner: Partner) => void;
  onUpdatePartner: (partner: Partner) => void;
  onDeletePartner: (id: string) => void;
}

export const PartnersView: React.FC<PartnersViewProps> = ({
  partners,
  onAddPartner,
  onUpdatePartner,
  onDeletePartner
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState<Partial<Partner>>({
    name: '',
    percentage: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPartner) {
      onUpdatePartner({ ...editingPartner, ...formData } as Partner);
    } else {
      onAddPartner({
        id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: formData.name || '',
        percentage: formData.percentage || 0
      });
    }
    setIsModalOpen(false);
    setEditingPartner(null);
    setFormData({ name: '', percentage: 0 });
  };

  const openEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData(partner);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-app-main">Gestión de Socios</h2>
        <button 
          onClick={() => { setEditingPartner(null); setFormData({ name: '', percentage: 0 }); setIsModalOpen(true); }}
          className="px-6 py-3 bg-app-primary text-white font-bold rounded-xl flex items-center gap-2 hover:bg-app-primary-hover transition-all shadow-lg shadow-app-primary/20"
        >
          <Plus size={20} /> Nuevo Socio
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {partners.map(partner => (
          <div key={partner.id} className="bg-app-card rounded-2xl border border-app shadow-sm p-6 hover:border-app-primary transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-app-primary-light text-app-primary rounded-2xl flex items-center justify-center">
                <Users size={24} />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(partner)} className="p-2 text-app-muted hover:text-app-primary hover:bg-app-primary-light rounded-lg transition-all">
                  <Edit3 size={16} />
                </button>
                <button onClick={() => onDeletePartner(partner.id)} className="p-2 text-app-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <h4 className="text-lg font-bold text-app-main">{partner.name}</h4>
            <div className="mt-4 flex items-center gap-2 text-app-primary">
              <Percent size={18} />
              <span className="text-2xl font-black">{partner.percentage}%</span>
              <span className="text-xs font-bold text-app-muted uppercase ml-1">de ganancia</span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
          <div className="bg-app-card w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 bg-app-primary text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">{editingPartner ? 'Editar Socio' : 'Nuevo Socio'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-2 rounded-xl transition-all">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-app-muted uppercase ml-1">Nombre del Socio</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                  placeholder="Ej. Carlos Rodríguez"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-app-muted uppercase ml-1">Porcentaje de Ganancia (%)</label>
                <input 
                  required
                  type="number" 
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.percentage ?? ''}
                  onChange={e => setFormData({...formData, percentage: parseFloat(e.target.value) || 0})}
                  className="w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                />
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-app-primary text-white font-bold rounded-2xl shadow-lg shadow-app-primary/20 hover:bg-app-primary-hover transition-all mt-4"
              >
                {editingPartner ? 'Actualizar Socio' : 'Crear Socio'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
