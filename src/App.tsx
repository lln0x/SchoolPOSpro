import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  History as HistoryIcon, 
  Settings as SettingsIcon, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag,
  Printer,
  Bell,
  LogOut,
  Download,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Users2,
  Menu,
  Plus,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { api } from './services/api';
import { Product, Client, Sale, CartItem, BusinessConfig, User, Notification, ThemeType, Category, Expense, Partner, ActivationStatus } from './types';
import { cn, formatCurrency } from './lib/utils';

// Components
import { Sidebar } from './components/Sidebar';
import { Notifications } from './components/Notifications';
import { Auth } from './components/Auth';
import { ActivationModal } from './components/ActivationModal';
import { POSView } from './components/views/POSView';
import { InventoryView } from './components/views/InventoryView';
import { ClientsView } from './components/views/ClientsView';
import { SettingsView } from './components/views/SettingsView';
import { ExpensesView } from './components/views/ExpensesView';
import { PartnersView } from './components/views/PartnersView';

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activationStatus, setActivationStatus] = useState<ActivationStatus | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: 'admin-001',
    username: 'admin',
    role: 'Admin',
    name: 'Administrador',
    lastName: '',
    email: '',
    phone: '',
    avatar: ''
  });
  const [isAdminRegistered, setIsAdminRegistered] = useState(true);
  const [theme, setTheme] = useState<ThemeType>('light');
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([
    { id: 'cat-001', name: 'Mensualidad', prefix: 'MS', managesStock: false },
    { id: 'cat-002', name: 'Matrícula', prefix: 'MT', managesStock: false },
    { id: 'cat-003', name: 'Uniforme', prefix: 'UN', managesStock: true },
    { id: 'cat-004', name: 'Libros', prefix: 'LB', managesStock: true },
    { id: 'cat-005', name: 'Útiles', prefix: 'UT', managesStock: true },
    { id: 'cat-006', name: 'Cafetería', prefix: 'CF', managesStock: true },
    { id: 'cat-007', name: 'Seguro Escolar', prefix: 'SE', managesStock: false },
    { id: 'cat-008', name: 'Excursiones', prefix: 'EX', managesStock: false },
    { id: 'cat-009', name: 'Talleres', prefix: 'TL', managesStock: false },
    { id: 'cat-010', name: 'COMBOS', prefix: 'CM', managesStock: true }
  ]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isExpensesModalOpen, setIsExpensesModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [config, setConfig] = useState<BusinessConfig>({
    name: 'NEXUS POS',
    ruc: '20123456789',
    address: 'Av. Educativa 123, Lima',
    phone: '987 654 321',
    currency: 'S/',
    enableTax: true,
    ticketSettings: {
      logoSize: 20,
      footerText: '¡Gracias por su preferencia!',
      headerText: 'COMPROBANTE DE PAGO',
      showLogo: true
    }
  });

  // POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<Sale['paymentMethod']>('Cash');

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Navigation Shortcuts
      if (e.key === 'F1') { e.preventDefault(); setActiveTab('dashboard'); }
      if (e.key === 'F2') { e.preventDefault(); setActiveTab('pos'); }
      if (e.key === 'F3') { e.preventDefault(); setActiveTab('inventory'); }
      if (e.key === 'F4') { e.preventDefault(); setActiveTab('clients'); }
      if (e.key === 'F5') { e.preventDefault(); setActiveTab('expenses'); }
      if (e.key === 'F6') { e.preventDefault(); setActiveTab('partners'); }
      if (e.key === 'F7') { e.preventDefault(); setActiveTab('history'); }
      if (e.key === 'F8') { e.preventDefault(); setActiveTab('settings'); }
      
      // Theme Toggle
      if (e.altKey && e.key === 't') {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
      }

      // Esc: Close modals
      if (e.key === 'Escape') {
        setIsExpensesModalOpen(false);
        setIsInfoModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          configData,
          usersData,
          productsData,
          categoriesData,
          clientsData,
          salesData,
          expensesData,
          partnersData,
          activationData
        ] = await Promise.all([
          api.getConfig(),
          api.get('users'),
          api.get('products'),
          api.get('categories'),
          api.get('clients'),
          api.get('sales'),
          api.get('expenses'),
          api.get('partners'),
          api.getActivation()
        ]);

        if (configData) setConfig(configData);
        if (usersData?.length) {
          setUsers(usersData);
          setIsAdminRegistered(usersData.some((u: User) => u.role === 'Admin'));
        }
        if (productsData?.length) setProducts(productsData);
        if (categoriesData?.length) setCategories(categoriesData);
        if (clientsData?.length) setClients(clientsData);
        if (salesData?.length) setSales(salesData);
        if (expensesData?.length) setExpenses(expensesData);
        if (partnersData?.length) setPartners(partnersData);
        
        if (activationData) {
          setActivationStatus(activationData);
        } else {
          setActivationStatus({
            isActivated: false,
            dailyReceiptsCount: 0,
            mode: 'None'
          });
        }
      } catch (e) {
        console.error("Error loading data from API", e);
      }
    };
    loadData();
  }, []);

  // Save Data
  useEffect(() => { if (config.name !== 'NEXUS POS') api.postConfig(config); }, [config]);
  useEffect(() => { if (users.length) api.post('users', users); }, [users]);
  useEffect(() => { if (products.length) api.post('products', products); }, [products]);
  useEffect(() => { if (categories.length) api.post('categories', categories); }, [categories]);
  useEffect(() => { if (clients.length) api.post('clients', clients); }, [clients]);
  useEffect(() => { if (sales.length) api.post('sales', sales); }, [sales]);
  useEffect(() => { if (expenses.length) api.post('expenses', expenses); }, [expenses]);
  useEffect(() => { if (partners.length) api.post('partners', partners); }, [partners]);
  useEffect(() => { if (activationStatus) api.postActivation(activationStatus); }, [activationStatus]);
  useEffect(() => { localStorage.setItem('nexus_theme', theme); }, [theme]);

  // Apply Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Notifications Logic
  const addNotification = useCallback((title: string, message: string, type: Notification['type'] = 'info', system: boolean = false) => {
    const newNotif: Notification = {
      id: system ? `sys-${title}` : `n-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      message,
      type,
      timestamp: Date.now(),
      system
    };
    setNotifications(prev => {
      // If it's a system notification, replace the existing one with the same title to avoid duplicates
      if (system) {
        const filtered = prev.filter(n => n.id !== newNotif.id);
        return [newNotif, ...filtered];
      }
      return [newNotif, ...prev];
    });
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, toastDismissed: true } : n));
  }, []);

  const checkMonthlyFeePaid = (clientId: string, productId: string, month: string, year: number) => {
    return sales.some(sale => 
      sale.clientId === clientId && 
      sale.items.some(item => 
        item.id === productId && 
        item.feeDetails?.month === month && 
        item.feeDetails?.year === year
      )
    );
  };

  // Check Stock & Combo Notifications
  useEffect(() => {
    const today = new Date();
    const lowStock = products.filter(p => !p.isService && p.stock < p.minStock);
    
    // Check combos for expiration and missing items
    const expiringCombos = products.filter(p => 
      p.isCombo && 
      p.comboEndDate && 
      new Date(p.comboEndDate).getTime() - today.getTime() < 3 * 24 * 60 * 60 * 1000 && // 3 days
      new Date(p.comboEndDate).getTime() > today.getTime()
    );

    const incompleteCombos = products.filter(p => {
      if (!p.isCombo || !p.comboItems) return false;
      return p.comboItems.some(itemId => {
        const item = products.find(prod => prod.id === itemId);
        return item && !item.isService && item.stock <= 0;
      });
    });

    // Update notifications based on current state
    setNotifications(prev => {
      let next = [...prev];
      
      // Handle Low Stock
      if (lowStock.length > 0) {
        const title = 'Alerta de Inventario';
        const msg = `Hay ${lowStock.length} productos con stock bajo: ${lowStock.slice(0, 2).map(p => p.name).join(', ')}${lowStock.length > 2 ? '...' : ''}`;
        const existing = next.find(n => n.id === `sys-${title}`);
        if (!existing || existing.message !== msg) {
          next = [{
            id: `sys-${title}`,
            title,
            message: msg,
            type: 'warning',
            timestamp: existing?.timestamp || Date.now(),
            system: true
          }, ...next.filter(n => n.id !== `sys-${title}`)];
        }
      } else {
        next = next.filter(n => n.id !== 'sys-Alerta de Inventario');
      }

      // Handle Expiring Combos
      if (expiringCombos.length > 0) {
        const title = 'Combos por Vencer';
        const msg = `Hay ${expiringCombos.length} combos que vencen pronto.`;
        const existing = next.find(n => n.id === `sys-${title}`);
        if (!existing) {
          next = [{
            id: `sys-${title}`,
            title,
            message: msg,
            type: 'info',
            timestamp: Date.now(),
            system: true
          }, ...next];
        }
      } else {
        next = next.filter(n => n.id !== 'sys-Combos por Vencer');
      }

      // Handle Incomplete Combos
      if (incompleteCombos.length > 0) {
        const title = 'Combos Incompletos';
        const msg = `Hay ${incompleteCombos.length} combos con productos agotados.`;
        const existing = next.find(n => n.id === `sys-${title}`);
        if (!existing) {
          next = [{
            id: `sys-${title}`,
            title,
            message: msg,
            type: 'error',
            timestamp: Date.now(),
            system: true
          }, ...next];
        }
      } else {
        next = next.filter(n => n.id !== 'sys-Combos Incompletos');
      }

      return next;
    });
  }, [products.map(p => p.stock).join(','), products.map(p => p.id).join(','), addNotification]);

  // Calculations
  const cartSubtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);
  const cartTax = config.enableTax ? cartSubtotal * 0.18 : 0;
  const cartTotal = cartSubtotal + cartTax;

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(s => s.date.startsWith(today));
    const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
    const todayRevenue = todaySales.reduce((acc, s) => acc + s.total, 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    
    return {
      totalRevenue,
      todayRevenue,
      totalExpenses,
      netProfit,
      totalSales: sales.length,
      todaySalesCount: todaySales.length,
      topProducts: products.sort((a, b) => b.stock - a.stock).slice(0, 5)
    };
  }, [sales, products, expenses]);

  // Actions
  const handleProcessSale = (printFormat?: '80mm' | '58mm' | 'A4') => {
    if (cart.length === 0 || !currentUser || !activationStatus) return;

    // Check Demo Mode Limits
    if (activationStatus.mode === 'Demo') {
      const now = new Date();
      const firstRun = new Date(activationStatus.firstRunDate || now);
      const daysSinceFirstRun = Math.floor((now.getTime() - firstRun.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceFirstRun >= 7) {
        addNotification('Modo Demo Expirado', 'Los 7 días de prueba han terminado. Por favor activa el sistema.', 'error');
        return;
      }

      const lastReset = new Date(activationStatus.lastReceiptResetDate || now);
      const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

      let currentCount = activationStatus.dailyReceiptsCount;
      let resetDate = activationStatus.lastReceiptResetDate;

      if (hoursSinceReset >= 24) {
        currentCount = 0;
        resetDate = now.toISOString();
      }

      if (currentCount >= 20) {
        addNotification('Límite Diario Alcanzado', 'Has alcanzado el límite de 20 comprobantes diarios en modo demo.', 'warning');
        return;
      }

      setActivationStatus(prev => prev ? {
        ...prev,
        dailyReceiptsCount: currentCount + 1,
        lastReceiptResetDate: resetDate || now.toISOString()
      } : null);
    }

    const newSale: Sale = {
      id: `SALE-${Date.now()}`,
      date: new Date().toISOString(),
      clientId: selectedClient?.id,
      clientName: selectedClient?.name || 'Consumidor Final',
      items: [...cart],
      subtotal: cartSubtotal,
      tax: cartTax,
      total: cartTotal,
      paymentMethod,
      sellerId: currentUser.id
    };

    setSales(prev => [newSale, ...prev]);
    
    setProducts(prev => {
      let updatedProducts = [...prev];
      cart.forEach(cartItem => {
        if (cartItem.isCombo) {
          // Handle both Fixed and Configurable combos
          const itemsToReduce = cartItem.comboType === 'Configurable' 
            ? cartItem.selectedComboItems || [] 
            : cartItem.comboItems || [];

          itemsToReduce.forEach(itemId => {
            updatedProducts = updatedProducts.map(p => {
              if (p.id === itemId && !p.isService && !p.isMonthlyFee) {
                return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
              }
              return p;
            });
          });
        } else {
          // Regular product stock reduction
          updatedProducts = updatedProducts.map(p => {
            if (p.id === cartItem.id && !p.isService && !p.isMonthlyFee && !p.isCombo) {
              return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
            }
            return p;
          });
        }
      });
      return updatedProducts;
    });

    if (printFormat) {
      generatePDF(newSale, printFormat);
    }

    setCart([]);
    setSelectedClient(null);
    addNotification('Venta Exitosa', `Se ha registrado la venta ${newSale.id}`, 'success');
  };

  const generatePDF = (sale: Sale, formatType: '80mm' | '58mm' | 'A4') => {
    const isThermal = formatType !== 'A4';
    const dimensions: Record<string, [number, number] | string> = {
      '80mm': [80, 250],
      '58mm': [58, 200],
      'A4': 'a4'
    };

    const doc = new jsPDF({ 
      unit: 'mm', 
      format: dimensions[formatType] 
    });

    const pageWidth = isThermal ? (formatType === '80mm' ? 80 : 58) : 210;
    const margin = isThermal ? 4 : 15;
    const centerX = pageWidth / 2;
    let y = 10;

    // --- Header Section ---
    if (isThermal) {
      // Logo
      if (config.ticketSettings?.showLogo && config.logo) {
        const logoSize = config.ticketSettings.logoSize || 20;
        try {
          doc.addImage(config.logo, 'PNG', centerX - (logoSize / 2), y, logoSize, logoSize);
          y += logoSize + 5;
        } catch (e) {
          console.error("Error adding logo to ticket", e);
        }
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(config.name, centerX, y, { align: 'center' });
      y += 6;
      
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(`RUC: ${config.ruc}`, centerX, y, { align: 'center' });
      y += 4;
      doc.text(config.address, centerX, y, { align: 'center', maxWidth: pageWidth - 10 });
      y += 4;
      doc.text(`Tel: ${config.phone}`, centerX, y, { align: 'center' });
      y += 8;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(config.ticketSettings?.headerText || 'TICKET DE VENTA', centerX, y, { align: 'center' });
      y += 2;
      doc.setLineWidth(0.1);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(`Nro: ${sale.id}`, margin, y);
      y += 4;
      doc.text(`Fecha: ${format(new Date(sale.date), 'dd/MM/yyyy HH:mm')}`, margin, y);
      y += 4;
      doc.text(`Cliente: ${sale.clientName}`, margin, y);
      y += 6;
      
      // Items Table for Thermal
      doc.setFont('helvetica', 'bold');
      doc.text('CANT  DESCRIPCIÓN', margin, y);
      doc.text('TOTAL', pageWidth - margin, y, { align: 'right' });
      y += 2;
      doc.line(margin, y, pageWidth - margin, y);
      y += 4;
      
      doc.setFont('helvetica', 'normal');
      sale.items.forEach(item => {
        const name = item.name.length > (formatType === '80mm' ? 25 : 18) 
          ? item.name.substring(0, formatType === '80mm' ? 22 : 15) + '...' 
          : item.name;
        doc.text(`${item.quantity}`, margin, y);
        doc.text(name, margin + 8, y);
        doc.text(formatCurrency(item.price * item.quantity), pageWidth - margin, y, { align: 'right' });
        y += 4;

        // Show selected items for configurable combos
        if (item.comboType === 'Configurable' && item.selectedComboItems) {
          doc.setFontSize(6);
          item.selectedComboItems.forEach(itemId => {
            const p = products.find(prod => prod.id === itemId);
            if (p) {
              doc.text(`> ${p.name}`, margin + 10, y);
              y += 3;
            }
          });
          doc.setFontSize(7);
        }
      });

      y += 2;
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;

      doc.setFontSize(8);
      doc.text('SUBTOTAL:', margin + 20, y);
      doc.text(formatCurrency(sale.subtotal), pageWidth - margin, y, { align: 'right' });
      y += 4;
      doc.text('IGV (18%):', margin + 20, y);
      doc.text(formatCurrency(sale.tax), pageWidth - margin, y, { align: 'right' });
      y += 6;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL:', margin + 20, y);
      doc.text(formatCurrency(sale.total), pageWidth - margin, y, { align: 'right' });
      
      y += 12;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      const footerLines = doc.splitTextToSize(config.ticketSettings?.footerText || '¡Gracias por su compra!', pageWidth - 10);
      doc.text(footerLines, centerX, y, { align: 'center' });

    } else {
      // --- A4 Professional Invoice Design ---
      // Logo & Company Info
      if (config.logo) {
        try {
          doc.addImage(config.logo, 'PNG', margin, 10, 35, 35);
        } catch (e) { console.error(e); }
      }

      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(79, 70, 229); // Primary Color
      doc.text(config.name, 50, 20);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`RUC: ${config.ruc}`, 50, 26);
      doc.text(config.address, 50, 31);
      doc.text(`Teléfono: ${config.phone}`, 50, 36);

      // Invoice Box
      doc.setDrawColor(79, 70, 229);
      doc.setLineWidth(0.5);
      doc.roundedRect(140, 10, 55, 35, 3, 3, 'D');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('BOLETA DE VENTA', 167.5, 20, { align: 'center' });
      doc.text('ELECTRÓNICA', 167.5, 26, { align: 'center' });
      doc.setFontSize(14);
      doc.setTextColor(79, 70, 229);
      doc.text(sale.id.replace('SALE-', 'B001-'), 167.5, 36, { align: 'center' });

      y = 55;
      
      // Client Info Box
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, pageWidth - (margin * 2), 25, 2, 2, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('DATOS DEL CLIENTE', margin + 5, y + 7);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(`Señor(es): ${sale.clientName}`, margin + 5, y + 14);
      doc.text(`Fecha de Emisión: ${format(new Date(sale.date), 'dd/MM/yyyy HH:mm')}`, margin + 5, y + 20);
      doc.text(`Moneda: SOLES (S/)`, pageWidth - margin - 40, y + 14);
      doc.text(`Método de Pago: ${sale.paymentMethod}`, pageWidth - margin - 40, y + 20);

      y += 35;

      // Items Table
      autoTable(doc, {
        startY: y,
        head: [['CANT.', 'CÓDIGO', 'DESCRIPCIÓN', 'P. UNIT', 'TOTAL']],
        body: sale.items.map(item => [
          item.quantity,
          item.code,
          item.comboType === 'Configurable' && item.selectedComboItems 
            ? `${item.name}\n${item.selectedComboItems.map(id => ` - ${products.find(p => p.id === id)?.name}`).join('\n')}`
            : item.name,
          formatCurrency(item.price),
          formatCurrency(item.price * item.quantity)
        ]),
        theme: 'striped',
        headStyles: { 
          fillColor: [79, 70, 229], 
          textColor: 255, 
          fontSize: 10, 
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 20 },
          1: { halign: 'center', cellWidth: 30 },
          2: { halign: 'left' },
          3: { halign: 'right', cellWidth: 30 },
          4: { halign: 'right', cellWidth: 30 }
        },
        styles: { fontSize: 9, cellPadding: 4 },
        margin: { left: margin, right: margin }
      });

      y = (doc as any).lastAutoTable.finalY + 10;

      // Totals Section
      const totalsX = pageWidth - margin - 60;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('OP. GRAVADA:', totalsX, y);
      doc.text(formatCurrency(sale.subtotal), pageWidth - margin, y, { align: 'right' });
      y += 7;
      doc.text('IGV (18%):', totalsX, y);
      doc.text(formatCurrency(sale.tax), pageWidth - margin, y, { align: 'right' });
      y += 2;
      doc.setLineWidth(0.5);
      doc.setDrawColor(79, 70, 229);
      doc.line(totalsX, y, pageWidth - margin, y);
      y += 7;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('TOTAL:', totalsX, y);
      doc.text(formatCurrency(sale.total), pageWidth - margin, y, { align: 'right' });

      // Footer
      y = 270;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Representación impresa de la Boleta de Venta Electrónica.', centerX, y, { align: 'center' });
      doc.text('Consulte su comprobante en: www.nexuspos.com/consultas', centerX, y + 4, { align: 'center' });
    }

    doc.save(`comprobante-${sale.id}.pdf`);
    addNotification('Impresión', `PDF generado exitosamente`, 'success');
  };

  const handleBackup = async () => {
    try {
      const data = await api.backup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const fileName = `nexus-pos-full-backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;

      if ('showSaveFilePicker' in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: fileName,
            types: [{
              description: 'Nexus POS Backup',
              accept: { 'application/json': ['.json'] },
            }],
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          addNotification('Respaldo Seguro', 'Datos exportados exitosamente a la ubicación seleccionada (USB recomendada)', 'success');
          return;
        } catch (e: any) {
          if (e.name === 'AbortError') return;
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      addNotification('Respaldo Generado', 'Archivo de respaldo descargado. Por favor, muévalo a su memoria USB.', 'warning');
    } catch (e) {
      addNotification('Error', 'No se pudo generar el respaldo', 'error');
    }
  };

  const handleRestore = async (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      await api.restore(data);
      
      // Reload page to refresh all state from API
      window.location.reload();
    } catch (e) {
      addNotification('Error', 'El archivo de respaldo no es válido o falló la restauración', 'error');
    }
  };

  const handleActivate = (key: string) => {
    setActivationStatus({
      isActivated: true,
      productKey: key,
      dailyReceiptsCount: 0,
      mode: 'Full'
    });
    addNotification('Sistema Activado', '¡Gracias por adquirir Nexus POS Pro!', 'success');
  };

  const handleStartDemo = () => {
    setActivationStatus({
      isActivated: false,
      firstRunDate: new Date().toISOString(),
      dailyReceiptsCount: 0,
      lastReceiptResetDate: new Date().toISOString(),
      mode: 'Demo'
    });
    addNotification('Modo Demo Iniciado', 'Tienes 7 días de prueba con 20 comprobantes diarios.', 'info');
  };

  const generateHistoryPDF = (filteredSales: Sale[], title: string) => {
    const doc = new jsPDF();
    
    if (config.logo) {
      try {
        doc.addImage(config.logo, 'PNG', 10, 10, 30, 30);
      } catch (e) {
        console.error("Error adding logo to history PDF", e);
      }
    }

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(config.name, 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(title, 105, 30, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Fecha de generación: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 105, 38, { align: 'center' });

    const tableData = filteredSales.map(sale => [
      sale.id,
      format(new Date(sale.date), 'dd/MM/yyyy HH:mm'),
      sale.clientName,
      sale.paymentMethod,
      formatCurrency(sale.total)
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['ID Venta', 'Fecha', 'Cliente', 'Pago', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { top: 45 }
    });

    const total = filteredSales.reduce((acc, s) => acc + s.total, 0);
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(0.5);
    doc.line(140, finalY - 5, 200, finalY - 5);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL:`, 140, finalY);
    doc.text(`${formatCurrency(total)}`, 200, finalY, { align: 'right' });

    doc.save(`historial-${format(new Date(), 'yyyyMMdd-HHmm')}.pdf`);
    addNotification('PDF Generado', 'El historial se ha descargado correctamente', 'success');
  };

  const generateFinancialReportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = 210;
    
    // Filter data based on reportFilters
    const filteredSales = sales.filter(s => {
      const saleDate = new Date(s.date);
      const start = reportFilters.startDate ? new Date(reportFilters.startDate) : null;
      const end = reportFilters.endDate ? new Date(reportFilters.endDate + 'T23:59:59') : null;
      return (!start || saleDate >= start) && (!end || saleDate <= end);
    });

    const filteredExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.date);
      const start = reportFilters.startDate ? new Date(reportFilters.startDate) : null;
      const end = reportFilters.endDate ? new Date(reportFilters.endDate + 'T23:59:59') : null;
      return (!start || expenseDate >= start) && (!end || expenseDate <= end);
    });

    const reportRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);
    const reportExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
    const reportNetProfit = reportRevenue - reportExpenses;

    // Header
    if (config.logo) {
      try {
        doc.addImage(config.logo, 'PNG', 10, 10, 30, 30);
      } catch (e) {
        console.error("Error adding logo to financial PDF", e);
      }
    }

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(config.name, pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Reporte Financiero General', pageWidth / 2, 30, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Periodo: ${reportFilters.startDate || 'Inicio'} al ${reportFilters.endDate || 'Hoy'}`, pageWidth / 2, 38, { align: 'center' });
    doc.text(`Fecha de Generación: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth / 2, 44, { align: 'center' });

    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(0.5);
    doc.line(10, 50, 200, 50);

    // Summary Table
    autoTable(doc, {
      startY: 60,
      head: [['Concepto', 'Monto']],
      body: [
        ['INGRESOS (VENTAS)', formatCurrency(reportRevenue)],
        ['EGRESOS (GASTOS)', formatCurrency(reportExpenses)],
        ['GANANCIA NETA', formatCurrency(reportNetProfit)]
      ],
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241], textColor: 255 },
      styles: { fontSize: 12, cellPadding: 5 }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 20;

    // Partners Board
    if (partners.length > 0) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Distribución de Ganancias entre Socios', 10, currentY);
      currentY += 10;

      const partnerData = partners.map(p => [
        p.name,
        `${p.percentage}%`,
        formatCurrency((reportNetProfit * p.percentage) / 100)
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Socio', 'Participación', 'Ganancia Correspondiente']],
        body: partnerData,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], textColor: 255 },
        styles: { fontSize: 11, cellPadding: 4 }
      });
    }

    doc.save(`reporte-financiero-${format(new Date(), 'yyyyMMdd')}.pdf`);
    addNotification('Reporte Generado', 'El reporte financiero se ha descargado correctamente', 'success');
  };

  const [historyFilters, setHistoryFilters] = useState({
    clientSearch: '',
    startDate: '',
    endDate: ''
  });

  const [reportFilters, setReportFilters] = useState({ 
    startDate: format(new Date(), 'yyyy-MM-01'), 
    endDate: format(new Date(), 'yyyy-MM-dd') 
  });

  const handleAddCategory = (category: Category) => {
    setCategories(prev => [...prev, category]);
  };

  const handleUpdateCategory = (category: Category) => {
    setCategories(prev => prev.map(c => c.id === category.id ? category : c));
  };

  const handleDeleteCategory = (id: string, action: 'delete' | 'move', targetCategoryId?: string) => {
    if (action === 'delete') {
      setProducts(prev => prev.filter(p => p.categoryId !== id));
    } else if (action === 'move' && targetCategoryId) {
      const targetCat = categories.find(c => c.id === targetCategoryId);
      if (targetCat) {
        setProducts(prev => prev.map(p => p.categoryId === id ? { ...p, categoryId: targetCategoryId, category: targetCat.name } : p));
      }
    }
    setCategories(prev => prev.filter(c => c.id !== id));
    api.delete('categories', id);
  };

  const filteredHistory = useMemo(() => {
    return sales.filter(sale => {
      const search = historyFilters.clientSearch.toLowerCase();
      const matchesClient = search === '' || 
        sale.clientName.toLowerCase().includes(search) || 
        (clients.find(c => c.id === sale.clientId)?.document || '').includes(search);
      
      const saleDate = new Date(sale.date);
      const matchesStart = historyFilters.startDate === '' || saleDate >= new Date(historyFilters.startDate);
      const matchesEnd = historyFilters.endDate === '' || saleDate <= new Date(historyFilters.endDate + 'T23:59:59');
      return matchesClient && matchesStart && matchesEnd;
    });
  }, [sales, historyFilters, clients]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-app-main flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-app-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-main flex text-app-main font-sans selection:bg-app-primary-light selection:text-app-primary">
      <Notifications notifications={notifications} onDismiss={dismissNotification} />
      
      {activationStatus && activationStatus.mode === 'None' && (
        <ActivationModal 
          onActivate={handleActivate}
          onStartDemo={handleStartDemo}
          status={activationStatus}
        />
      )}

      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        userRole={currentUser.role}
        businessName={config.name}
        logo={config.logo}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-app-card border-b border-app px-4 md:px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-app-muted hover:bg-app-main rounded-lg"
            >
              <Menu size={24} />
            </button>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-app-main capitalize">
                {activeTab}
              </h2>
              <p className="hidden sm:block text-[10px] md:text-xs text-app-muted font-medium">
                {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {activationStatus?.mode === 'Demo' && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-lg">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">Modo Demo: {20 - activationStatus.dailyReceiptsCount} restantes hoy</span>
              </div>
            )}

            <div className="relative group cursor-pointer" onClick={() => setIsInfoModalOpen(true)}>
              <div className="w-8 h-8 rounded-full bg-app-main border border-app flex items-center justify-center text-app-muted hover:text-app-primary hover:border-app-primary transition-all">
                <span className="font-bold text-sm">?</span>
              </div>
            </div>

            <div className="relative group">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 rounded-xl hover:bg-app-main transition-all"
              >
                <Bell size={20} className={cn(
                  "text-app-muted transition-colors",
                  notifications.length > 0 ? "animate-bounce text-rose-500" : "group-hover:text-app-primary"
                )} />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                    {notifications.length}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsNotificationsOpen(false)}
                      className="fixed inset-0 z-40"
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-app-card border border-app rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-app bg-app-main flex justify-between items-center">
                        <h4 className="font-bold text-app-main text-sm">Notificaciones</h4>
                        <button 
                          onClick={() => setNotifications([])}
                          className="text-[10px] font-bold text-app-primary hover:underline"
                        >
                          Limpiar todo
                        </button>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center">
                            <Bell size={32} className="mx-auto text-app-muted opacity-20 mb-2" />
                            <p className="text-xs text-app-muted font-medium">No tienes notificaciones</p>
                          </div>
                        ) : (
                          <div className="divide-y border-app">
                            {notifications.map(n => (
                              <div key={n.id} className="p-4 hover:bg-app-main transition-all group">
                                <div className="flex justify-between items-start gap-2">
                                  <div className="flex-1 min-w-0">
                                    <h5 className={cn(
                                      "text-xs font-bold",
                                      n.type === 'error' ? 'text-rose-500' :
                                      n.type === 'warning' ? 'text-amber-500' :
                                      n.type === 'success' ? 'text-emerald-500' : 'text-app-primary'
                                    )}>
                                      {n.title}
                                    </h5>
                                    <p className="text-[10px] text-app-muted mt-1 leading-relaxed">{n.message}</p>
                                    <span className="text-[8px] text-app-muted font-bold uppercase mt-2 block">
                                      {format(n.timestamp, 'HH:mm')}
                                    </span>
                                  </div>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setNotifications(prev => prev.filter(notif => notif.id !== n.id));
                                    }}
                                    className="p-1 text-app-muted hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="h-8 w-px bg-app" />

            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-right text-right">
                <p className="text-sm font-bold text-app-main">{currentUser.name} {currentUser.lastName || ''}</p>
              </div>
              <div className="w-10 h-10 bg-app-primary text-white rounded-full border-2 border-app shadow-sm flex items-center justify-center font-black overflow-hidden">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  currentUser.name.charAt(0)
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <div className="bg-app-card p-4 md:p-6 rounded-2xl border border-app shadow-sm flex items-center gap-4">
                      <div className="p-3 bg-app-primary-light text-app-primary rounded-2xl"><DollarSign size={24} /></div>
                      <div><p className="text-xs md:text-sm text-app-muted font-medium">Ventas Hoy</p><h3 className="text-xl md:text-2xl font-bold text-app-main">{formatCurrency(stats.todayRevenue)}</h3></div>
                    </div>
                    <div className="bg-app-card p-4 md:p-6 rounded-2xl border border-app shadow-sm flex items-center gap-4">
                      <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl"><ArrowUpCircle size={24} /></div>
                      <div><p className="text-xs md:text-sm text-app-muted font-medium">Ingresos Totales</p><h3 className="text-xl md:text-2xl font-bold text-app-main">{formatCurrency(stats.totalRevenue)}</h3></div>
                    </div>
                    <div className="bg-app-card p-4 md:p-6 rounded-2xl border border-app shadow-sm flex items-center gap-4">
                      <div className="p-3 bg-rose-500/10 text-rose-600 rounded-2xl"><ArrowDownCircle size={24} /></div>
                      <div><p className="text-xs md:text-sm text-app-muted font-medium">Egresos Totales</p><h3 className="text-xl md:text-2xl font-bold text-app-main">{formatCurrency(stats.totalExpenses)}</h3></div>
                    </div>
                    <div className="bg-app-card p-4 md:p-6 rounded-2xl border border-app shadow-sm flex items-center gap-4">
                      <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-2xl"><Wallet size={24} /></div>
                      <div><p className="text-xs md:text-sm text-app-muted font-medium">Balance Neto</p><h3 className="text-xl md:text-2xl font-bold text-app-main">{formatCurrency(stats.netProfit)}</h3></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-app-card p-4 md:p-6 rounded-2xl border border-app shadow-sm h-[300px] md:h-[400px]">
                        <h3 className="text-lg font-bold text-app-main mb-6">Tendencia de Ventas</h3>
                        <ResponsiveContainer width="100%" height="90%">
                          <AreaChart data={sales.slice(0, 10).reverse()}>
                            <defs><linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/><stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                            <XAxis dataKey="date" tickFormatter={(val) => format(new Date(val), 'dd MMM')} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }} formatter={(val: number) => [formatCurrency(val), 'Total']} />
                            <Area type="monotone" dataKey="total" stroke="var(--primary)" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={3} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-app-card p-6 rounded-2xl border border-app shadow-sm">
                        <h3 className="text-lg font-bold text-app-main mb-6 flex items-center gap-2">
                          <Users2 size={20} className="text-app-primary" />
                          Reparto de Ganancias
                        </h3>
                        <div className="space-y-4">
                          {partners.length === 0 ? (
                            <p className="text-sm text-app-muted text-center py-4 italic">No hay socios registrados</p>
                          ) : (
                            partners.map(partner => (
                              <div key={partner.id} className="flex items-center justify-between p-3 bg-app-main rounded-xl">
                                <div>
                                  <p className="text-sm font-bold text-app-main">{partner.name}</p>
                                  <p className="text-[10px] font-bold text-app-primary uppercase">{partner.percentage}% de participación</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-black text-app-primary">
                                    {formatCurrency((stats.netProfit * partner.percentage) / 100)}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-app-card p-6 rounded-2xl border border-app shadow-sm">
                        <h3 className="text-lg font-bold text-app-main mb-4 flex items-center gap-2">
                          <Download size={20} className="text-app-primary" />
                          Reporte Financiero General
                        </h3>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-app-muted uppercase ml-1">Desde</label>
                              <input 
                                type="date" 
                                value={reportFilters.startDate}
                                onChange={e => setReportFilters({...reportFilters, startDate: e.target.value})}
                                className="w-full px-3 py-2 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-app-muted uppercase ml-1">Hasta</label>
                              <input 
                                type="date" 
                                value={reportFilters.endDate}
                                onChange={e => setReportFilters({...reportFilters, endDate: e.target.value})}
                                className="w-full px-3 py-2 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all text-xs"
                              />
                            </div>
                          </div>
                          <button 
                            onClick={generateFinancialReportPDF}
                            className="w-full py-3 bg-app-primary text-white font-bold rounded-xl hover:bg-app-primary-hover transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-app-primary/10"
                          >
                            <Download size={18} /> Generar Reporte PDF
                          </button>
                        </div>
                      </div>

                      <div className="bg-app-card p-6 rounded-2xl border border-app shadow-sm">
                        <h3 className="text-lg font-bold text-app-main mb-4">Resumen de Operaciones</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-app-muted">Total Ventas:</span>
                            <span className="font-bold text-app-main">{stats.totalSales}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-app-muted">Stock Bajo:</span>
                            <span className="font-bold text-rose-600">{products.filter(p => !p.isService && p.stock < p.minStock).length}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'pos' && (
                <POSView 
                  products={products}
                  categories={categories}
                  cart={cart}
                  setCart={setCart}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  onProcessSale={handleProcessSale}
                  cartSubtotal={cartSubtotal}
                  cartTax={cartTax}
                  cartTotal={cartTotal}
                  clients={clients}
                  onAddClient={(c) => setClients(prev => [...prev, c])}
                  selectedClient={selectedClient}
                  setSelectedClient={setSelectedClient}
                  checkMonthlyFeePaid={checkMonthlyFeePaid}
                  addNotification={addNotification}
                  config={config}
                />
              )}
              {activeTab === 'inventory' && (
                <InventoryView 
                  products={products}
                  categories={categories}
                  onAddProduct={(p) => setProducts(prev => [...prev, p])}
                  onUpdateProduct={(p) => setProducts(prev => prev.map(item => item.id === p.id ? p : item))}
                  onDeleteProduct={(id) => setProducts(prev => prev.filter(item => item.id !== id))}
                  onAddCategory={handleAddCategory}
                  onUpdateCategory={handleUpdateCategory}
                  onDeleteCategory={handleDeleteCategory}
                  addNotification={addNotification}
                />
              )}
              {activeTab === 'clients' && (
                <ClientsView 
                  clients={clients}
                  onAddClient={(c) => setClients(prev => [...prev, c])}
                  onUpdateClient={(c) => setClients(prev => prev.map(item => item.id === c.id ? c : item))}
                  onDeleteClient={(id) => setClients(prev => prev.filter(item => item.id !== id))}
                />
              )}
              {activeTab === 'partners' && (
                <PartnersView 
                  partners={partners}
                  onAddPartner={(p) => setPartners(prev => [...prev, p])}
                  onUpdatePartner={(p) => setPartners(prev => prev.map(item => item.id === p.id ? p : item))}
                  onDeletePartner={(id) => setPartners(prev => prev.filter(item => item.id !== id))}
                />
              )}
              {activeTab === 'history' && (
                <div className="space-y-6">
                  <div className="bg-app-card p-6 rounded-2xl border border-app shadow-sm space-y-4">
                    <h3 className="text-lg font-bold text-app-main flex items-center gap-2">
                      <HistoryIcon size={20} className="text-app-primary" />
                      Filtros de Historial
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-app-muted uppercase">Buscar Cliente (Nombre o DNI)</label>
                        <input 
                          type="text"
                          value={historyFilters.clientSearch}
                          onChange={e => setHistoryFilters({...historyFilters, clientSearch: e.target.value})}
                          placeholder="Ej. Juan Perez o 70123456"
                          className="w-full px-4 py-2 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-app-muted uppercase">Desde</label>
                        <input 
                          type="date" 
                          value={historyFilters.startDate}
                          onChange={e => setHistoryFilters({...historyFilters, startDate: e.target.value})}
                          className="w-full px-4 py-2 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-app-muted uppercase">Hasta</label>
                        <input 
                          type="date" 
                          value={historyFilters.endDate}
                          onChange={e => setHistoryFilters({...historyFilters, endDate: e.target.value})}
                          className="w-full px-4 py-2 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <button 
                        onClick={() => setIsExpensesModalOpen(true)}
                        className="px-6 py-2 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20"
                      >
                        <Wallet size={16} /> Gestionar Egresos
                      </button>
                      <button 
                        onClick={() => generateHistoryPDF(filteredHistory, 'Historial Filtrado')}
                        className="px-6 py-2 bg-app-primary text-white font-bold rounded-xl hover:bg-app-primary-hover transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-app-primary/20"
                      >
                        <Download size={16} /> PDF Filtrado
                      </button>
                      <button 
                        onClick={() => generateHistoryPDF(sales, 'Historial Completo')}
                        className="px-6 py-2 bg-app-card text-app-main border border-app font-bold rounded-xl hover:bg-app-main transition-all text-sm flex items-center justify-center gap-2"
                      >
                        <Download size={16} /> PDF Completo
                      </button>
                    </div>
                  </div>

                  <div className="bg-app-card rounded-2xl border border-app shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-app flex items-center justify-between bg-app-main">
                      <h3 className="text-lg font-bold text-app-main">Resultados ({filteredHistory.length})</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-app-main text-app-muted text-xs uppercase tracking-wider">
                            <th className="px-6 py-4 font-bold">ID Venta</th>
                            <th className="px-6 py-4 font-bold">Fecha</th>
                            <th className="px-6 py-4 font-bold">Cliente</th>
                            <th className="px-6 py-4 font-bold">Total</th>
                            <th className="px-6 py-4 font-bold text-right">Imprimir</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y border-app">
                          {filteredHistory.map(sale => (
                            <tr key={sale.id} className="hover:bg-app-main transition-colors">
                              <td className="px-6 py-4 text-sm font-medium text-app-main">{sale.id}</td>
                              <td className="px-6 py-4 text-sm text-app-muted">{format(new Date(sale.date), 'dd MMM, HH:mm')}</td>
                              <td className="px-6 py-4 text-sm text-app-main font-medium">{sale.clientName}</td>
                              <td className="px-6 py-4 text-sm font-bold text-app-main">{formatCurrency(sale.total)}</td>
                              <td className="px-6 py-4 text-right space-x-2">
                                <button onClick={() => generatePDF(sale, '80mm')} className="p-2 text-app-muted hover:text-app-primary transition-all" title="80mm">
                                  <Printer size={16} /> <span className="text-[10px] font-bold">80</span>
                                </button>
                                <button onClick={() => generatePDF(sale, '58mm')} className="p-2 text-app-muted hover:text-app-primary transition-all" title="58mm">
                                  <Printer size={16} /> <span className="text-[10px] font-bold">58</span>
                                </button>
                                <button onClick={() => generatePDF(sale, 'A4')} className="p-2 text-app-muted hover:text-app-primary transition-all" title="A4">
                                  <Printer size={16} /> <span className="text-[10px] font-bold">A4</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'settings' && (
                <SettingsView 
                  config={config}
                  setConfig={setConfig}
                  users={users}
                  currentUser={currentUser}
                  onAddUser={(u) => {
                    setUsers(prev => {
                      const exists = prev.find(user => user.id === u.id);
                      if (exists) {
                        return prev.map(user => user.id === u.id ? u : user);
                      }
                      return [...prev, u];
                    });
                    // Update current user if it's the one being edited
                    if (currentUser && currentUser.id === u.id) {
                      setCurrentUser(u);
                    }
                  }}
                  onDeleteUser={(id) => setUsers(prev => prev.filter(u => u.id !== id))}
                  onBackup={handleBackup}
                  onRestore={handleRestore}
                  theme={theme}
                  setTheme={setTheme}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {isExpensesModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-app-card w-full max-w-6xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 bg-app-primary text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <Wallet size={24} />
                  <h3 className="text-xl font-bold">Gestión de Egresos</h3>
                </div>
                <button onClick={() => setIsExpensesModalOpen(false)} className="hover:bg-white/20 p-2 rounded-xl transition-all">
                  <Plus className="rotate-45" size={24} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <ExpensesView 
                  expenses={expenses}
                  onAddExpense={(e) => setExpenses(prev => [...prev, e])}
                  onDeleteExpense={(id) => setExpenses(prev => prev.filter(item => item.id !== id))}
                  onGenerateReport={generateFinancialReportPDF}
                  reportFilters={reportFilters}
                  setReportFilters={setReportFilters}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isInfoModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-app-card w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-app-primary-light text-app-primary rounded-3xl flex items-center justify-center mx-auto">
                  <span className="text-4xl font-black">?</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-app-main">Información del Sistema</h3>
                  <p className="text-sm text-app-muted mt-2">Creado por <span className="font-bold text-app-main">Luigui Carlo Arata V.</span></p>
                </div>
                
                <div className="flex justify-center gap-6 pt-4">
                  <a href="https://www.facebook.com/profile.php?id=61584020012816" target="_blank" rel="noopener noreferrer" className="text-app-muted hover:text-[#1877F2] transition-colors">
                    <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                  <a href="https://www.instagram.com/possolutiongroup" target="_blank" rel="noopener noreferrer" className="text-app-muted hover:text-[#E4405F] transition-colors">
                    <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </a>
                  <a href="https://www.tiktok.com/@possolutiongroup" target="_blank" rel="noopener noreferrer" className="text-app-muted hover:text-black transition-colors">
                    <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.12-1.31a6.417 6.417 0 01-1.87-1.55v7.36c.03 3.47-2.23 6.7-5.58 7.61-2.9.77-6.07-.18-8.13-2.34-2.21-2.3-2.74-5.91-1.36-8.71 1.14-2.4 3.54-4.04 6.2-4.15l.02 4.05c-1.39.07-2.74.82-3.46 2.01-.87 1.41-.79 3.39.21 4.68 1.06 1.36 2.91 1.96 4.6 1.5 1.53-.4 2.71-1.75 2.71-3.33V0h-.01z"/></svg>
                  </a>
                  <a href="https://wa.me/51953812626" target="_blank" rel="noopener noreferrer" className="text-app-muted hover:text-[#25D366] transition-colors">
                    <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  </a>
                </div>

                <button 
                  onClick={() => setIsInfoModalOpen(false)}
                  className="w-full py-3 bg-app-primary text-white font-bold rounded-xl hover:bg-app-primary-hover transition-all"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
