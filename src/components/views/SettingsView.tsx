import React, { useState } from 'react';
import { Settings, Save, Download, Upload, UserPlus, Shield, Trash2, Image as ImageIcon, Palette, Lock, Plus } from 'lucide-react';
import { BusinessConfig, User, UserRole, ThemeType } from '../../types';
import { cn } from '../../lib/utils';
import { SECURITY_QUESTIONS } from '../../constants';

interface SettingsViewProps {
  config: BusinessConfig;
  setConfig: (config: BusinessConfig) => void;
  users: User[];
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
  onAddUser,
  onDeleteUser,
  onBackup,
  onRestore,
  theme,
  setTheme
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'business' | 'users' | 'data' | 'appearance'>('business');
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('Seller');
  const [newUserSecurityQuestion, setNewUserSecurityQuestion] = useState('');
  const [newUserSecurityAnswer, setNewUserSecurityAnswer] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetPasswordMode, setResetPasswordMode] = useState(false);
  const [resetPasswordValue, setResetPasswordValue] = useState('');

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

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    onAddUser({
      id: `u-${Date.now()}`,
      name: newUserName,
      username: newUserUsername,
      password: newUserPassword,
      role: newUserRole,
      securityQuestion: newUserSecurityQuestion,
      securityAnswer: newUserSecurityAnswer.toLowerCase().trim()
    });
    setNewUserName('');
    setNewUserUsername('');
    setNewUserPassword('');
    setNewUserSecurityQuestion('');
    setNewUserSecurityAnswer('');
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
          { id: 'users', label: 'Usuarios', icon: Shield },
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
              <h3 className="text-xl font-bold text-app-main mb-6 flex items-center gap-2">
                <UserPlus size={24} className="text-app-primary" />
                Agregar Nuevo Usuario
              </h3>
              <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  required
                  placeholder="Nombre Completo"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  className="px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                />
                <input 
                  required
                  placeholder="Usuario"
                  value={newUserUsername}
                  onChange={e => setNewUserUsername(e.target.value)}
                  className="px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                />
                <input 
                  required
                  type="password"
                  placeholder="Contraseña"
                  value={newUserPassword}
                  onChange={e => setNewUserPassword(e.target.value)}
                  className="px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                />
                <select 
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value as UserRole)}
                  className="px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all font-bold"
                >
                  <option value="Seller">Vendedor</option>
                  <option value="Warehouse">Almacenero</option>
                  <option value="Admin">Administrador</option>
                </select>
                <select 
                  required
                  value={newUserSecurityQuestion}
                  onChange={e => setNewUserSecurityQuestion(e.target.value)}
                  className="px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all font-medium text-sm"
                >
                  <option value="">Pregunta de Seguridad</option>
                  {SECURITY_QUESTIONS.map((q, i) => (
                    <option key={i} value={q}>{q}</option>
                  ))}
                </select>
                <input 
                  required
                  placeholder="Respuesta de Seguridad"
                  value={newUserSecurityAnswer}
                  onChange={e => setNewUserSecurityAnswer(e.target.value)}
                  className="px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                />
                <button type="submit" className="md:col-span-2 py-4 bg-app-primary text-white font-bold rounded-xl hover:bg-app-primary-hover transition-all">
                  Crear Usuario
                </button>
              </form>
            </div>

            <div className="bg-app-card rounded-3xl border border-app shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-app-main text-app-muted text-xs uppercase font-bold">
                    <th className="px-6 py-4">Nombre</th>
                    <th className="px-6 py-4">Usuario</th>
                    <th className="px-6 py-4">Rol</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-app">
                  {users.map(user => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 font-bold text-app-main">{user.name}</td>
                      <td className="px-6 py-4 text-app-muted">{user.username}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-1 rounded-full uppercase",
                          user.role === 'Admin' ? "bg-app-primary-light text-app-primary" :
                          user.role === 'Warehouse' ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                        )}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => { setEditingUser(user); setResetPasswordMode(true); }}
                            className="p-2 text-app-muted hover:text-app-primary"
                            title="Cambiar Contraseña"
                          >
                            <Lock size={18} />
                          </button>
                          <button 
                            onClick={() => onDeleteUser(user.id)}
                            disabled={user.username === 'admin'}
                            className="p-2 text-app-muted hover:text-rose-600 disabled:opacity-0"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
