import React, { useState } from 'react';
import { ShieldCheck, Key, Play, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { ActivationStatus } from '../types';

interface ActivationModalProps {
  onActivate: (key: string) => void;
  onStartDemo: () => void;
  status: ActivationStatus | null;
}

export const ActivationModal: React.FC<ActivationModalProps> = ({ onActivate, onStartDemo, status }) => {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validKey = 'X7F2-9K4L-1M3N-8P6Q';
    if (key !== validKey) {
      setError('La clave de producto ingresada es incorrecta');
      return;
    }
    onActivate(key);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100"
      >
        <div className="p-10 text-center space-y-6">
          <div className="w-20 h-20 bg-indigo-600 text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-200 rotate-3">
            <ShieldCheck size={40} />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Activación del Sistema</h2>
            <p className="text-slate-500 font-medium">Bienvenido a Nexus POS Pro. Por favor, activa tu licencia para continuar.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Clave de Producto</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  value={key}
                  onChange={(e) => {
                    setKey(e.target.value.toUpperCase());
                    setError('');
                  }}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:ring-0 transition-all font-mono text-lg tracking-widest"
                />
              </div>
              {error && (
                <p className="text-rose-500 text-xs font-bold flex items-center gap-1 ml-1">
                  <AlertCircle size={12} /> {error}
                </p>
              )}
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <CheckCircle2 size={20} /> Activar Ahora
            </button>
          </form>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-slate-400 font-black tracking-widest">O también</span></div>
          </div>

          <div className="space-y-4">
            <button 
              onClick={onStartDemo}
              className="w-full py-4 bg-white text-slate-900 border-2 border-slate-100 font-black rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <Play size={20} /> Iniciar Modo Demo
            </button>
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-left">
              <h4 className="text-amber-800 text-xs font-black uppercase tracking-wider mb-1 flex items-center gap-1">
                <AlertCircle size={14} /> Limitaciones del Modo Demo:
              </h4>
              <ul className="text-[10px] text-amber-700 font-bold space-y-1">
                <li>• Límite de 20 comprobantes de pago diarios.</li>
                <li>• El contador se reinicia cada 24 horas.</li>
                <li>• Disponible únicamente por 7 días desde el primer uso.</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Nexus POS Pro v2.5 • © 2026 Todos los derechos reservados
          </p>
        </div>
      </motion.div>
    </div>
  );
};
