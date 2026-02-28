import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Search, ShoppingBag, Minus, Banknote, CreditCard, Smartphone, History, Calendar, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, CartItem, Client, Sale, Category, BusinessConfig } from '../../types';
import { cn, formatCurrency } from '../../lib/utils';

interface POSViewProps {
  products: Product[];
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  paymentMethod: Sale['paymentMethod'];
  setPaymentMethod: (method: Sale['paymentMethod']) => void;
  onProcessSale: (printFormat?: '80mm' | '58mm' | 'A4') => void;
  cartSubtotal: number;
  cartTax: number;
  cartTotal: number;
  clients: Client[];
  selectedClient: Client | null;
  setSelectedClient: (client: Client | null) => void;
  checkMonthlyFeePaid: (clientId: string, productId: string, month: string, year: number) => boolean;
  addNotification: (title: string, message: string, type?: any) => void;
  categories: Category[];
  config: BusinessConfig;
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const POSView: React.FC<POSViewProps> = ({
  products,
  cart,
  setCart,
  searchTerm,
  setSearchTerm,
  paymentMethod,
  setPaymentMethod,
  onProcessSale,
  cartSubtotal,
  cartTax,
  cartTotal,
  clients,
  selectedClient,
  setSelectedClient,
  checkMonthlyFeePaid,
  addNotification,
  categories,
  config
}) => {
  const [feeModalProduct, setFeeModalProduct] = useState<Product | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [selectedPrintFormat, setSelectedPrintFormat] = useState<'80mm' | '58mm' | 'A4'>('80mm');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [configuringCombo, setConfiguringCombo] = useState<Product | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, string[]>>({});
  const [activeMobileTab, setActiveMobileTab] = useState<'products' | 'cart'>('products');
  
  const currentMonthIndex = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const getAvailableStock = (product: Product) => {
    if (product.isService || product.isMonthlyFee) return Infinity;
    if (!product.isCombo) return product.stock;
    
    if (!product.comboItems || product.comboItems.length === 0) return 0;
    
    let minStock = Infinity;
    product.comboItems.forEach(itemId => {
      const item = products.find(p => p.id === itemId);
      if (item && !item.isService && !item.isMonthlyFee) {
        minStock = Math.min(minStock, item.stock);
      }
    });
    return minStock === Infinity ? 0 : minStock;
  };

  const [feeDetails, setFeeDetails] = useState<{
    month: string;
    year: number;
    type: 'Current' | 'Past' | 'Advanced';
  }>({
    month: MONTHS[currentMonthIndex],
    year: currentYear,
    type: 'Current'
  });

  const availableMonths = useMemo(() => {
    if (feeDetails.type === 'Current') {
      return [MONTHS[currentMonthIndex]];
    }
    if (feeDetails.type === 'Past') {
      return MONTHS.slice(0, currentMonthIndex);
    }
    if (feeDetails.type === 'Advanced') {
      return MONTHS.slice(currentMonthIndex + 1);
    }
    return MONTHS;
  }, [feeDetails.type, currentMonthIndex]);

  // Update month if current selection is not in available months
  useEffect(() => {
    if (!availableMonths.includes(feeDetails.month)) {
      setFeeDetails(prev => ({ ...prev, month: availableMonths[0] || MONTHS[currentMonthIndex] }));
    }
  }, [availableMonths, feeDetails.month, currentMonthIndex]);

  const filteredProducts = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.code.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      const matchesCategory = selectedCategoryId === 'all' || p.categoryId === selectedCategoryId;
      if (!matchesCategory) return false;

      // Combo logic
      if (p.isCombo) {
        // Check dates
        const isWithinDate = (!p.comboStartDate || today >= p.comboStartDate) && 
                            (!p.comboEndDate || today <= p.comboEndDate);
        if (!isWithinDate) return false;

        // Check stock of items
        if (p.comboItems && p.comboItems.length > 0) {
          const allItemsHaveStock = p.comboItems.every(itemId => {
            const item = products.find(prod => prod.id === itemId);
            if (!item) return false;
            if (item.isService) return true;
            return item.stock > 0;
          });
          if (!allItemsHaveStock) return false;
        }
      }

      return true;
    }).map(p => {
      // Calculate combo price if it has a discount
      if (p.isCombo && p.comboDiscountPercentage && p.comboDiscountPercentage > 0) {
        // If combo items are set, we sum their prices and apply discount
        // Otherwise we just apply discount to the product's own price
        let basePrice = p.price;
        if (p.comboItems && p.comboItems.length > 0) {
          basePrice = p.comboItems.reduce((acc, itemId) => {
            const item = products.find(prod => prod.id === itemId);
            return acc + (item?.price || 0);
          }, 0);
        }
        const discountedPrice = basePrice * (1 - p.comboDiscountPercentage / 100);
        return { ...p, price: discountedPrice, originalPrice: basePrice };
      }
      return p;
    });
  }, [products, searchTerm]);

  const availableCategories = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return categories.filter(cat => {
      if (cat.prefix === 'CB' || cat.name.toUpperCase() === 'COMBOS') {
        // Check if there are ANY valid combos
        const hasValidCombos = products.some(p => {
          if (!p.isCombo || p.categoryId !== cat.id) return false;
          
          const isWithinDate = (!p.comboStartDate || today >= p.comboStartDate) && 
                              (!p.comboEndDate || today <= p.comboEndDate);
          if (!isWithinDate) return false;

          if (p.comboItems && p.comboItems.length > 0) {
            return p.comboItems.every(itemId => {
              const item = products.find(prod => prod.id === itemId);
              if (!item) return false;
              if (item.isService) return true;
              return item.stock > 0;
            });
          }
          return true;
        });
        return hasValidCombos;
      }
      return true;
    });
  }, [categories, products]);

  const changeAmount = Math.max(0, paymentAmount - cartTotal);

  const handleFinalizeSale = () => {
    onProcessSale(selectedPrintFormat);
    setIsCheckoutModalOpen(false);
    setPaymentAmount(0);
  };

  const addToCart = (product: Product) => {
    if (product.isCombo) {
      setConfiguringCombo(product);
      if (product.comboType === 'Fixed') {
        // For fixed combos, we pre-select the items
        setSelectedOptions({
          0: product.comboItems || []
        });
      } else {
        setSelectedOptions({});
      }
      return;
    }

    const availableStock = getAvailableStock(product);
    const inCart = cart.find(item => item.id === product.id);
    const currentQtyInCart = inCart ? inCart.quantity : 0;

    if (currentQtyInCart + 1 > availableStock) {
      addNotification('Stock Insuficiente', `No hay suficiente stock para agregar más de ${product.name}`, 'warning');
      return;
    }
    
    if (product.isMonthlyFee) {
      setFeeModalProduct(product);
      return;
    }

    setCart(prev => {
      if (inCart) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const confirmFeeAddition = () => {
    if (!feeModalProduct) return;
    
    if (selectedClient && checkMonthlyFeePaid(selectedClient.id, feeModalProduct.id, feeDetails.month, feeDetails.year)) {
      addNotification('Pago Duplicado', `El cliente ya pagó ${feeModalProduct.name} para ${feeDetails.month} ${feeDetails.year}`, 'warning');
      return;
    }

    setCart(prev => [
      ...prev, 
      { 
        ...feeModalProduct, 
        quantity: 1, 
        feeDetails: { ...feeDetails },
        name: `${feeModalProduct.name} - ${feeDetails.month} ${feeDetails.year} (${feeDetails.type === 'Current' ? 'Actual' : feeDetails.type === 'Past' ? 'Atrasado' : 'Adelantado'})`
      }
    ]);
    setFeeModalProduct(null);
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      const uniqueId = item.id + (item.feeDetails ? `-${item.feeDetails.month}-${item.feeDetails.year}` : '');
      if (uniqueId === itemId) {
        const product = products.find(p => p.id === item.id);
        const availableStock = product ? getAvailableStock(product) : 999;
        const newQty = item.quantity + delta;

        if (newQty > availableStock && !item.isService && !item.isMonthlyFee) {
          addNotification('Stock Insuficiente', `No hay suficiente stock para ${item.name}`, 'warning');
          return item;
        }

        if (newQty < 1) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => {
      const uniqueId = item.id + (item.feeDetails ? `-${item.feeDetails.month}-${item.feeDetails.year}` : '');
      return uniqueId !== itemId;
    }));
  };

  const updatePrice = (itemId: string, newPrice: number) => {
    setCart(prev => prev.map(item => {
      const uniqueId = item.id + (item.feeDetails ? `-${item.feeDetails.month}-${item.feeDetails.year}` : '');
      if (uniqueId === itemId) {
        return { ...item, price: newPrice };
      }
      return item;
    }));
  };

  const handleConfirmConfigurableCombo = () => {
    if (!configuringCombo) return;

    let allSelected = false;
    if (configuringCombo.comboType === 'Fixed') {
      allSelected = (selectedOptions[0]?.length || 0) === (configuringCombo.comboItems?.length || 0);
    } else {
      allSelected = (configuringCombo.configurableOptions || []).every((opt, idx) => 
        (selectedOptions[idx]?.length || 0) === opt.quantity
      );
    }

    if (!allSelected) {
      addNotification('Selección Incompleta', 'Por favor completa todas las selecciones del combo', 'warning');
      return;
    }

    const selectedIds = Object.values(selectedOptions).flat();
    
    // Calculate price if it's 0 (dynamic) or apply discount
    let finalPrice: number = configuringCombo.price;
    if (finalPrice === 0 || (configuringCombo.comboDiscountPercentage && configuringCombo.comboDiscountPercentage > 0)) {
      let basePrice = 0;
      selectedIds.forEach(id => {
        const p = products.find(prod => prod.id === id);
        basePrice += (p?.price || 0);
      });
      finalPrice = basePrice * (1 - (configuringCombo.comboDiscountPercentage || 0) / 100);
    }

    setCart(prev => [
      ...prev,
      {
        ...configuringCombo,
        id: `${configuringCombo.id}-${Date.now()}`, // Unique ID for this specific combo instance
        price: Number(finalPrice.toFixed(2)),
        quantity: 1,
        selectedComboItems: selectedIds,
        name: `${configuringCombo.name} (Personalizado)`
      }
    ]);

    setConfiguringCombo(null);
    setSelectedOptions({});
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] relative">
      {/* Mobile Tabs */}
      <div className="lg:hidden flex p-1 bg-app-card rounded-xl border border-app mb-4">
        <button 
          onClick={() => setActiveMobileTab('products')}
          className={cn(
            "flex-1 py-2 text-xs font-black rounded-lg transition-all",
            activeMobileTab === 'products' ? "bg-app-primary text-white shadow-md" : "text-app-muted"
          )}
        >
          PRODUCTOS
        </button>
        <button 
          onClick={() => setActiveMobileTab('cart')}
          className={cn(
            "flex-1 py-2 text-xs font-black rounded-lg transition-all relative",
            activeMobileTab === 'cart' ? "bg-app-primary text-white shadow-md" : "text-app-muted"
          )}
        >
          CARRITO
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-app-card">
              {cart.reduce((acc, item) => acc + item.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
        <div className={cn(
          "lg:col-span-2 flex flex-col gap-4 overflow-hidden",
          activeMobileTab !== 'products' && "hidden lg:flex"
        )}>
          <div className="bg-app-card rounded-2xl border border-app shadow-sm p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o código..."
              className="w-full pl-10 pr-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <select 
              className="w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all font-bold text-app-main"
              value={selectedClient?.id || ''}
              onChange={(e) => {
                const client = clients.find(c => c.id === e.target.value);
                setSelectedClient(client || null);
              }}
            >
              <option value="">Seleccionar Cliente (Opcional)</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name} - {c.document}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border",
              selectedCategoryId === 'all' 
                ? "bg-app-primary text-white border-app-primary shadow-md" 
                : "bg-app-card text-app-muted border-app hover:bg-app-main"
            )}
          >
            Todos
          </button>
          {availableCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border",
                selectedCategoryId === cat.id 
                  ? "bg-app-primary text-white border-app-primary shadow-md" 
                  : "bg-app-card text-app-muted border-app hover:bg-app-main"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3 pb-4">
          {filteredProducts
            .map(product => (
              <motion.div 
                key={product.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => addToCart(product)}
                className="cursor-pointer"
              >
                <div className={cn(
                  "bg-app-card rounded-xl border border-app shadow-sm overflow-hidden h-full flex flex-col hover:border-app-primary transition-colors",
                  product.stock <= 0 && !product.isService && !product.isMonthlyFee && !product.isCombo && "opacity-50 grayscale"
                )}>
                  <div className="h-24 bg-app-main relative overflow-hidden flex items-center justify-center border-b border-app">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={24} className="text-app-muted" />
                    )}
                    <div className="absolute top-1 right-1 flex flex-col gap-1 items-end">
                      <span className="text-[8px] font-black px-1.5 py-0.5 bg-app-card/90 text-app-primary rounded-md shadow-sm uppercase">
                        {product.category}
                      </span>
                      {product.isCombo && product.comboDiscountPercentage && product.comboDiscountPercentage > 0 && (
                        <span className="text-[8px] font-black px-1.5 py-0.5 bg-rose-500 text-white rounded-md shadow-sm uppercase">
                          -{product.comboDiscountPercentage}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-2 flex flex-col flex-1 justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-app-main line-clamp-2 leading-tight">{product.name}</h4>
                      <p className={cn(
                        "text-[10px] mt-1 font-medium",
                        getAvailableStock(product) < product.minStock && !product.isService && !product.isMonthlyFee ? "text-rose-500" : "text-app-muted"
                      )}>
                        {product.isMonthlyFee ? 'Mensualidad' : product.isService ? 'Servicio' : `Stock: ${getAvailableStock(product)}`}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex flex-col">
                        {product.isCombo && product.comboDiscountPercentage && product.comboDiscountPercentage > 0 && (
                          <span className="text-[10px] text-app-muted line-through">
                            {formatCurrency((product as any).originalPrice || product.price)}
                          </span>
                        )}
                        <span className="text-sm font-black text-app-primary">{formatCurrency(product.price)}</span>
                      </div>
                      <div className="p-1 bg-app-primary-light text-app-primary rounded-md">
                        <Plus size={12} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
        </div>
      </div>

        <div className={cn(
          "bg-app-card rounded-2xl border border-app shadow-sm flex flex-col h-full overflow-hidden",
          activeMobileTab !== 'cart' && "hidden lg:flex"
        )}>
          <div className="p-4 border-b border-app bg-app-main flex items-center justify-between">
          <h3 className="font-bold text-app-main flex items-center gap-2">
            <ShoppingBag size={20} className="text-app-primary" />
            Carrito de Venta
          </h3>
          <button onClick={() => setCart([])} className="p-2 hover:bg-app-main rounded-lg text-rose-500 transition-colors">
            <Trash2 size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-app-muted gap-2">
              <ShoppingBag size={48} strokeWidth={1} />
              <p>El carrito está vacío</p>
            </div>
          ) : (
            cart.map(item => {
              const uniqueId = item.id + (item.feeDetails ? `-${item.feeDetails.month}-${item.feeDetails.year}` : '');
              return (
                <div key={uniqueId} className="flex items-center gap-3 p-2 rounded-xl hover:bg-app-main transition-colors">
                  <div className="flex-1">
                    <h5 className="text-sm font-bold text-app-main leading-tight">{item.name}</h5>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[10px] font-bold text-app-muted">{config.currency}</span>
                      <input 
                        type="number"
                        step="0.01"
                        value={item.price ?? ''}
                        onChange={(e) => updatePrice(uniqueId, parseFloat(e.target.value) || 0)}
                        className="text-xs font-black text-app-primary bg-transparent border-b border-dashed border-app-primary/30 w-16 focus:outline-none focus:border-app-primary"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-app-main rounded-lg p-1">
                    <button onClick={() => updateQuantity(uniqueId, -1)} className="p-1 hover:bg-app-card rounded-md transition-colors">
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(uniqueId, 1)} className="p-1 hover:bg-app-card rounded-md transition-colors">
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="text-right min-w-[60px]">
                    <p className="text-sm font-bold text-app-main">{formatCurrency(item.price * item.quantity)}</p>
                    <button onClick={() => removeFromCart(uniqueId)} className="text-[10px] text-rose-500 hover:underline">Eliminar</button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-6 border-t border-app bg-app-main space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-app-muted">
              <span>Subtotal</span>
              <span>{formatCurrency(cartSubtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-app-muted">
              <span>IGV (18%)</span>
              <span>{formatCurrency(cartTax)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-app-main pt-2 border-t border-app">
              <span>Total</span>
              <span className="text-app-primary">{formatCurrency(cartTotal)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'Cash', icon: Banknote, label: 'Efectivo' },
              { id: 'Card', icon: CreditCard, label: 'Tarjeta' },
              { id: 'Mobile', icon: Smartphone, label: 'Yape/Plin' },
              { id: 'Transfer', icon: History, label: 'Transf.' },
            ].map(method => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id as Sale['paymentMethod'])}
                className={cn(
                  "flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all",
                  paymentMethod === method.id 
                    ? "bg-app-primary text-white shadow-lg shadow-app-primary/20" 
                    : "bg-app-card text-app-muted border border-app hover:bg-app-main"
                )}
              >
                <method.icon size={16} /> {method.label}
              </button>
            ))}
          </div>

          <button 
            className="w-full py-4 bg-app-primary text-white font-bold rounded-xl shadow-lg shadow-app-primary/20 hover:bg-app-primary-hover active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none" 
            disabled={cart.length === 0}
            onClick={() => {
              setPaymentAmount(cartTotal);
              setIsCheckoutModalOpen(true);
            }}
          >
            Cobrar {formatCurrency(cartTotal)}
          </button>
        </div>
      </div>
    </div>

    <AnimatePresence>
        {configuringCombo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-app-card w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-app flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-app bg-app-main flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black text-app-main uppercase tracking-tight">Configurar Combo</h3>
                  <p className="text-xs text-app-muted font-bold">{configuringCombo.name}</p>
                </div>
                <button onClick={() => setConfiguringCombo(null)} className="p-2 hover:bg-app-main rounded-xl transition-colors">
                  <Trash2 size={20} className="text-app-muted" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {configuringCombo.comboType === 'Fixed' ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-app pb-2">
                      <div>
                        <h4 className="text-sm font-black text-app-main uppercase">Productos del Combo</h4>
                        <p className="text-[10px] text-app-muted font-bold">Puedes cambiar los productos si lo deseas</p>
                      </div>
                      <span className={cn(
                        "text-[10px] font-black px-2 py-1 rounded-lg",
                        (selectedOptions[0]?.length || 0) === (configuringCombo.comboItems?.length || 0) ? "bg-emerald-500/10 text-emerald-500" : "bg-app-primary/10 text-app-primary"
                      )}>
                        {selectedOptions[0]?.length || 0} / {configuringCombo.comboItems?.length || 0}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {products
                        .filter(p => !p.isCombo && p.stock > 0 && !p.isService && !p.isMonthlyFee)
                        .map(p => {
                          const isSelected = selectedOptions[0]?.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              onClick={() => {
                                const current = selectedOptions[0] || [];
                                if (isSelected) {
                                  setSelectedOptions({ 0: current.filter(id => id !== p.id) });
                                } else if (current.length < (configuringCombo.comboItems?.length || 0)) {
                                  setSelectedOptions({ 0: [...current, p.id] });
                                }
                              }}
                              className={cn(
                                "p-3 rounded-2xl border text-left transition-all relative overflow-hidden group",
                                isSelected 
                                  ? "bg-app-primary border-app-primary shadow-lg shadow-app-primary/20" 
                                  : "bg-app-main border-app hover:border-app-primary"
                              )}
                            >
                              <div className={cn("text-[10px] font-bold mb-1", isSelected ? "text-white/80" : "text-app-muted")}>{p.code}</div>
                              <div className={cn("text-xs font-black line-clamp-1", isSelected ? "text-white" : "text-app-main")}>{p.name}</div>
                              <div className={cn("text-[10px] font-bold mt-2", isSelected ? "text-white/90" : "text-app-primary")}>{formatCurrency(p.price)}</div>
                              {isSelected && (
                                <div className="absolute top-2 right-2">
                                  <div className="bg-white text-app-primary rounded-full p-0.5">
                                    <Plus size={10} strokeWidth={4} />
                                  </div>
                                </div>
                              )}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ) : (
                  configuringCombo.configurableOptions?.map((option, optIdx) => {
                    const category = categories.find(c => c.id === option.categoryId);
                    const categoryProducts = products.filter(p => {
                      if (option.categoryId === 'all') {
                        return !p.isCombo && p.stock > 0 && !p.isService && !p.isMonthlyFee;
                      }
                      return p.categoryId === option.categoryId && !p.isCombo && p.stock > 0;
                    });
                    const selectedCount = selectedOptions[optIdx]?.length || 0;

                    return (
                      <div key={optIdx} className="space-y-4">
                        <div className="flex justify-between items-end border-b border-app pb-2">
                          <div>
                            <h4 className="text-sm font-black text-app-main uppercase">{category?.name || (option.categoryId === 'all' ? 'Cualquier Producto' : 'Categoría')}</h4>
                            <p className="text-[10px] text-app-muted font-bold">Selecciona {option.quantity} {option.quantity === 1 ? 'producto' : 'productos'}</p>
                          </div>
                          <span className={cn(
                            "text-[10px] font-black px-2 py-1 rounded-lg",
                            selectedCount === option.quantity ? "bg-emerald-500/10 text-emerald-500" : "bg-app-primary/10 text-app-primary"
                          )}>
                            {selectedCount} / {option.quantity}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {categoryProducts.map(p => {
                            const isSelected = selectedOptions[optIdx]?.includes(p.id);
                            return (
                              <button
                                key={p.id}
                                onClick={() => {
                                  const current = selectedOptions[optIdx] || [];
                                  if (isSelected) {
                                    setSelectedOptions({
                                      ...selectedOptions,
                                      [optIdx]: current.filter(id => id !== p.id)
                                    });
                                  } else if (current.length < option.quantity) {
                                    setSelectedOptions({
                                      ...selectedOptions,
                                      [optIdx]: [...current, p.id]
                                    });
                                  }
                                }}
                                className={cn(
                                  "p-3 rounded-2xl border text-left transition-all relative overflow-hidden group",
                                  isSelected 
                                    ? "bg-app-primary border-app-primary shadow-lg shadow-app-primary/20" 
                                    : "bg-app-main border-app hover:border-app-primary"
                                )}
                              >
                                <div className={cn(
                                  "text-[10px] font-bold mb-1",
                                  isSelected ? "text-white/80" : "text-app-muted"
                                )}>
                                  {p.code}
                                </div>
                                <div className={cn(
                                  "text-xs font-black line-clamp-1",
                                  isSelected ? "text-white" : "text-app-main"
                                )}>
                                  {p.name}
                                </div>
                                <div className={cn(
                                  "text-[10px] font-bold mt-2",
                                  isSelected ? "text-white/90" : "text-app-primary"
                                )}>
                                  {formatCurrency(p.price)}
                                </div>
                                {isSelected && (
                                  <div className="absolute top-2 right-2">
                                    <div className="bg-white text-app-primary rounded-full p-0.5">
                                      <Plus size={10} strokeWidth={4} />
                                    </div>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                          {categoryProducts.length === 0 && (
                            <div className="col-span-full py-8 text-center bg-app-main rounded-2xl border border-dashed border-app">
                              <p className="text-xs text-app-muted font-bold">No hay productos disponibles en esta categoría</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-6 border-t border-app bg-app-main flex gap-4">
                <button 
                  onClick={() => setConfiguringCombo(null)}
                  className="flex-1 px-6 py-4 bg-app-card border border-app rounded-2xl font-black text-app-muted uppercase tracking-wider hover:bg-app-main transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleConfirmConfigurableCombo}
                  className="flex-[2] px-6 py-4 bg-app-primary text-white rounded-2xl font-black uppercase tracking-wider shadow-lg shadow-app-primary/30 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Confirmar Selección
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCheckoutModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[80] flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-app-card w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 bg-app-primary text-white">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Banknote size={24} />
                  Finalizar Venta
                </h3>
                <p className="text-app-primary-light text-sm">Resumen de pago y entrega</p>
              </div>
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-center p-4 bg-app-main rounded-2xl border border-app">
                  <span className="text-app-muted font-bold uppercase text-xs">Total a Pagar</span>
                  <span className="text-2xl font-black text-app-primary">{formatCurrency(cartTotal)}</span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-app-muted uppercase">¿Con cuánto paga el cliente?</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-app-muted">S/</span>
                    <input 
                      type="number"
                      value={isNaN(paymentAmount) ? '' : paymentAmount}
                      onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)}
                      className="w-full pl-10 pr-4 py-4 bg-app-main border-none rounded-2xl focus:ring-2 focus:ring-app-primary transition-all font-black text-xl"
                      placeholder="0.00"
                      autoFocus
                    />
                  </div>
                </div>

                {paymentAmount > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-4 rounded-2xl flex justify-between items-center",
                      paymentAmount >= cartTotal ? "bg-emerald-50 border border-emerald-100" : "bg-rose-50 border border-rose-100"
                    )}
                  >
                    <span className={cn("font-bold text-xs uppercase", paymentAmount >= cartTotal ? "text-emerald-600" : "text-rose-600")}>
                      {paymentAmount >= cartTotal ? "Vuelto a entregar" : "Faltante"}
                    </span>
                    <span className={cn("text-xl font-black", paymentAmount >= cartTotal ? "text-emerald-600" : "text-rose-600")}>
                      {formatCurrency(Math.abs(paymentAmount - cartTotal))}
                    </span>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-app-muted uppercase">Formato de Impresión</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['58mm', '80mm', 'A4'].map(format => (
                      <button
                        key={format}
                        onClick={() => setSelectedPrintFormat(format as any)}
                        className={cn(
                          "py-3 rounded-xl text-xs font-bold border transition-all",
                          selectedPrintFormat === format 
                            ? "bg-app-primary text-white border-app-primary shadow-md" 
                            : "bg-app-card text-app-muted border-app hover:bg-app-main"
                        )}
                      >
                        {format}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setIsCheckoutModalOpen(false)}
                    className="flex-1 py-4 bg-app-main text-app-muted font-bold rounded-xl hover:bg-app-card transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleFinalizeSale}
                    disabled={paymentAmount < cartTotal && paymentMethod === 'Cash'}
                    className="flex-1 py-4 bg-app-primary text-white font-bold rounded-xl hover:bg-app-primary-hover transition-all shadow-lg shadow-app-primary/20 disabled:opacity-50"
                  >
                    Finalizar y Cobrar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {feeModalProduct && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70] flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-app-card w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 bg-app-primary text-white">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Calendar size={24} />
                  Detalles de Mensualidad
                </h3>
                <p className="text-app-primary-light text-sm">{feeModalProduct.name}</p>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-app-muted uppercase">Tipo de Pago</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'Past', label: 'Atrasado' },
                      { id: 'Current', label: 'Actual' },
                      { id: 'Advanced', label: 'Adelantado' },
                    ].map(type => (
                      <button
                        key={type.id}
                        onClick={() => setFeeDetails({ ...feeDetails, type: type.id as any })}
                        className={cn(
                          "py-2 rounded-xl text-xs font-bold border transition-all",
                          feeDetails.type === type.id 
                            ? "bg-app-primary text-white border-app-primary" 
                            : "bg-app-card text-app-muted border-app hover:bg-app-main"
                        )}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-app-muted uppercase">Mes</label>
                    <select 
                      value={feeDetails.month}
                      onChange={e => setFeeDetails({ ...feeDetails, month: e.target.value })}
                      className="w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all font-bold text-sm"
                    >
                      {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
                      {availableMonths.length === 0 && <option value={MONTHS[currentMonthIndex]}>{MONTHS[currentMonthIndex]}</option>}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-app-muted uppercase">Año</label>
                    <input 
                      type="number"
                      value={isNaN(feeDetails.year) ? '' : feeDetails.year}
                      onChange={e => setFeeDetails({ ...feeDetails, year: parseInt(e.target.value) || currentYear })}
                      className="w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all font-bold text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setFeeModalProduct(null)}
                    className="flex-1 py-4 bg-app-main text-app-muted font-bold rounded-xl hover:bg-app-card transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={confirmFeeAddition}
                    className="flex-1 py-4 bg-app-primary text-white font-bold rounded-xl hover:bg-app-primary-hover transition-all shadow-lg shadow-app-primary/20"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
