import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, UserRole } from '../types';
import { LayoutDashboard, Lock, User as UserIcon, ShieldCheck, HelpCircle, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { SECURITY_QUESTIONS } from '../constants';

interface AuthProps {
  onLogin: (user: User) => void;
  isAdminRegistered: boolean;
  onRegisterAdmin: (user: User) => void;
  businessName: string;
  logo?: string;
}

export const Auth: React.FC<AuthProps> = ({ 
  onLogin, 
  isAdminRegistered, 
  onRegisterAdmin,
  businessName,
  logo
}) => {
  const [isRegistering, setIsRegistering] = useState(!isAdminRegistered);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState(1); // 1: username, 2: answer, 3: new password
  const [recoveredUser, setRecoveredUser] = useState<User | null>(null);
  const [recoveryAnswerInput, setRecoveryAnswerInput] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegistering) {
      if (!username || !password || !name || !securityQuestion || !securityAnswer) {
        setError('Todos los campos son obligatorios');
        return;
      }
      const newUser: User = {
        id: `u-${Date.now()}`,
        username,
        password,
        name,
        role: 'Admin',
        securityQuestion,
        securityAnswer: securityAnswer.toLowerCase().trim()
      };
      onRegisterAdmin(newUser);
      onLogin(newUser);
    } else {
      const users = JSON.parse(localStorage.getItem('nexus_users') || '[]');
      const user = users.find((u: any) => u.username === username && u.password === password);
      
      if (user) {
        onLogin(user);
      } else {
        setError('Usuario o contraseña incorrectos');
      }
    }
  };

  const handleRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const users = JSON.parse(localStorage.getItem('nexus_users') || '[]');

    if (recoveryStep === 1) {
      const user = users.find((u: any) => u.username === username);
      if (user) {
        if (!user.securityQuestion) {
          setError('Este usuario no tiene configurada una pregunta de seguridad. Contacte al administrador.');
          return;
        }
        setRecoveredUser(user);
        setRecoveryStep(2);
      } else {
        setError('Usuario no encontrado');
      }
    } else if (recoveryStep === 2) {
      if (recoveredUser && recoveryAnswerInput.toLowerCase().trim() === recoveredUser.securityAnswer?.toLowerCase().trim()) {
        setRecoveryStep(3);
      } else {
        setError('Respuesta incorrecta');
      }
    } else if (recoveryStep === 3) {
      if (!newPassword) {
        setError('Ingrese la nueva contraseña');
        return;
      }
      const updatedUsers = users.map((u: any) => 
        u.id === recoveredUser?.id ? { ...u, password: newPassword } : u
      );
      localStorage.setItem('nexus_users', JSON.stringify(updatedUsers));
      setSuccess('Contraseña actualizada con éxito. Ya puede iniciar sesión.');
      setRecoveryMode(false);
      setRecoveryStep(1);
      setRecoveredUser(null);
      setRecoveryAnswerInput('');
      setNewPassword('');
    }
  };

  if (recoveryMode) {
    return (
      <div className="min-h-screen bg-app-main flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-app-card rounded-3xl shadow-xl border border-app overflow-hidden"
        >
          <div className="p-8 bg-app-primary text-white text-center relative">
            <button 
              onClick={() => { setRecoveryMode(false); setRecoveryStep(1); setError(''); }}
              className="absolute left-6 top-1/2 -translate-y-1/2 p-2 hover:bg-white/20 rounded-xl transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold">Recuperar Contraseña</h1>
          </div>

          <form onSubmit={handleRecovery} className="p-8 space-y-6">
            {error && <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-xl text-center">{error}</div>}
            
            {recoveryStep === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-app-muted text-center">Ingrese su nombre de usuario para comenzar la recuperación.</p>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-app-muted uppercase ml-1">Usuario</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                    placeholder="admin"
                  />
                </div>
              </div>
            )}

            {recoveryStep === 2 && (
              <div className="space-y-4">
                <div className="p-4 bg-app-primary-light rounded-2xl border border-app-primary/20">
                  <p className="text-xs font-bold text-app-primary uppercase mb-1">Pregunta de Seguridad</p>
                  <p className="text-sm font-bold text-app-main">{recoveredUser?.securityQuestion}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-app-muted uppercase ml-1">Su Respuesta</label>
                  <input 
                    type="text" 
                    value={recoveryAnswerInput}
                    onChange={(e) => setRecoveryAnswerInput(e.target.value)}
                    className="w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                    placeholder="Escriba su respuesta aquí"
                  />
                </div>
              </div>
            )}

            {recoveryStep === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-app-muted text-center">Respuesta correcta. Ingrese su nueva contraseña.</p>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-app-muted uppercase ml-1">Nueva Contraseña</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            <button 
              type="submit"
              className="w-full py-4 bg-app-primary text-white font-bold rounded-xl shadow-lg shadow-app-primary/20 hover:bg-app-primary-hover transition-all"
            >
              {recoveryStep === 3 ? 'Actualizar Contraseña' : 'Continuar'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-main flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-app-card rounded-3xl shadow-xl border border-app overflow-hidden"
      >
        <div className="p-8 bg-app-primary text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm overflow-hidden">
            {logo ? (
              <img src={logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <LayoutDashboard size={32} />
            )}
          </div>
          <h1 className="text-2xl font-black tracking-tight uppercase">
            {businessName.split(' ')[0]}<span className="text-white/70">{businessName.split(' ').slice(1).join(' ')}</span>
          </h1>
          <p className="text-white/80 text-sm mt-1">
            {isRegistering ? 'Configuración Inicial de Administrador' : 'Bienvenido de nuevo'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-xl text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold rounded-xl text-center">
              {success}
            </div>
          )}

          {isRegistering && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-bold text-app-muted uppercase ml-1">Nombre Completo</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-app-muted" size={18} />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-app-muted uppercase ml-1">Pregunta de Seguridad</label>
                  <div className="relative">
                    <HelpCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-app-muted" size={18} />
                    <select 
                      value={securityQuestion}
                      onChange={(e) => setSecurityQuestion(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all appearance-none font-medium text-sm"
                    >
                      <option value="">Seleccione una pregunta</option>
                      {SECURITY_QUESTIONS.map((q, i) => (
                        <option key={i} value={q}>{q}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-app-muted uppercase ml-1">Respuesta</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-app-muted" size={18} />
                    <input 
                      type="text" 
                      value={securityAnswer}
                      onChange={(e) => setSecurityAnswer(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                      placeholder="Su respuesta"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-app-muted uppercase ml-1">Usuario</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-app-muted" size={18} />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                placeholder="admin"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-app-muted uppercase ml-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-app-muted" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-app-primary text-white font-bold rounded-xl shadow-lg shadow-app-primary/20 hover:bg-app-primary-hover active:scale-[0.98] transition-all"
          >
            {isRegistering ? 'Crear Cuenta Maestra' : 'Iniciar Sesión'}
          </button>

          {!isRegistering && (
            <div className="text-center">
              <button 
                type="button"
                onClick={() => { setRecoveryMode(true); setError(''); setSuccess(''); }}
                className="text-xs font-bold text-app-primary hover:underline"
              >
                ¿Olvidó su contraseña?
              </button>
            </div>
          )}

          {!isAdminRegistered && (
            <p className="text-center text-xs text-app-muted font-medium">
              Esta es la primera vez que abres el sistema. Debes crear un usuario administrador.
            </p>
          )}
        </form>
      </motion.div>
    </div>
  );
};
