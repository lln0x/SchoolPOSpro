import React, { useState, useMemo } from 'react';
import { 
  Plus, Search, Edit2, Trash2, AlertCircle, Package, 
  Image as ImageIcon, Upload, Layers, FileSpreadsheet, X 
} from 'lucide-react';
import { Product, Category } from '../../types';
import { cn, formatCurrency } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';

interface InventoryViewProps {
  products: Product[];
  categories: Category[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddCategory: (category: Category) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (id: string, action: 'delete' | 'move', targetCategoryId?: string) => void;
  addNotification: (title: string, message: string, type?: any) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  categories,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  addNotification
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatPrefix, setNewCatPrefix] = useState('');
  const [newCatManagesStock, setNewCatManagesStock] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [comboItemSearch, setComboItemSearch] = useState('');

  // Category Deletion Flow State
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleteStep, setDeleteStep] = useState<'confirm' | 'action' | 'move'>('confirm');
  const [targetCategoryId, setTargetCategoryId] = useState('');

  // Keyboard Shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
        setIsCategoryModalOpen(false);
        setCategoryToDelete(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Product Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    price: 0,
    category: categories[0]?.name || '',
    categoryId: categories[0]?.id || '',
    stock: 0,
    minStock: 5,
    isService: false,
    isCombo: false,
    comboType: 'Fixed',
    isMonthlyFee: false,
    comboItems: [],
    configurableOptions: []
  });

  const generateAutoCode = (catId: string) => {
    const category = categories.find(c => c.id === catId);
    if (!category) return '';
    
    const catProducts = products.filter(p => p.categoryId === catId);
    const count = catProducts.length + 1;
    return `${category.prefix}${count.toString().padStart(3, '0')}`;
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      const nonComboCategories = categories.filter(c => c.name.toUpperCase() !== 'COMBOS');
      const defaultCatId = nonComboCategories[0]?.id || categories[0]?.id || '';
      const defaultCat = categories.find(c => c.id === defaultCatId);
      setFormData({
        name: '',
        price: 0,
        category: defaultCat?.name || '',
        categoryId: defaultCatId,
        code: generateAutoCode(defaultCatId),
        stock: 0,
        minStock: 5,
        isService: defaultCat ? defaultCat.managesStock === false : false,
        isCombo: false,
        comboType: 'Fixed',
        isMonthlyFee: false,
        comboItems: [],
        configurableOptions: [],
        availableForCombo: defaultCat ? defaultCat.managesStock !== false : true,
        comboDiscountPercentage: 0,
        comboStartDate: '',
        comboEndDate: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenComboModal = () => {
    setEditingProduct(null);
    setComboItemSearch('');
    
    let comboCat = categories.find(c => c.name.toUpperCase() === 'COMBOS' || c.prefix === 'CB');
    
    if (!comboCat) {
      comboCat = {
        id: `cat-combos-${Date.now()}`,
        name: 'COMBOS',
        prefix: 'CB',
        managesStock: false
      };
      onAddCategory(comboCat);
    }

    setFormData({
      name: '',
      price: 0,
      category: comboCat.name,
      categoryId: comboCat.id,
      code: generateAutoCode(comboCat.id),
      stock: 0,
      minStock: 0,
      isService: false,
      isCombo: true,
      comboType: 'Fixed',
      isMonthlyFee: false,
      comboItems: [],
      configurableOptions: [],
      comboDiscountPercentage: 10,
      comboStartDate: new Date().toISOString().split('T')[0],
      comboEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availableForCombo: false
    });
    setIsModalOpen(true);
  };

  const handleCategoryChange = (catId: string) => {
    const category = categories.find(c => c.id === catId);
    if (category) {
      setFormData({
        ...formData,
        categoryId: catId,
        category: category.name,
        code: generateAutoCode(catId),
        isService: category.managesStock === false,
        availableForCombo: category.managesStock !== false,
        isMonthlyFee: category.name.toLowerCase().includes('mensualidad') || category.name.toLowerCase().includes('pago')
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const productData = {
      ...formData,
      id: editingProduct?.id || `p-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    } as Product;

    if (editingProduct) onUpdateProduct(productData);
    else onAddProduct(productData);
    
    setIsModalOpen(false);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || !newCatPrefix) return;
    
    const catData: Category = {
      id: editingCategory?.id || `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newCatName,
      prefix: newCatPrefix.toUpperCase(),
      managesStock: newCatManagesStock
    };

    if (editingCategory) {
      onUpdateCategory(catData);
      setEditingCategory(null);
    } else {
      onAddCategory(catData);
    }
    
    setNewCatName('');
    setNewCatPrefix('');
    setNewCatManagesStock(true);
  };

  const handleEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setNewCatName(cat.name);
    setNewCatPrefix(cat.prefix);
    setNewCatManagesStock(cat.managesStock ?? true);
  };

  const confirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    setDeleteStep('action');
  };

  const executeCategoryAction = (action: 'delete' | 'move') => {
    if (!categoryToDelete) return;
    
    if (action === 'move' && !targetCategoryId) {
      setDeleteStep('move');
      return;
    }

    onDeleteCategory(categoryToDelete.id, action, targetCategoryId);
    setCategoryToDelete(null);
    setDeleteStep('confirm');
    setTargetCategoryId('');
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        data.forEach((item, index) => {
          const cat = categories.find(c => c.name.toLowerCase() === (item.Categoria || '').toLowerCase()) || categories[0];
          
          const newProduct: Product = {
            id: `p-import-${Date.now()}-${index}`,
            code: item.Codigo || generateAutoCode(cat.id),
            name: item.Nombre || 'Producto Importado',
            price: parseFloat(item.Precio) || 0,
            category: cat.name,
            categoryId: cat.id,
            stock: parseInt(item.Stock) || 0,
            minStock: parseInt(item.StockMinimo) || 5,
            isService: item.EsServicio === 'SI' || (cat && cat.managesStock === false),
            isCombo: item.EsCombo === 'SI',
            isMonthlyFee: item.EsMensualidad === 'SI' || (cat && cat.name.toLowerCase().includes('mensualidad')),
            availableForCombo: true,
            comboDiscountPercentage: parseInt(item.DescuentoCombo) || 0,
            comboStartDate: item.InicioCombo || '',
            comboEndDate: item.FinCombo || '',
          };
          onAddProduct(newProduct);
        });
        addNotification('Importación Exitosa', `Se han importado ${data.length} productos`, 'success');
      } catch (err) {
        addNotification('Error de Importación', 'No se pudo procesar el archivo Excel', 'error');
      }
    };
    reader.readAsBinaryString(file);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o código..."
            className="w-full pl-10 pr-4 py-3 bg-app-card border border-app rounded-xl focus:ring-2 focus:ring-app-primary transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-2 px-4 py-3 bg-app-card border border-app text-app-main font-bold rounded-xl hover:bg-app-main transition-all shadow-sm"
          >
            <Layers size={20} className="text-app-primary" />
            Categorías
          </button>
          <label className="flex items-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-700 font-bold rounded-xl hover:bg-emerald-100 transition-all shadow-sm cursor-pointer border border-emerald-100">
            <FileSpreadsheet size={20} />
            Importar Excel
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleExcelImport} />
          </label>
          <button 
            onClick={handleOpenComboModal}
            className="flex items-center gap-2 px-4 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
          >
            <Plus size={20} />
            Nuevo Combo
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-6 py-3 bg-app-primary text-white font-bold rounded-xl hover:bg-app-primary-hover transition-all shadow-lg shadow-app-primary/20"
          >
            <Plus size={20} />
            Nuevo Producto
          </button>
        </div>
      </div>

      <div className="bg-app-card rounded-2xl border border-app shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-app-main text-app-muted text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Imagen</th>
                <th className="px-6 py-4 font-bold">Código</th>
                <th className="px-6 py-4 font-bold">Producto</th>
                <th className="px-6 py-4 font-bold">Categoría</th>
                <th className="px-6 py-4 font-bold">Precio</th>
                <th className="px-6 py-4 font-bold">Stock</th>
                <th className="px-6 py-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y border-app">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-app-main transition-colors">
                  <td className="px-6 py-4">
                    <div className="w-10 h-10 bg-app-main rounded-lg flex items-center justify-center text-app-muted overflow-hidden">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={20} />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-app-muted">{product.code}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-app-main">{product.name}</span>
                      <div className="flex gap-1 mt-1">
                        {product.isCombo && <span className="text-[8px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-black uppercase">Combo</span>}
                        {product.isMonthlyFee && <span className="text-[8px] px-1.5 py-0.5 bg-app-primary-light text-app-primary rounded font-black uppercase">Mensualidad</span>}
                        {product.availableForCombo && <span className="text-[8px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-black uppercase">Ofertable</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium px-2 py-1 bg-app-main text-app-muted rounded-full uppercase">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-app-main">{formatCurrency(product.price)}</td>
                  <td className="px-6 py-4">
                    {product.isService ? (
                      <span className="text-xs text-app-muted">Servicio</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-sm font-bold",
                          product.stock < product.minStock ? "text-rose-500" : "text-app-main"
                        )}>
                          {product.stock}
                        </span>
                        {product.stock < product.minStock && (
                          <AlertCircle size={14} className="text-rose-500" />
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => handleOpenModal(product)}
                      className="p-2 text-app-muted hover:text-app-primary transition-all"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => onDeleteProduct(product.id)}
                      className="p-2 text-app-muted hover:text-rose-600 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Modal */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-app-card w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 bg-app-primary text-white flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Layers size={24} />
                  Gestión de Categorías
                </h3>
                <button onClick={() => setIsCategoryModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <form onSubmit={handleAddCategory} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-app-main rounded-2xl border border-app">
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-app-muted uppercase ml-1">Nombre</label>
                    <input 
                      required
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      placeholder="Ej: Abarrotes o Servicios"
                      className="w-full px-4 py-2 bg-app-card border border-app rounded-xl focus:ring-2 focus:ring-app-primary transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-app-muted uppercase ml-1">Prefijo</label>
                    <input 
                      required
                      maxLength={3}
                      value={newCatPrefix}
                      onChange={e => setNewCatPrefix(e.target.value)}
                      placeholder="Ej: AB"
                      className="w-full px-4 py-2 bg-app-card border border-app rounded-xl focus:ring-2 focus:ring-app-primary transition-all text-sm uppercase"
                    />
                  </div>
                  <div className="flex flex-col justify-center items-center">
                    <label className="text-[10px] font-bold text-app-muted uppercase mb-1">Tipo</label>
                    <button 
                      type="button"
                      onClick={() => setNewCatManagesStock(!newCatManagesStock)}
                      className={cn(
                        "w-full px-2 py-1 rounded-lg text-[10px] font-bold transition-all border",
                        newCatManagesStock 
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                          : "bg-amber-50 text-amber-600 border-amber-200"
                      )}
                    >
                      {newCatManagesStock ? 'FÍSICO' : 'INTANGIBLE'}
                    </button>
                  </div>
                  <button type="submit" className="md:col-span-4 py-3 bg-app-primary text-white font-bold rounded-xl hover:bg-app-primary-hover transition-all shadow-md">
                    {editingCategory ? 'Guardar Cambios' : 'Agregar Categoría'}
                  </button>
                  {editingCategory && (
                    <button 
                      type="button" 
                      onClick={() => {
                        setEditingCategory(null);
                        setNewCatName('');
                        setNewCatPrefix('');
                        setNewCatManagesStock(true);
                      }}
                      className="md:col-span-4 py-2 text-app-muted font-bold text-xs hover:underline"
                    >
                      Cancelar Edición
                    </button>
                  )}
                </form>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-4 bg-app-card border border-app rounded-2xl hover:border-app-primary transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-app-primary-light text-app-primary rounded-xl flex items-center justify-center font-black">
                          {cat.prefix}
                        </div>
                        <div>
                          <h4 className="font-bold text-app-main">{cat.name}</h4>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] text-app-muted uppercase tracking-widest">Prefijo: {cat.prefix}</p>
                            <span className={cn(
                              "text-[8px] font-black px-1 rounded uppercase",
                              cat.managesStock ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                            )}>
                              {cat.managesStock ? 'Con Stock' : 'Sin Stock'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleEditCategory(cat)}
                          className="p-2 text-app-muted hover:text-app-primary transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => setCategoryToDelete(cat)}
                          className="p-2 text-app-muted hover:text-rose-500 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-app-card w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 bg-app-primary text-white flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Package size={24} />
                  {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="relative group">
                        <div className="w-24 h-24 bg-app-main rounded-2xl flex items-center justify-center text-app-muted overflow-hidden border-2 border-dashed border-app group-hover:border-app-primary transition-all">
                          {formData.image ? (
                            <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={32} />
                          )}
                        </div>
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 cursor-pointer rounded-2xl transition-all">
                          <Upload size={20} />
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                        </label>
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-xs font-bold text-app-muted uppercase">Código de Barras</label>
                        <input 
                          required
                          value={formData.code}
                          onChange={e => setFormData({ ...formData, code: e.target.value })}
                          className="w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-app-muted uppercase">Nombre del Producto</label>
                      <input 
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-app-muted uppercase">Categoría</label>
                        <select 
                          disabled={formData.isCombo}
                          value={formData.categoryId}
                          onChange={e => handleCategoryChange(e.target.value)}
                          className={cn(
                            "w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all font-bold",
                            formData.isCombo && "opacity-70 cursor-not-allowed"
                          )}
                        >
                          {categories
                            .filter(cat => formData.isCombo ? true : cat.name.toUpperCase() !== 'COMBOS')
                            .map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-app-muted uppercase">Precio {formData.isCombo && '(Autocalculado)'}</label>
                        <input 
                          required
                          type="number"
                          step="0.01"
                          readOnly={formData.isCombo}
                          value={formData.price ?? ''}
                          onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                          className={cn(
                            "w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all font-bold",
                            formData.isCombo && "opacity-70 cursor-not-allowed"
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {categories.find(c => c.id === formData.categoryId)?.managesStock && !formData.isCombo && (
                      <div className="p-4 bg-app-main rounded-2xl border border-app space-y-4">
                        <h4 className="text-xs font-bold text-app-muted uppercase">Configuración de Stock</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-app-muted uppercase">Stock Actual</label>
                            <input 
                              type="number"
                              value={formData.stock ?? ''}
                              onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                              className="w-full px-4 py-2 bg-app-card border border-app rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-app-muted uppercase">Stock Mínimo</label>
                            <input 
                              type="number"
                              value={formData.minStock ?? ''}
                              onChange={e => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                              className="w-full px-4 py-2 bg-app-card border border-app rounded-xl focus:ring-2 focus:ring-app-primary transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.isCombo && (
                      <div className="p-4 bg-app-main rounded-2xl border border-app space-y-4">
                        <h4 className="text-xs font-bold text-app-muted uppercase">Configuración del Combo</h4>
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-app-muted uppercase">Tipo de Combo</label>
                            <div className="flex gap-2">
                              {['Fixed', 'Configurable'].map((type) => (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => setFormData({ 
                                    ...formData, 
                                    comboType: type as any,
                                    price: type === 'Configurable' ? 0 : formData.price // Reset price if configurable as it depends on selection
                                  })}
                                  className={cn(
                                    "flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all",
                                    formData.comboType === type 
                                      ? "bg-app-primary text-white border-app-primary shadow-sm" 
                                      : "bg-app-card text-app-muted border-app hover:bg-app-main"
                                  )}
                                >
                                  {type === 'Fixed' ? 'FIJO' : 'CONFIGURABLE'}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-app-muted uppercase">Inicio Oferta</label>
                              <input 
                                type="date"
                                value={formData.comboStartDate}
                                onChange={e => setFormData({ ...formData, comboStartDate: e.target.value })}
                                className="w-full px-3 py-2 bg-app-card border border-app rounded-xl text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-app-muted uppercase">Fin Oferta</label>
                              <input 
                                type="date"
                                value={formData.comboEndDate}
                                onChange={e => setFormData({ ...formData, comboEndDate: e.target.value })}
                                className="w-full px-3 py-2 bg-app-card border border-app rounded-xl text-xs"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-app-muted uppercase">Descuento (%)</label>
                            <input 
                              type="number"
                              min="0"
                              max="100"
                              value={formData.comboDiscountPercentage ?? ''}
                              onChange={e => {
                                const discount = parseInt(e.target.value) || 0;
                                const items = formData.comboItems || [];
                                const basePrice = items.reduce((acc, itemId) => {
                                  const item = products.find(prod => prod.id === itemId);
                                  return acc + (item?.price || 0);
                                }, 0);
                                const finalPrice = basePrice * (1 - discount / 100);
                                
                                setFormData({ 
                                  ...formData, 
                                  comboDiscountPercentage: discount,
                                  price: Number(finalPrice.toFixed(2))
                                });
                              }}
                              className="w-full px-3 py-2 bg-app-card border border-app rounded-xl text-xs font-bold"
                            />
                          </div>

                          {formData.comboType === 'Fixed' ? (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-app-muted uppercase">Productos en el Combo</label>
                                {formData.isCombo && (
                                  <span className="text-[10px] font-bold text-app-primary">
                                    Base: {formatCurrency((formData.comboItems || []).reduce((acc, id) => acc + (products.find(p => p.id === id)?.price || 0), 0))}
                                  </span>
                                )}
                              </div>
                              
                              <div className="relative mb-2">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-app-muted" size={14} />
                                <input 
                                  type="text"
                                  placeholder="Buscar producto para el combo..."
                                  value={comboItemSearch}
                                  onChange={(e) => setComboItemSearch(e.target.value)}
                                  className="w-full pl-8 pr-3 py-2 bg-app-card border border-app rounded-lg text-[10px] focus:ring-1 focus:ring-app-primary"
                                />
                              </div>

                              <div className="max-h-48 overflow-y-auto space-y-1 pr-2">
                                {products
                                  .filter(p => p.id !== editingProduct?.id && !p.isCombo)
                                  .filter(p => {
                                    const cat = categories.find(c => c.id === p.categoryId);
                                    return cat?.managesStock !== false;
                                  })
                                  .filter(p => p.name.toLowerCase().includes(comboItemSearch.toLowerCase()) || p.code.toLowerCase().includes(comboItemSearch.toLowerCase()))
                                  .map(p => (
                                  <label key={p.id} className="flex items-center gap-2 p-2 bg-app-card rounded-lg border border-app cursor-pointer hover:border-app-primary transition-all">
                                    <input 
                                      type="checkbox"
                                      checked={formData.comboItems?.includes(p.id)}
                                      onChange={(e) => {
                                        const items = formData.comboItems || [];
                                        let newItems;
                                        if (e.target.checked) {
                                          newItems = [...items, p.id];
                                        } else {
                                          newItems = items.filter(id => id !== p.id);
                                        }
                                        
                                        const basePrice = newItems.reduce((acc, itemId) => {
                                          const item = products.find(prod => prod.id === itemId);
                                          return acc + (item?.price || 0);
                                        }, 0);
                                        const discount = formData.comboDiscountPercentage || 0;
                                        const finalPrice = basePrice * (1 - discount / 100);
                                        
                                        setFormData({ 
                                          ...formData, 
                                          comboItems: newItems,
                                          price: Number(finalPrice.toFixed(2))
                                        });
                                      }}
                                      className="rounded text-app-primary focus:ring-app-primary"
                                    />
                                    <div className="flex-1">
                                      <div className="text-xs font-medium text-app-main">{p.name}</div>
                                      <div className="text-[10px] text-app-muted">
                                        {p.isService ? 'Servicio' : `Stock: ${p.stock}`}
                                      </div>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-app-muted uppercase">Reglas de Selección</label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const options = formData.configurableOptions || [];
                                    const firstTangibleCat = categories.find(c => c.managesStock !== false && c.name.toUpperCase() !== 'COMBOS');
                                    setFormData({
                                      ...formData,
                                      configurableOptions: [...options, { categoryId: firstTangibleCat?.id || categories[0]?.id || '', quantity: 1 }]
                                    });
                                  }}
                                  className="p-1 bg-app-primary text-white rounded-md hover:bg-app-primary/90 transition-colors"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                              
                              <div className="space-y-2">
                                {(formData.configurableOptions || []).map((option, idx) => (
                                  <div key={idx} className="flex items-center gap-2 p-2 bg-app-card rounded-xl border border-app">
                                    <select
                                      value={option.categoryId}
                                      onChange={(e) => {
                                        const newOptions = [...(formData.configurableOptions || [])];
                                        newOptions[idx].categoryId = e.target.value;
                                        setFormData({ ...formData, configurableOptions: newOptions });
                                      }}
                                      className="flex-1 bg-transparent border-none text-[10px] font-bold focus:ring-0"
                                    >
                                      <option value="all">Todas las Categorías</option>
                                      {categories
                                        .filter(cat => cat.managesStock !== false && cat.name.toUpperCase() !== 'COMBOS')
                                        .map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                      ))}
                                    </select>
                                    <div className="flex items-center gap-1 bg-app-main rounded-lg px-2 py-1">
                                      <span className="text-[10px] text-app-muted uppercase font-bold">Cant:</span>
                                      <input 
                                        type="number"
                                        min="1"
                                        value={option.quantity}
                                        onChange={(e) => {
                                          const newOptions = [...(formData.configurableOptions || [])];
                                          newOptions[idx].quantity = parseInt(e.target.value) || 1;
                                          setFormData({ ...formData, configurableOptions: newOptions });
                                        }}
                                        className="w-10 bg-transparent border-none text-[10px] font-bold text-center focus:ring-0"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newOptions = (formData.configurableOptions || []).filter((_, i) => i !== idx);
                                        setFormData({ ...formData, configurableOptions: newOptions });
                                      }}
                                      className="p-1 text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                ))}
                                {(!formData.configurableOptions || formData.configurableOptions.length === 0) && (
                                  <p className="text-[10px] text-app-muted text-center py-4 italic">No hay reglas definidas</p>
                                )}
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-app-muted uppercase">Precio Fijo del Combo (Opcional)</label>
                                <input 
                                  type="number"
                                  step="0.01"
                                  placeholder="Dejar en 0 para sumar productos"
                                  value={formData.price || ''}
                                  onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                  className="w-full px-4 py-2 bg-app-card border border-app rounded-xl focus:ring-2 focus:ring-app-primary transition-all text-xs"
                                />
                                <p className="text-[8px] text-app-muted">Si es 0, el precio se calculará según la selección en el POS.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {!formData.isCombo && !categories.find(c => c.id === formData.categoryId)?.managesStock && (
                      <div className="p-8 bg-app-main rounded-2xl border border-app border-dashed flex flex-col items-center justify-center text-center space-y-2">
                        <AlertCircle className="text-app-primary" size={32} />
                        <p className="text-sm font-bold text-app-main">Producto Intangible</p>
                        <p className="text-xs text-app-muted">Este producto no requiere control de inventario físico.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-app-main text-app-muted font-bold rounded-xl hover:bg-app-card transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-app-primary text-white font-bold rounded-xl hover:bg-app-primary-hover transition-all shadow-lg shadow-app-primary/20"
                  >
                    {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {/* Category Deletion Flow Modals */}
        {categoryToDelete && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-app-card w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 bg-rose-600 text-white flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <AlertCircle size={24} />
                  Eliminar Categoría
                </h3>
                <button onClick={() => setCategoryToDelete(null)} className="p-2 hover:bg-white/20 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                {deleteStep === 'confirm' && (
                  <>
                    <p className="text-app-main font-medium">
                      ¿Está seguro que desea eliminar la categoría <span className="font-black">"{categoryToDelete.name}"</span>?
                    </p>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setCategoryToDelete(null)}
                        className="flex-1 py-3 bg-app-main text-app-muted font-bold rounded-xl hover:bg-app-card transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={confirmDeleteCategory}
                        className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all"
                      >
                        Sí, Continuar
                      </button>
                    </div>
                  </>
                )}

                {deleteStep === 'action' && (
                  <>
                    <p className="text-app-main font-medium">
                      ¿Qué desea hacer con los productos de esta categoría?
                    </p>
                    <div className="space-y-3">
                      <button 
                        onClick={() => executeCategoryAction('delete')}
                        className="w-full py-4 bg-rose-50 text-rose-600 border border-rose-100 font-bold rounded-xl hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
                      >
                        <Trash2 size={18} />
                        Eliminar todos los productos
                      </button>
                      <button 
                        onClick={() => setDeleteStep('move')}
                        className="w-full py-4 bg-app-primary-light text-app-primary border border-app-primary/20 font-bold rounded-xl hover:bg-app-primary/10 transition-all flex items-center justify-center gap-2"
                      >
                        <Layers size={18} />
                        Pasar productos a otra categoría
                      </button>
                    </div>
                  </>
                )}

                {deleteStep === 'move' && (
                  <>
                    <p className="text-app-main font-medium">
                      Seleccione la categoría de destino:
                    </p>
                    <div className="space-y-4">
                      <select 
                        value={targetCategoryId}
                        onChange={e => setTargetCategoryId(e.target.value)}
                        className="w-full px-4 py-3 bg-app-main border-none rounded-xl focus:ring-2 focus:ring-app-primary transition-all font-bold"
                      >
                        <option value="">Seleccionar Categoría</option>
                        {categories.filter(c => c.id !== categoryToDelete.id).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      
                      <p className="text-[10px] text-app-muted uppercase font-bold text-center">O también puede</p>
                      
                      <button 
                        onClick={() => {
                          setIsCategoryModalOpen(true);
                          setCategoryToDelete(null);
                          setDeleteStep('confirm');
                        }}
                        className="w-full py-2 text-app-primary font-bold text-xs hover:underline"
                      >
                        + Crear una nueva categoría primero
                      </button>

                      <div className="flex gap-3 pt-2">
                        <button 
                          onClick={() => setDeleteStep('action')}
                          className="flex-1 py-3 bg-app-main text-app-muted font-bold rounded-xl hover:bg-app-card transition-all"
                        >
                          Atrás
                        </button>
                        <button 
                          disabled={!targetCategoryId}
                          onClick={() => executeCategoryAction('move')}
                          className="flex-1 py-3 bg-app-primary text-white font-bold rounded-xl hover:bg-app-primary-hover transition-all disabled:opacity-50"
                        >
                          Mover y Eliminar
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
