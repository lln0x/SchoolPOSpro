import React, { useState } from 'react';
import { Users, Plus, Search, Trash2, Edit3, Mail, Phone, MapPin } from 'lucide-react';
import { Client } from '../../types';
import { cn } from '../../lib/utils';

interface ClientsViewProps {
  clients: Client[];
  onAddClient: (client: Client) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  onAddClient,
  onUpdateClient,
  onDeleteClient
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Keyboard Shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
        setEditingClient(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    document: '',
    phone: '',
    email: '',
    address: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      onUpdateClient({ ...editingClient, ...formData } as Client);
    } else {
      onAddClient({
        id: `c-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...formData
      } as Client);
    }
    setIsModalOpen(false);
    setEditingClient(null);
    setFormData({ name: '', document: '', phone: '', email: '', address: '' });
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setFormData(client);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" size={20} />
          <input 
            type="text" 
            placeholder="Buscar clientes por nombre o DNI..."
            className="w-full pl-10 pr-4 py-3 bg-app-card border border-app rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => { setEditingClient(null); setFormData({ name: '', document: '', phone: '', email: '', address: '' }); setIsModalOpen(true); }}
          className="w-full md:w-auto px-6 py-3 bg-app-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-app-primary-hover transition-all shadow-lg shadow-app-primary/20"
        >
          <Plus size={20} /> Nuevo Cliente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients
          .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.document.includes(searchTerm))
          .map(client => (
          <div key={client.id} className="bg-app-card rounded-2xl border border-app shadow-sm p-6 hover:border-app-primary transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-app-primary-light text-app-primary rounded-2xl flex items-center justify-center">
                <Users size={24} />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(client)} className="p-2 text-app-muted hover:text-app-primary hover:bg-app-primary-light rounded-lg transition-all">
                  <Edit3 size={16} />
                </button>
                <button onClick={() => onDeleteClient(client.id)} className="p-2 text-app-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <h4 className="text-lg font-bold text-app-main">{client.name}</h4>
            <p className="text-xs font-bold text-app-primary uppercase tracking-wider mb-4">DNI/RUC: {client.document}</p>
            
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm text-app-muted">
                <Phone size={14} />
                <span>{client.phone || 'Sin teléfono'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-app-muted">
                <Mail size={14} />
                <span className="truncate">{client.email || 'Sin correo'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-app-muted">
                <MapPin size={14} />
                <span className="truncate">{client.address || 'Sin dirección'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
          <div className="bg-app-card w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 bg-app-primary text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-2 rounded-xl transition-all">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-app-muted uppercase ml-1">Nombre Completo</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-app-muted uppercase ml-1">Documento (DNI/RUC)</label>
                  <input 
                    required
                    type="text" 
                    value={formData.document}
                    onChange={e => setFormData({...formData, document: e.target.value})}
                    className="w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-app-muted uppercase ml-1">Teléfono</label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-app-muted uppercase ml-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-app-muted uppercase ml-1">Dirección</label>
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                />
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-app-primary text-white font-bold rounded-2xl shadow-lg shadow-app-primary/20 hover:bg-app-primary-hover transition-all mt-4"
              >
                {editingClient ? 'Actualizar Cliente' : 'Crear Cliente'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
