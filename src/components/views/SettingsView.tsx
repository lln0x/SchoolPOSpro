import React, { useState } from 'react';
import { Settings, Save, Download, Upload, UserPlus, Shield, Trash2, Image as ImageIcon, Palette, Lock, Plus, Printer } from 'lucide-react';
import { BusinessConfig, User, UserRole, ThemeType } from '../../types';
import { cn } from '../../lib/utils';
import { SECURITY_QUESTIONS } from '../../constants';

interface SettingsViewProps {
  config: BusinessConfig;
  setConfig: (config: BusinessConfig) => void;
  users: User[];
  currentUser: User;
  onAddUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  onBackup: () => void;
  onRestore: (data: string) => void;
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  setConfig,
  users,
  currentUser,
  onAddUser,
  onDeleteUser,
  onBackup,
  onRestore,
  theme,
  setTheme
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'business' | 'users' | 'data' | 'appearance' | 'ticket'>('business');
  const [newUserName, setNewUserName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserAvatar, setNewUserAvatar] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('Seller');
  const [newUserSecurityQuestion, setNewUserSecurityQuestion] = useState('');
  const [newUserSecurityAnswer, setNewUserSecurityAnswer] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [resetPasswordMode, setResetPasswordMode] = useState(false);
  const [resetPasswordValue, setResetPasswordValue] = useState('');

  // Keyboard Shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsEditModalOpen(false);
        setResetPasswordMode(false);
        setEditingUser(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initialize owner data
  React.useEffect(() => {
    const owner = users.find(u => u.role === 'Admin') || currentUser;
    if (owner && !newUserName && !newUserUsername) {
      setNewUserName(owner.name);
      setNewUserLastName(owner.lastName || '');
      setNewUserEmail(owner.email || '');
      setNewUserPhone(owner.phone || '');
      setNewUserAvatar(owner.avatar || '');
      setNewUserUsername(owner.username);
      setNewUserSecurityQuestion(owner.securityQuestion || '');
    }
  }, [users, currentUser]);

  const THEMES: { id: ThemeType; label: string; color: string }[] = [
    { id: 'light', label: 'Claro', color: 'bg-white border-slate-200' },
    { id: 'dark', label: 'Oscuro', color: 'bg-slate-900 border-slate-700' },
    { id: 'celeste', label: 'Celeste', color: 'bg-sky-400 border-sky-200' },
    { id: 'slate', label: 'Slate', color: 'bg-slate-600 border-slate-400' },
    { id: 'emerald', label: 'Esmeralda', color: 'bg-emerald-500 border-emerald-300' },
    { id: 'rose', label: 'Rosa', color: 'bg-rose-500 border-rose-300' },
    { id: 'amber', label: 'Ámbar', color: 'bg-amber-500 border-amber-300' },
  ];

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig({ ...config, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewUserAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    onAddUser({
      id: editingUser ? editingUser.id : `u-${Date.now()}`,
      name: newUserName,
      username: newUserUsername,
      password: editingUser ? editingUser.password : newUserPassword,
      role: newUserRole,
      securityQuestion: newUserSecurityQuestion,
      securityAnswer: newUserSecurityAnswer.toLowerCase().trim()
    });
    setNewUserName('');
    setNewUserUsername('');
    setNewUserPassword('');
    setNewUserSecurityQuestion('');
    setNewUserSecurityAnswer('');
    setEditingUser(null);
    setIsEditModalOpen(false);
  };

  const openEditUser = (user: User) => {
    setEditingUser(user);
    setNewUserName(user.name);
    setNewUserUsername(user.username);
    setNewUserRole(user.role);
    setNewUserSecurityQuestion(user.securityQuestion || '');
    setNewUserSecurityAnswer('');
    setIsEditModalOpen(true);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser && resetPasswordValue) {
      const updatedUser = { ...editingUser, password: resetPasswordValue };
      onAddUser(updatedUser); // This will update because of how App.tsx handles onAddUser (needs to be updated to handle update too)
      setResetPasswordMode(false);
      setEditingUser(null);
      setResetPasswordValue('');
    }
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onRestore(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div className="lg:col-span-1 flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
        {[
          { id: 'business', label: 'Empresa', icon: Settings },
          { id: 'users', label: 'PERFIL', icon: Shield },
          { id: 'ticket', label: 'Ticket', icon: Printer },
          { id: 'appearance', label: 'Apariencia', icon: Palette },
          { id: 'data', label: 'Datos y Respaldo', icon: Download },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={cn(
              "flex-shrink-0 lg:w-full flex items-center gap-3 p-3 md:p-4 rounded-2xl font-bold text-xs md:text-sm transition-all whitespace-nowrap",
              activeSubTab === tab.id 
                ? "bg-app-primary text-white shadow-lg shadow-app-primary/20" 
                : "bg-app-card text-app-muted hover:bg-app-main"
            )}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="lg:col-span-3">
        {activeSubTab === 'appearance' && (
          <div className="bg-app-card rounded-3xl border border-app shadow-sm p-8 space-y-8">
            <div>
              <h3 className="text-xl font-bold text-app-main">Personalización Visual</h3>
              <p className="text-sm text-app-muted">Elige el tema que mejor se adapte a tu estilo de trabajo</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={cn(
                    "group relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all",
                    theme === t.id 
                      ? "border-app-primary bg-app-primary-light" 
                      : "border-app bg-app-main hover:border-app-primary/30"
                  )}
                >
                  <div className={cn("w-full aspect-video rounded-xl border shadow-sm", t.color)} />
                  <span className={cn("font-bold text-sm", theme === t.id ? "text-app-primary" : "text-app-muted")}>
                    {t.label}
                  </span>
                  {theme === t.id && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-app-primary rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeSubTab === 'ticket' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-app-card rounded-3xl border border-app shadow-sm p-8 space-y-8">
              <div>
                <h3 className="text-xl font-bold text-app-main">Configuración de Ticket</h3>
                <p className="text-sm text-app-muted">Personaliza la apariencia de tus comprobantes de pago</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 flex items-center justify-between p-4 bg-app-main rounded-xl border border-app">
                  <div>
                    <h4 className="text-sm font-bold text-app-main">Mostrar Logo en Ticket</h4>
                    <p className="text-[10px] text-app-muted">Activar para incluir el logo de la empresa en la parte superior</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setConfig({
                      ...config, 
                      ticketSettings: { 
                        ...config.ticketSettings!, 
                        showLogo: !config.ticketSettings?.showLogo 
                      }
                    })}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      config.ticketSettings?.showLogo ? "bg-app-primary" : "bg-slate-300"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                      config.ticketSettings?.showLogo ? "right-1" : "left-1"
                    )} />
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-app-muted uppercase ml-1">Tamaño del Logo (mm)</label>
                  <input 
                    type="number" 
                    value={config.ticketSettings?.logoSize || 20}
                    onChange={e => setConfig({
                      ...config, 
                      ticketSettings: { 
                        ...config.ticketSettings!, 
                        logoSize: parseInt(e.target.value) || 20 
                      }
                    })}
                    className="w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-app-muted uppercase ml-1">Encabezado del Ticket</label>
                  <input 
                    type="text" 
                    value={config.ticketSettings?.headerText || ''}
                    onChange={e => setConfig({
                      ...config, 
                      ticketSettings: { 
                        ...config.ticketSettings!, 
                        headerText: e.target.value 
                      }
                    })}
                    className="w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                    placeholder="Ej. COMPROBANTE DE PAGO"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-app-muted uppercase ml-1">Pie de Página (Mensaje)</label>
                  <textarea 
                    value={config.ticketSettings?.footerText || ''}
                    onChange={e => setConfig({
                      ...config, 
                      ticketSettings: { 
                        ...config.ticketSettings!, 
                        footerText: e.target.value 
                      }
                    })}
                    rows={3}
                    className="w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all resize-none"
                    placeholder="Ej. ¡Gracias por su compra! Vuelva pronto."
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-app-muted uppercase ml-1">Vista Previa (80mm)</h4>
              <div className="bg-white p-6 rounded-xl shadow-inner border border-slate-200 text-slate-800 font-mono text-[10px] space-y-4 min-h-[400px]">
                {/* Simulated Ticket Content */}
                <div className="text-center space-y-1">
                  {config.ticketSettings?.showLogo && config.logo && (
                    <div className="flex justify-center mb-2">
                      <img 
                        src={config.logo} 
                        alt="Logo Preview" 
                        style={{ width: `${config.ticketSettings.logoSize}mm` }}
                        className="object-contain"
                      />
                    </div>
                  )}
                  <p className="font-bold text-sm uppercase">{config.name}</p>
                  <p>RUC: {config.ruc}</p>
                  <p className="max-w-[150px] mx-auto">{config.address}</p>
                  <p>Tel: {config.phone}</p>
                </div>

                <div className="text-center border-y border-dashed border-slate-300 py-2 my-2">
                  <p className="font-bold">{config.ticketSettings?.headerText || 'TICKET DE VENTA'}</p>
                </div>

                <div className="space-y-1">
                  <p>Nro: SALE-123456789</p>
                  <p>Fecha: 04/03/2026 15:30</p>
                  <p>Cliente: Consumidor Final</p>
                </div>

                <div className="border-b border-dashed border-slate-300 pb-1">
                  <div className="flex justify-between font-bold">
                    <span>CANT DESCRIPCIÓN</span>
                    <span>TOTAL</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>2 x Producto Ejemplo A</span>
                    <span>S/ 40.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>1 x Servicio Ejemplo B</span>
                    <span>S/ 15.00</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-300 pt-2 space-y-1">
                  <div className="flex justify-between">
                    <span className="font-bold">SUBTOTAL:</span>
                    <span>S/ 46.61</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">IGV (18%):</span>
                    <span>S/ 8.39</span>
                  </div>
                  <div className="flex justify-between text-sm font-black pt-1">
                    <span>TOTAL:</span>
                    <span>S/ 55.00</span>
                  </div>
                </div>

                <div className="text-center pt-4 italic">
                  <p className="whitespace-pre-wrap">{config.ticketSettings?.footerText || '¡Gracias por su compra!'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'business' && (
          <div className="bg-app-card rounded-3xl border border-app shadow-sm p-8 space-y-8">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="w-24 h-24 bg-app-main rounded-3xl flex items-center justify-center text-app-muted overflow-hidden border-2 border-dashed border-app group-hover:border-app-primary transition-all">
                  {config.logo ? (
                    <img src={config.logo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={32} />
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 cursor-pointer rounded-3xl transition-all">
                  <Upload size={20} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                </label>
              </div>
              <div>
                <h3 className="text-xl font-bold text-app-main">Identidad del Negocio</h3>
                <p className="text-sm text-app-muted">Personaliza el nombre y logo de tu sistema POS</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-app-muted uppercase ml-1">Nombre Comercial</label>
                <input 
                  type="text" 
                  value={config.name}
                  onChange={e => setConfig({...config, name: e.target.value})}
                  className="w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-app-muted uppercase ml-1">RUC / Identificación</label>
                <input 
                  type="text" 
                  value={config.ruc}
                  onChange={e => setConfig({...config, ruc: e.target.value})}
                  className="w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-app-muted uppercase ml-1">Dirección</label>
                <input 
                  type="text" 
                  value={config.address}
                  onChange={e => setConfig({...config, address: e.target.value})}
                  className="w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-app-muted uppercase ml-1">Teléfono</label>
                <input 
                  type="text" 
                  value={config.phone}
                  onChange={e => setConfig({...config, phone: e.target.value})}
                  className="w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                />
              </div>
              <div className="md:col-span-2 flex items-center justify-between p-4 bg-app-main rounded-xl border border-app">
                <div>
                  <h4 className="text-sm font-bold text-app-main">Impuesto (IGV 18%)</h4>
                  <p className="text-[10px] text-app-muted">Activar o desactivar el cálculo de impuestos en las ventas</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setConfig({...config, enableTax: !config.enableTax})}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    config.enableTax ? "bg-app-primary" : "bg-slate-300"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    config.enableTax ? "right-1" : "left-1"
                  )} />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-app-card rounded-3xl border border-app shadow-sm p-8">
              <div className="flex items-center gap-6 mb-8">
                <div className="relative group">
                  <div className="w-24 h-24 bg-app-main rounded-full flex items-center justify-center text-app-muted overflow-hidden border-2 border-dashed border-app group-hover:border-app-primary transition-all">
                    {newUserAvatar ? (
                      <img src={newUserAvatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={32} />
                    )}
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 cursor-pointer rounded-full transition-all">
                    <Upload size={20} />
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                  </label>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-app-main">Perfil del Usuario</h3>
                  <p className="text-sm text-app-muted">Gestiona tu información personal y foto de perfil</p>
                </div>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const owner = users.find(u => u.role === 'Admin') || currentUser;
                onAddUser({
                  ...owner,
                  name: newUserName,
                  lastName: newUserLastName,
                  email: newUserEmail,
                  phone: newUserPhone,
                  avatar: newUserAvatar,
                  username: newUserUsername || owner.username,
                  password: newUserPassword || owner.password,
                  securityQuestion: newUserSecurityQuestion || owner.securityQuestion,
                  securityAnswer: newUserSecurityAnswer ? newUserSecurityAnswer.toLowerCase().trim() : owner.securityAnswer
                });
                setNewUserPassword('');
                setNewUserSecurityAnswer('');
              }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-app-muted uppercase ml-1">Nombres</label>
                  <input 
                    required
                    placeholder="Tus nombres"
                    value={newUserName}
                    onChange={e => setNewUserName(e.target.value)}
                    className="w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-app-muted uppercase ml-1">Apellidos</label>
                  <input 
                    required
                    placeholder="Tus apellidos"
                    value={newUserLastName}
                    onChange={e => setNewUserLastName(e.target.value)}
                    className="w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-app-muted uppercase ml-1">Correo Electrónico</label>
                  <input 
                    required
                    type="email"
                    placeholder="ejemplo@correo.com"
                    value={newUserEmail}
                    onChange={e => setNewUserEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-app-muted uppercase ml-1">Celular (Opcional)</label>
                  <input 
                    placeholder="Número de celular"
                    value={newUserPhone}
                    onChange={e => setNewUserPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                  />
                </div>
                
                <button type="submit" className="md:col-span-2 py-4 bg-app-primary text-white font-bold rounded-xl hover:bg-app-primary-hover transition-all flex items-center justify-center gap-2">
                  Guardar
                </button>
              </form>
            </div>
          </div>
        )}

        {activeSubTab === 'data' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-app-card rounded-3xl border border-app shadow-sm p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-app-primary-light text-app-primary rounded-2xl flex items-center justify-center mx-auto">
                <Download size={32} />
              </div>
              <h4 className="text-lg font-bold text-app-main">Exportar Respaldo Total</h4>
              <p className="text-sm text-app-muted">
                Incluye: Clientes, Egresos, Ventas, Socios, Historial, Configuración y Usuarios.
              </p>
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-[10px] font-bold uppercase">
                ⚠️ REQUISITO: Conecte su memoria USB y selecciónela al guardar.
              </div>
              <button 
                onClick={onBackup}
                className="w-full py-4 bg-app-primary text-white font-bold rounded-xl hover:bg-app-primary-hover transition-all"
              >
                Generar Backup a USB
              </button>
            </div>

            <div className="bg-app-card rounded-3xl border border-app shadow-sm p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                <Upload size={32} />
              </div>
              <h4 className="text-lg font-bold text-app-main">Restaurar Datos</h4>
              <p className="text-sm text-app-muted">Sube un archivo de respaldo previo para restaurar toda la información del sistema.</p>
              <label className="block w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all cursor-pointer">
                Cargar Archivo
                <input type="file" className="hidden" accept=".json" onChange={handleRestoreFile} />
              </label>
            </div>
          </div>
        )}

        {isEditModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
            <div className="bg-app-card w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-6 bg-app-primary text-white flex justify-between items-center">
                <h3 className="text-xl font-bold">Editar Usuario</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="hover:bg-white/20 p-2 rounded-xl transition-all">
                  <Plus className="rotate-45" size={24} />
                </button>
              </div>
              <form onSubmit={handleAddUser} className="p-8 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-app-muted uppercase ml-1">Nombre Completo</label>
                    <input 
                      required
                      value={newUserName}
                      onChange={e => setNewUserName(e.target.value)}
                      className="w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-app-muted uppercase ml-1">Usuario</label>
                    <input 
                      required
                      value={newUserUsername}
                      onChange={e => setNewUserUsername(e.target.value)}
                      className="w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-app-muted uppercase ml-1">Rol</label>
                    <select 
                      value={newUserRole}
                      onChange={e => setNewUserRole(e.target.value as UserRole)}
                      className="w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all font-bold"
                    >
                      <option value="Seller">Vendedor</option>
                      <option value="Warehouse">Almacenero</option>
                      <option value="Admin">Administrador</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-app-muted uppercase ml-1">Pregunta de Seguridad</label>
                    <select 
                      required
                      value={newUserSecurityQuestion}
                      onChange={e => setNewUserSecurityQuestion(e.target.value)}
                      className="w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all font-medium text-sm"
                    >
                      <option value="">Pregunta de Seguridad</option>
                      {SECURITY_QUESTIONS.map((q, i) => (
                        <option key={i} value={q}>{q}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-app-muted uppercase ml-1">Respuesta de Seguridad (Opcional si no cambia)</label>
                    <input 
                      placeholder="Nueva respuesta si desea cambiarla"
                      value={newUserSecurityAnswer}
                      onChange={e => setNewUserSecurityAnswer(e.target.value)}
                      className="w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 bg-app-primary text-white font-bold rounded-2xl shadow-lg shadow-app-primary/20 hover:bg-app-primary-hover transition-all mt-4"
                >
                  Actualizar Usuario
                </button>
              </form>
            </div>
          </div>
        )}

        {resetPasswordMode && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
            <div className="bg-app-card w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-6 bg-app-primary text-white flex justify-between items-center">
                <h3 className="text-xl font-bold">Cambiar Contraseña</h3>
                <button onClick={() => setResetPasswordMode(false)} className="hover:bg-white/20 p-2 rounded-xl transition-all">
                  <Plus className="rotate-45" size={24} />
                </button>
              </div>
              <form onSubmit={handleResetPassword} className="p-8 space-y-4">
                <p className="text-sm text-app-muted">Cambiando contraseña para: <span className="font-bold text-app-main">{editingUser?.name}</span></p>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-app-muted uppercase ml-1">Nueva Contraseña</label>
                  <input 
                    required
                    type="password" 
                    value={resetPasswordValue}
                    onChange={e => setResetPasswordValue(e.target.value)}
                    className="w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                    placeholder="••••••••"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 bg-app-primary text-white font-bold rounded-2xl shadow-lg shadow-app-primary/20 hover:bg-app-primary-hover transition-all mt-4"
                >
                  Actualizar Contraseña
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
