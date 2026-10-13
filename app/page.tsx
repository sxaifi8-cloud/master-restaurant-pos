"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  ShoppingBag, Printer, MapPin, User, Phone, Plus, Minus, 
  CheckCircle, Settings, PackagePlus, Utensils, Store, Trash2, 
  Users, Truck, Beef, Image as ImageIcon, Edit2, Save, Upload,
  Search, Menu, Banknote, Users2, Wallet, ShoppingCart, Edit,
  Moon, Sun, X, Calendar, ArrowUpRight, ArrowDownRight, Tag,
  ArrowDownLeft, Clock
} from "lucide-react";
import { format } from "date-fns";

const CURRENCIES = [
  { symbol: "$", label: "USD ($)" },
  { symbol: "Rs ", label: "PKR (Rs)" },
  { symbol: "£", label: "GBP (£)" },
  { symbol: "€", label: "EUR (€)" },
];

const DEFAULT_SETTINGS = { currency: "Rs ", logoUrl: "", deliveryFee: 0.00, storeName: "Master Restaurant", receiptSize: "80mm" };
const DEFAULT_MENU = [
  { id: "1", name: "Smash Burger", price: 899, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=300&fit=crop" },
  { id: "2", name: "Spicy Wrap", price: 749, image: "https://images.unsplash.com/photo-1626804475297-41607ea0d4eb?w=300&h=300&fit=crop" },
  { id: "3", name: "Large Fries", price: 350, image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=300&h=300&fit=crop" },
  { id: "4", name: "Coca-Cola", price: 200, image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&h=300&fit=crop" }
];
const DEFAULT_SALES = [
  { orderId: "INV-20261013-1001", date: "2026-10-13T10:00:00Z", customer: { name: "Ahmed Ali", phone: "0300-1112223", address: "DHA Phase 1" }, items: [{name: "Smash Burger", qty: 2, price: 899}], subtotal: 1798, deliveryFee: 0, discount: 0, total: 1798, currency: "Rs ", type: "Sale", recordedBy: "Staff 1" },
];
const DEFAULT_PURCHASES = [
  { orderId: "PO-20261013-2001", date: "2026-10-12T09:00:00Z", supplier: { name: "Fresh Farms Poultry", contact: "0311-9876543" }, items: [{name: "Chicken Breast (kg)", qty: 50, price: 450}], subtotal: 22500, total: 22500, currency: "Rs ", status: "Paid", recordedBy: "Admin" },
];

export default function DeliveryPOS() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [activeTab, setActiveTab] = useState<"pos" | "sales" | "catalog" | "purchases" | "customers" | "suppliers" | "ingredients" | "staff" | "expenses" | "settings">("pos");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  const isDark = theme === "dark";
  const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
  const textMain = isDark ? "text-slate-100" : "text-slate-900";
  const bgCard = isDark ? "bg-slate-900" : "bg-white";
  const borderCard = isDark ? "border-slate-800" : "border-slate-200";
  const bgInput = isDark ? "bg-slate-950" : "bg-slate-50";
  const textMuted = isDark ? "text-slate-400" : "text-slate-500";

  const [storeSettings, setStoreSettings] = useState(DEFAULT_SETTINGS);
  const [menuItems, setMenuItems] = useState(DEFAULT_MENU);
  const [salesHistory, setSalesHistory] = useState<any[]>(DEFAULT_SALES);
  const [purchasesHistory, setPurchasesHistory] = useState<any[]>(DEFAULT_PURCHASES);
  
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState({ ...storeSettings });

  const [searchQuery, setSearchQuery] = useState("");
  const [navZone, setNavZone] = useState<'inputs' | 'grid'>('inputs');
  const [focusedProductIndex, setFocusedProductIndex] = useState<number>(-1);
  
  const [salesSearchQuery, setSalesSearchQuery] = useState("");
  const [salesFilter, setSalesFilter] = useState<"today" | "yesterday" | "month" | "all">("all");
  const [focusedSaleIndex, setFocusedSaleIndex] = useState<number>(-1);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  const [purchaseSearchQuery, setPurchaseSearchQuery] = useState("");
  const [purchaseFilter, setPurchaseFilter] = useState<"today" | "yesterday" | "month" | "all">("all");
  const [focusedPurchaseIndex, setFocusedPurchaseIndex] = useState<number>(-1);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  
  const searchRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const checkoutRef = useRef<HTMLButtonElement>(null);
  const salesSearchRef = useRef<HTMLInputElement>(null);
  const purchaseSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);

    const savedData = localStorage.getItem("master_pos_data");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.menuItems && parsed.menuItems.length > 0) setMenuItems(parsed.menuItems);
        if (parsed.storeSettings) setStoreSettings(parsed.storeSettings);
        if (parsed.salesHistory) setSalesHistory(parsed.salesHistory);
        if (parsed.purchasesHistory) setPurchasesHistory(parsed.purchasesHistory);
      } catch (e) { console.error("Failed to parse local storage data."); }
    }
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("master_pos_data", JSON.stringify({ menuItems, storeSettings, salesHistory, purchasesHistory }));
    }
  }, [menuItems, storeSettings, salesHistory, purchasesHistory, mounted]);

  useEffect(() => {
    if (activeTab === 'pos') setTimeout(() => searchRef.current?.focus(), 100);
    if (activeTab === 'sales') setTimeout(() => salesSearchRef.current?.focus(), 100);
    if (activeTab === 'purchases') setTimeout(() => purchaseSearchRef.current?.focus(), 100);
  }, [activeTab]);

  const [cart, setCart] = useState<any[]>([]);
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
  const [lastOrder, setLastOrder] = useState<any>(null);

  const [newProd, setNewProd] = useState({ id: "", name: "", price: "", image: "" });
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const prodNameRef = useRef<HTMLInputElement>(null);
  const prodPriceRef = useRef<HTMLInputElement>(null);

  const filteredMenu = menuItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Safe Date Filtering (Fixes Next.js Build Hydration Error)
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const yesterdayStr = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");
  const currentMonthStr = format(new Date(), "yyyy-MM");

  const filteredSales = salesHistory.filter(sale => {
    const sDateStr = sale.date.split("T")[0];
    let dateMatch = true;
    if (salesFilter === "today") dateMatch = sDateStr === todayStr;
    if (salesFilter === "yesterday") dateMatch = sDateStr === yesterdayStr;
    if (salesFilter === "month") dateMatch = sale.date.startsWith(currentMonthStr);
    if (salesFilter === "all") dateMatch = true;
    
    const searchStr = `${sale.orderId} ${sale.customer.name} ${sale.customer.phone} ${sale.recordedBy}`.toLowerCase();
    const searchMatch = searchStr.includes(salesSearchQuery.toLowerCase());
    return dateMatch && searchMatch;
  });

  const totalSalesAmt = filteredSales.filter(s => s.type === "Sale").reduce((sum, s) => sum + s.total, 0);
  const totalReturnsAmt = filteredSales.filter(s => s.type === "Return").reduce((sum, s) => sum + s.total, 0);
  const totalDiscountAmt = filteredSales.reduce((sum, s) => sum + (s.discount || 0), 0);

  const filteredPurchases = purchasesHistory.filter(pur => {
    const pDateStr = pur.date.split("T")[0];
    let dateMatch = true;
    if (purchaseFilter === "today") dateMatch = pDateStr === todayStr;
    if (purchaseFilter === "yesterday") dateMatch = pDateStr === yesterdayStr;
    if (purchaseFilter === "month") dateMatch = pur.date.startsWith(currentMonthStr);
    if (purchaseFilter === "all") dateMatch = true;
    
    const searchStr = `${pur.orderId} ${pur.supplier.name} ${pur.supplier.contact} ${pur.recordedBy}`.toLowerCase();
    const searchMatch = searchStr.includes(purchaseSearchQuery.toLowerCase());
    return dateMatch && searchMatch;
  });

  const totalPurchasesAmt = filteredPurchases.reduce((sum, p) => sum + p.total, 0);
  const totalPendingAmt = filteredPurchases.filter(p => p.status === "Pending").reduce((sum, p) => sum + p.total, 0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'b') { e.preventDefault(); setIsSidebarOpen(prev => !prev); return; }
      if (e.key === 'F2') { e.preventDefault(); setActiveTab('pos'); return; }
      if (e.key === 'F3') { e.preventDefault(); setActiveTab('sales'); return; }
      if (e.key === 'F4') { e.preventDefault(); setActiveTab('catalog'); return; }
      if (e.key === 'F8') { e.preventDefault(); setActiveTab('settings'); return; }

      if (selectedReceipt) {
        if (e.key === 'Escape') { e.preventDefault(); setSelectedReceipt(null); }
        if (e.key === 'p' && e.ctrlKey) { e.preventDefault(); setTimeout(() => window.print(), 100); }
        return; 
      }
      if (selectedPurchase) {
        if (e.key === 'Escape') { e.preventDefault(); setSelectedPurchase(null); }
        if (e.key === 'p' && e.ctrlKey) { e.preventDefault(); setTimeout(() => window.print(), 100); }
        return; 
      }

      if (activeTab === "sales") {
        const isInputFocused = document.activeElement?.tagName === 'INPUT';
        if (e.key === 'ArrowDown' && !isInputFocused) { e.preventDefault(); setFocusedSaleIndex(p => Math.min(p + 1, filteredSales.length - 1)); }
        if (e.key === 'ArrowUp' && !isInputFocused) { e.preventDefault(); setFocusedSaleIndex(p => Math.max(p - 1, 0)); }
        if (e.key === 'Enter' && focusedSaleIndex >= 0 && filteredSales[focusedSaleIndex] && !isInputFocused) {
          e.preventDefault(); setSelectedReceipt(filteredSales[focusedSaleIndex]);
        }
        if (e.key === 'Escape') { setFocusedSaleIndex(-1); salesSearchRef.current?.blur(); }
        return;
      }

      if (activeTab === "purchases") {
        const isInputFocused = document.activeElement?.tagName === 'INPUT';
        if (e.key === 'ArrowDown' && !isInputFocused) { e.preventDefault(); setFocusedPurchaseIndex(p => Math.min(p + 1, filteredPurchases.length - 1)); }
        if (e.key === 'ArrowUp' && !isInputFocused) { e.preventDefault(); setFocusedPurchaseIndex(p => Math.max(p - 1, 0)); }
        if (e.key === 'Enter' && focusedPurchaseIndex >= 0 && filteredPurchases[focusedPurchaseIndex] && !isInputFocused) {
          e.preventDefault(); setSelectedPurchase(filteredPurchases[focusedPurchaseIndex]);
        }
        if (e.key === 'Escape') { setFocusedPurchaseIndex(-1); purchaseSearchRef.current?.blur(); }
        return;
      }

      if (activeTab === "pos") {
        if (e.altKey && e.key.toLowerCase() === 'f') { e.preventDefault(); setNavZone('inputs'); setFocusedProductIndex(-1); searchRef.current?.focus(); return; }
        if (e.altKey && e.key.toLowerCase() === 'c') { e.preventDefault(); handleCheckout(); return; }
        if (navZone === 'grid') {
          if (e.key === 'ArrowRight') { e.preventDefault(); setFocusedProductIndex(p => Math.min(p + 1, filteredMenu.length - 1)); }
          if (e.key === 'ArrowLeft') { e.preventDefault(); setFocusedProductIndex(p => Math.max(p - 1, 0)); }
          if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedProductIndex(p => Math.min(p + 4, filteredMenu.length - 1)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); if (focusedProductIndex - 4 < 0) { setNavZone('inputs'); setFocusedProductIndex(-1); searchRef.current?.focus(); } else { setFocusedProductIndex(p => Math.max(p - 4, 0)); } }
          if (e.key === 'Enter') { e.preventDefault(); if (filteredMenu[focusedProductIndex]) addToCart(filteredMenu[focusedProductIndex]); }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery, menuItems, cart, customer, storeSettings, activeTab, focusedProductIndex, filteredMenu, navZone, focusedSaleIndex, filteredSales, selectedReceipt, focusedPurchaseIndex, filteredPurchases, selectedPurchase]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) { const reader = new FileReader(); reader.onloadend = () => setter(reader.result as string); reader.readAsDataURL(file); }
  };

  const addToCart = (item: any) => setCart((prev) => prev.find((i) => i.id === item.id) ? prev.map((i) => i.id === item.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...item, qty: 1 }]);
  const updateQty = (id: string, delta: number) => setCart((prev) => prev.map((i) => i.id === id ? { ...i, qty: i.qty + delta } : i).filter((i) => i.qty > 0));

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = subtotal + storeSettings.deliveryFee;

  const handleCheckout = () => {
    if (cart.length === 0 || !customer.address || !customer.phone) return alert("Please add items and complete customer details.");
    const orderData = {
      orderId: `INV-${format(new Date(), "yyyyMMdd")}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString(), customer: { ...customer }, items: [...cart], subtotal, deliveryFee: storeSettings.deliveryFee, discount: 0, total, currency: storeSettings.currency,
      type: "Sale", recordedBy: "Staff Member"
    };
    setLastOrder(orderData); setSalesHistory([orderData, ...salesHistory]); setCart([]); setCustomer({ name: "", phone: "", address: "" });
    setNavZone('inputs'); setFocusedProductIndex(-1); searchRef.current?.focus(); 
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.name || !newProd.price) return;
    if (isEditingProduct) { setMenuItems(menuItems.map(item => item.id === newProd.id ? { ...item, name: newProd.name, price: parseFloat(newProd.price), image: newProd.image } : item)); setIsEditingProduct(false); } 
    else { setMenuItems([...menuItems, { id: Date.now().toString(), name: newProd.name, price: parseFloat(newProd.price), image: newProd.image }]); }
    setNewProd({ id: "", name: "", price: "", image: "" }); prodNameRef.current?.focus();
  };

  const editProduct = (item: any) => { setNewProd({ id: item.id, name: item.name, price: item.price.toString(), image: item.image }); setIsEditingProduct(true); prodNameRef.current?.focus(); };
  const deleteProduct = (id: string) => { if(confirm("Are you sure you want to delete this product?")) setMenuItems(menuItems.filter(item => item.id !== id)); };
  const saveSettings = () => { setStoreSettings(tempSettings); setIsEditingSettings(false); };
  const printReceipt = () => setTimeout(() => window.print(), 100); 

  return (
    <div className={`min-h-screen ${bgMain} flex font-sans ${textMain} transition-colors duration-300`}>
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-slate-300 flex flex-col hidden md:flex shrink-0 transition-all duration-300 relative z-20 shadow-xl`}>
        <div className="p-4 flex items-center justify-between border-b border-slate-800 h-16">
          {isSidebarOpen && <span className="font-bold text-lg text-white truncate flex items-center gap-2"><Store className="h-5 w-5 text-orange-500 shrink-0" /> Master POS</span>}
          {!isSidebarOpen && <Store className="h-6 w-6 text-orange-500 mx-auto" />}
        </div>
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto overflow-x-hidden px-2 scrollbar-hide">
          <p className={`text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-2 px-2 ${!isSidebarOpen && 'hidden'}`}>Terminal</p>
          <button onClick={() => setActiveTab("pos")} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition ${activeTab === "pos" ? "bg-orange-600 text-white" : "hover:bg-slate-800 hover:text-white"}`}>
            <div className="flex items-center gap-3"><ShoppingBag className="h-5 w-5 shrink-0" /> {isSidebarOpen && "Delivery POS"}</div>
            {isSidebarOpen && <span className="text-[10px] bg-black/20 text-white/70 px-1.5 py-0.5 rounded">F2</span>}
          </button>
          
          <p className={`text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-4 px-2 ${!isSidebarOpen && 'hidden'}`}>Financials</p>
          <button onClick={() => setActiveTab("sales")} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition ${activeTab === "sales" ? "bg-slate-800 text-white" : "hover:bg-slate-800 hover:text-white"}`}>
            <div className="flex items-center gap-3"><Banknote className="h-5 w-5 shrink-0" /> {isSidebarOpen && "Sales"}</div>
            {isSidebarOpen && <span className="text-[10px] bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded">F3</span>}
          </button>
          <button onClick={() => setActiveTab("purchases")} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition ${activeTab === "purchases" ? "bg-slate-800 text-white" : "hover:bg-slate-800 hover:text-white"}`}>
            <div className="flex items-center gap-3"><ShoppingCart className="h-5 w-5 shrink-0" /> {isSidebarOpen && "Purchases"}</div>
          </button>

          <p className={`text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-4 px-2 ${!isSidebarOpen && 'hidden'}`}>Management</p>
          <button onClick={() => setActiveTab("catalog")} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition ${activeTab === "catalog" ? "bg-slate-800 text-white" : "hover:bg-slate-800 hover:text-white"}`}>
            <div className="flex items-center gap-3"><Utensils className="h-5 w-5 shrink-0" /> {isSidebarOpen && "Catalog"}</div>
            {isSidebarOpen && <span className="text-[10px] bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded">F4</span>}
          </button>
          
          <p className={`text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-4 px-2 ${!isSidebarOpen && 'hidden'}`}>System</p>
          <button onClick={() => { setActiveTab("settings"); setTempSettings({...storeSettings}); setIsEditingSettings(false); }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition ${activeTab === "settings" ? "bg-slate-800 text-white" : "hover:bg-slate-800 hover:text-white"}`}>
            <div className="flex items-center gap-3"><Settings className="h-5 w-5 shrink-0" /> {isSidebarOpen && "Settings"}</div>
            {isSidebarOpen && <span className="text-[10px] bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded">F8</span>}
          </button>
        </nav>
        
        <div className="mt-auto p-4 border-t border-slate-800 text-center bg-slate-950">
          <p className={`text-[9px] text-slate-500 uppercase tracking-widest leading-relaxed ${!isSidebarOpen && 'hidden'}`}>Powered By<br/><span className="text-orange-500 font-bold text-[10px]">Xaifi Digital Marketing Agency</span></p>
          {!isSidebarOpen && <p className="text-[9px] text-orange-500 font-bold tracking-widest mx-auto" style={{writingMode: 'vertical-rl', transform: 'rotate(180deg)'}}>XAIFI DIGITAL</p>}
        </div>
      </aside>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 text-white flex justify-between p-2 z-50 border-t border-slate-800 overflow-x-auto gap-2">
        {[ { id: "pos", icon: ShoppingBag, label: "POS" }, { id: "sales", icon: Banknote, label: "Sales" }, { id: "purchases", icon: ShoppingCart, label: "Purchases" }, { id: "settings", icon: Settings, label: "Setup" } ].map((item) => (
          <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex flex-col items-center p-2 min-w-[64px] rounded-lg ${activeTab === item.id ? "bg-slate-800 text-orange-500" : "text-slate-400"}`}>
            <item.icon className="h-5 w-5" /> <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      <main className="flex-1 flex flex-col h-screen overflow-hidden pb-16 md:pb-0 relative z-10">
        <header className={`h-16 ${bgCard} border-b ${borderCard} flex items-center justify-between px-4 shrink-0 shadow-sm hidden md:flex transition-colors`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'} transition`} title="Ctrl + B">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-bold text-lg capitalize flex items-center">
              {activeTab.replace('-', ' ')}
              {activeTab === 'pos' && <span className="ml-3 text-xs font-semibold px-2 py-0.5 rounded bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">F2</span>}
              {activeTab === 'sales' && <span className="ml-3 text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">F3</span>}
              {activeTab === 'catalog' && <span className="ml-3 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">F4</span>}
              {activeTab === 'settings' && <span className="ml-3 text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">F8</span>}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {activeTab === "pos" && (
              <div className={`hidden lg:flex items-center gap-2 text-[11px] font-semibold ${textMuted}`}>
                <span className={`px-2 py-1 rounded border ${borderCard}`}>Alt+F: Search</span>
                <span className={`px-2 py-1 rounded border ${borderCard}`}>Alt+C: Checkout</span>
                <span className={`px-2 py-1 rounded border ${borderCard}`}>Ctrl+B: Sidebar</span>
                <span className={`px-2 py-1 rounded border ${borderCard}`}>Enter/Arrows: Navigate</span>
              </div>
            )}
            {["sales", "purchases"].includes(activeTab) && (
              <div className={`hidden lg:flex items-center gap-2 text-[11px] font-semibold ${textMuted}`}>
                <span className={`px-2 py-1 rounded border ${borderCard}`}>Arrows: Navigate Grid</span>
                <span className={`px-2 py-1 rounded border ${borderCard}`}>Enter: View Details</span>
              </div>
            )}
            <button onClick={() => setTheme(isDark ? "light" : "dark")} className={`p-2 rounded-full ${isDark ? 'bg-slate-800 text-orange-400' : 'bg-slate-100 text-slate-600'} transition-colors ml-2`}>
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </header>

        {activeTab === "pos" && (
          <div className="flex-1 flex flex-col lg:flex-row p-3 gap-4 overflow-hidden">
            <div className={`flex-1 flex flex-col gap-3 overflow-hidden ${bgCard} rounded-xl shadow-sm border ${borderCard} p-4`}>
              <div className="relative w-full max-w-2xl mx-auto shrink-0 mb-2">
                <Search className={`absolute left-3 top-2.5 h-5 w-5 ${textMuted}`} />
                <input 
                  ref={searchRef} type="text" placeholder="Search Menu (Alt+F)..." value={searchQuery} 
                  onChange={(e) => { setSearchQuery(e.target.value); setFocusedProductIndex(-1); setNavZone('inputs'); }} 
                  onKeyDown={(e) => { 
                    if (e.key === 'ArrowRight') { e.preventDefault(); nameRef.current?.focus(); } 
                    else if (e.key === 'ArrowDown') { e.preventDefault(); searchRef.current?.blur(); setNavZone('grid'); if (filteredMenu.length > 0) setFocusedProductIndex(0); } 
                  }}
                  className={`w-full pl-10 p-2.5 border ${borderCard} rounded-xl ${bgInput} ${textMain} text-sm focus:border-orange-500 outline-none shadow-inner transition-colors`} 
                />
              </div>
              
              <div className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 pb-4 overflow-y-auto content-start px-1">
                {filteredMenu.map((item, index) => {
                  const isFocused = navZone === 'grid' && focusedProductIndex === index;
                  return (
                    <button 
                      key={item.id} onClick={() => { addToCart(item); setNavZone('grid'); setFocusedProductIndex(index); }} 
                      className={`text-left transition-all duration-200 flex flex-col overflow-hidden group rounded-xl relative ${isFocused ? 'border-2 border-orange-500 shadow-[0_4px_15px_rgba(249,115,22,0.3)] scale-[1.03] z-10' : `border ${borderCard}${isDark ? 'bg-slate-800' : 'bg-white'} hover:border-orange-400`}`}
                    >
                      <div className="aspect-square w-full relative overflow-hidden bg-slate-200 dark:bg-slate-900">
                        {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" /> : <div className="flex items-center justify-center h-full text-slate-400"><ImageIcon className="h-8 w-8" /></div>}
                        <div className="absolute top-2 right-2 bg-orange-500 text-white rounded-full p-1 shadow-md opacity-90 group-hover:opacity-100 group-hover:scale-110 transition z-10"><Plus className="h-4 w-4" /></div>
                      </div>
                      <div className={`p-2.5 flex flex-col justify-between flex-1 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                        <p className="font-semibold text-xs sm:text-sm line-clamp-2 leading-tight">{item.name}</p>
                        <p className="text-orange-500 font-bold mt-1 text-sm">{storeSettings.currency}{item.price.toFixed(0)}</p>
                      </div>
                    </button>
                  )
                })}
                {filteredMenu.length === 0 && <p className="col-span-full text-center mt-10 opacity-50">No items found.</p>}
              </div>
            </div>

            <div className={`w-full lg:w-[340px] xl:w-[400px] ${bgCard} rounded-xl shadow-sm border ${borderCard} flex flex-col shrink-0 overflow-hidden`}>
              <div className={`p-3 border-b ${borderCard} flex justify-between items-center bg-orange-500/10`}>
                <h2 className="font-bold text-sm flex items-center gap-2 text-orange-600 dark:text-orange-500"><ShoppingBag className="h-4 w-4"/> Order Ticket</h2>
                {lastOrder && <button onClick={printReceipt} className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-slate-700"><Printer className="h-3 w-3" /> Print Last</button>}
              </div>

              <div className={`p-3 border-b ${borderCard} space-y-2.5 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-semibold uppercase tracking-wide ${textMuted}`}>Delivery Details</span>
                  <span className={`text-[10px] font-medium ${textMuted}`}>{mounted && currentTime ? format(currentTime, "HH:mm | dd MMM") : "..."}</span>
                </div>
                <div className="relative"><User className={`absolute left-3 top-2 h-4 w-4 ${textMuted}`} /><input ref={nameRef} type="text" placeholder="Customer Name" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} onKeyDown={(e) => { if(e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); phoneRef.current?.focus(); } if(e.key === 'ArrowUp') { e.preventDefault(); searchRef.current?.focus(); } }} className={`w-full pl-9 p-1.5 border ${borderCard} rounded-lg ${bgInput} ${textMain} text-sm focus:border-orange-500 outline-none`} /></div>
                <div className="relative"><Phone className={`absolute left-3 top-2 h-4 w-4 ${textMuted}`} /><input ref={phoneRef} type="tel" placeholder="Phone Number" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} onKeyDown={(e) => { if(e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); addressRef.current?.focus(); } if(e.key === 'ArrowUp') { e.preventDefault(); nameRef.current?.focus(); } }} className={`w-full pl-9 p-1.5 border ${borderCard} rounded-lg ${bgInput} ${textMain} text-sm focus:border-orange-500 outline-none`} /></div>
                <div className="relative"><MapPin className={`absolute left-3 top-2 h-4 w-4 ${textMuted}`} /><input ref={addressRef} type="text" placeholder="Delivery Address" value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} onKeyDown={(e) => { if(e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); checkoutRef.current?.focus(); } if(e.key === 'ArrowUp') { e.preventDefault(); phoneRef.current?.focus(); } }} className={`w-full pl-9 p-1.5 border ${borderCard} rounded-lg ${bgInput} ${textMain} text-sm focus:border-orange-500 outline-none`} /></div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {cart.map((item) => (
                  <div key={item.id} className={`flex justify-between items-center ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'} p-2 rounded-lg border`}>
                    <div className="flex-1 pr-2">
                      <p className="font-semibold text-xs sm:text-sm line-clamp-1">{item.name}</p>
                      <p className={`text-[11px] font-medium ${textMuted}`}>{storeSettings.currency}{item.price.toFixed(2)}</p>
                    </div>
                    <div className={`flex items-center gap-2 border ${borderCard} rounded-lg p-1 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                      <button onClick={() => updateQty(item.id, -1)} className={`p-1 rounded ${isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}><Minus className="h-3 w-3"/></button>
                      <span className="w-4 text-center font-bold text-xs sm:text-sm">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className={`p-1 rounded ${isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}><Plus className="h-3 w-3"/></button>
                    </div>
                  </div>
                ))}
                {cart.length === 0 && <div className={`text-center mt-10 ${textMuted} flex flex-col items-center`}><ShoppingCart className="h-8 w-8 mb-2 opacity-20"/><p className="text-sm">Cart is empty</p></div>}
              </div>

              <div className={`p-4 border-t ${borderCard} ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
                <div className="space-y-1.5 text-xs md:text-sm mb-3">
                  <div className={`flex justify-between ${textMuted}`}><span>Subtotal</span><span className={textMain}>{storeSettings.currency}{subtotal.toFixed(2)}</span></div>
                  <div className={`flex justify-between ${textMuted}`}><span>Delivery Fee</span><span className={textMain}>{storeSettings.currency}{storeSettings.deliveryFee.toFixed(2)}</span></div>
                  <div className={`flex justify-between font-bold text-lg pt-2 border-t ${borderCard}`}><span>Total</span><span className="text-orange-500">{storeSettings.currency}{total.toFixed(2)}</span></div>
                </div>
                <button 
                  ref={checkoutRef} onClick={handleCheckout} onKeyDown={(e) => { if (e.key === 'ArrowUp') { e.preventDefault(); addressRef.current?.focus(); } }}
                  className="w-full text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 shadow-lg transition-all duration-200 bg-orange-600 hover:bg-orange-500 active:scale-95 focus:ring-4 focus:ring-orange-500/50 outline-none"
                >
                  <CheckCircle className="h-5 w-5"/> Place Order <span className="hidden xl:inline text-orange-200 font-normal text-xs">(Alt+C)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "sales" && (
          <div className="flex-1 flex flex-col p-4 md:p-6 gap-4 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
              <div className={`p-4 rounded-xl border ${borderCard} ${bgCard} shadow-sm flex flex-col justify-center relative overflow-hidden`}>
                <div className="absolute right-[-10px] top-[-10px] opacity-5 text-emerald-500"><ArrowUpRight className="h-32 w-32" /></div>
                <p className={`text-sm font-semibold ${textMuted} mb-1 uppercase tracking-wider`}>Total Sales</p>
                <h3 className="text-3xl font-bold text-emerald-500">{storeSettings.currency}{totalSalesAmt.toLocaleString()}</h3>
              </div>
              <div className={`p-4 rounded-xl border ${borderCard} ${bgCard} shadow-sm flex flex-col justify-center relative overflow-hidden`}>
                <div className="absolute right-[-10px] top-[-10px] opacity-5 text-red-500"><ArrowDownRight className="h-32 w-32" /></div>
                <p className={`text-sm font-semibold ${textMuted} mb-1 uppercase tracking-wider`}>Sales Returns</p>
                <h3 className="text-3xl font-bold text-red-500">{storeSettings.currency}{totalReturnsAmt.toLocaleString()}</h3>
              </div>
              <div className={`p-4 rounded-xl border ${borderCard} ${bgCard} shadow-sm flex flex-col justify-center relative overflow-hidden`}>
                <div className="absolute right-[-10px] top-[-10px] opacity-5 text-orange-500"><Tag className="h-32 w-32" /></div>
                <p className={`text-sm font-semibold ${textMuted} mb-1 uppercase tracking-wider`}>Discounts Given</p>
                <h3 className="text-3xl font-bold text-orange-500">{storeSettings.currency}{totalDiscountAmt.toLocaleString()}</h3>
              </div>
            </div>

            <div className={`flex flex-col sm:flex-row gap-3 shrink-0 p-3 rounded-xl border ${borderCard} ${bgCard} shadow-sm`}>
              <div className="relative flex-1">
                <Search className={`absolute left-3 top-2.5 h-4 w-4 ${textMuted}`} />
                <input 
                  ref={salesSearchRef} type="text" placeholder="Search by Invoice, Name, Phone, or Staff..." value={salesSearchQuery} 
                  onChange={(e) => { setSalesSearchQuery(e.target.value); setFocusedSaleIndex(-1); }}
                  onKeyDown={(e) => { if(e.key === 'ArrowDown') { e.preventDefault(); setFocusedSaleIndex(0); salesSearchRef.current?.blur(); } }}
                  className={`w-full pl-9 p-2 border ${borderCard} rounded-lg ${bgInput} ${textMain} text-sm focus:border-orange-500 outline-none`} 
                />
              </div>
              <div className="relative w-full sm:w-48">
                <Calendar className={`absolute left-3 top-2.5 h-4 w-4 ${textMuted}`} />
                <select 
                  value={salesFilter} onChange={(e) => { setSalesFilter(e.target.value as any); setFocusedSaleIndex(-1); }}
                  className={`w-full pl-9 p-2 border ${borderCard} rounded-lg ${bgInput} ${textMain} text-sm focus:border-orange-500 outline-none appearance-none`}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>

            <div className={`flex-1 rounded-xl border ${borderCard} ${bgCard} shadow-sm overflow-hidden flex flex-col relative`}>
              <div className="overflow-x-auto overflow-y-auto flex-1">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className={`sticky top-0 z-10 ${isDark ? 'bg-slate-900' : 'bg-slate-100'} ${textMuted} text-[11px] uppercase tracking-wider border-b ${borderCard} shadow-sm`}>
                    <tr>
                      <th className="px-4 py-3 font-semibold">Invoice #</th>
                      <th className="px-4 py-3 font-semibold">Date & Time</th>
                      <th className="px-4 py-3 font-semibold">Customer Details</th>
                      <th className="px-4 py-3 font-semibold">Recorded By</th>
                      <th className="px-4 py-3 font-semibold">Type</th>
                      <th className="px-4 py-3 font-semibold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
                    {filteredSales.map((sale, index) => {
                      const isFocused = focusedSaleIndex === index;
                      const isReturn = sale.type === "Return";
                      return (
                        <tr 
                          key={sale.orderId} onClick={() => setSelectedReceipt(sale)}
                          className={`cursor-pointer transition-colors ${isFocused ? (isDark ? 'bg-orange-500/20' : 'bg-orange-50') : (isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50')}`}
                        >
                          <td className="px-4 py-3 font-mono font-medium text-xs">{sale.orderId}</td>
                          <td className={`px-4 py-3 ${textMuted}`}>{format(new Date(sale.date), "dd MMM yyyy, HH:mm")}</td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-sm">{sale.customer.name}</p>
                            <p className={`text-xs ${textMuted}`}>{sale.customer.phone} • {sale.customer.address}</p>
                          </td>
                          <td className={`px-4 py-3 ${textMuted}`}>{sale.recordedBy}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isReturn ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>{sale.type}</span>
                          </td>
                          <td className={`px-4 py-3 text-right font-bold ${isReturn ? 'text-red-500' : 'text-emerald-500'}`}>
                            {isReturn ? "-" : ""}{sale.currency}{sale.total.toLocaleString(undefined, {minimumFractionDigits: 2})}
                          </td>
                        </tr>
                      )
                    })}
                    {filteredSales.length === 0 && (<tr><td colSpan={6} className={`px-4 py-10 text-center ${textMuted}`}>No records found.</td></tr>)}
                  </tbody>
                </table>
              </div>
              <div className={`p-2 border-t ${borderCard} ${bgInput} text-center text-[10px] ${textMuted}`}>
                Use <kbd className="border rounded px-1.5 py-0.5 mx-1">↑</kbd> <kbd className="border rounded px-1.5 py-0.5 mx-1">↓</kbd> to navigate, and <kbd className="border rounded px-1.5 py-0.5 mx-1">Enter</kbd> to view receipt.
              </div>
            </div>
            
            {selectedReceipt && (
              <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className={`relative w-full max-w-md ${bgCard} border ${borderCard} rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-full`}>
                  <button onClick={() => setSelectedReceipt(null)} className="absolute top-4 right-4 p-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded-full transition z-10"><X className="h-4 w-4" /></button>
                  <div className={`p-6 border-b ${borderCard} bg-slate-100 dark:bg-slate-950 text-center`}>
                    <h2 className="font-bold text-xl uppercase tracking-wider">{storeSettings.storeName}</h2>
                    <p className={`text-xs mt-1 ${textMuted}`}>Invoice Details • Press ESC to close</p>
                  </div>
                  <div className="p-6 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><p className={`text-[10px] uppercase font-bold ${textMuted}`}>Invoice Number</p><p className="font-mono font-medium">{selectedReceipt.orderId}</p></div>
                      <div><p className={`text-[10px] uppercase font-bold ${textMuted}`}>Date & Time</p><p>{format(new Date(selectedReceipt.date), "dd MMM yyyy, HH:mm")}</p></div>
                      <div><p className={`text-[10px] uppercase font-bold ${textMuted}`}>Customer</p><p className="font-semibold">{selectedReceipt.customer.name}</p></div>
                      <div><p className={`text-[10px] uppercase font-bold ${textMuted}`}>Contact</p><p>{selectedReceipt.customer.phone}</p></div>
                      <div className="col-span-2"><p className={`text-[10px] uppercase font-bold ${textMuted}`}>Address</p><p>{selectedReceipt.customer.address || "N/A"}</p></div>
                    </div>
                    <div className={`border-t border-b ${borderCard} py-3`}>
                      <p className={`text-[10px] uppercase font-bold ${textMuted} mb-2`}>Order Items</p>
                      <table className="w-full text-sm">
                        <tbody>
                          {selectedReceipt.items.map((item: any, i: number) => (
                            <tr key={i} className="border-b border-dashed border-slate-200 dark:border-slate-800 last:border-0">
                              <td className={`py-1.5 w-8 font-semibold ${textMuted}`}>{item.qty}x</td>
                              <td className="py-1.5 font-medium">{item.name}</td>
                              <td className="py-1.5 text-right whitespace-nowrap">{selectedReceipt.currency}{(item.price * item.qty).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className={`flex justify-between ${textMuted}`}><span>Subtotal</span><span>{selectedReceipt.currency}{selectedReceipt.subtotal.toFixed(2)}</span></div>
                      <div className={`flex justify-between ${textMuted}`}><span>Delivery Fee</span><span>{selectedReceipt.currency}{selectedReceipt.deliveryFee.toFixed(2)}</span></div>
                      {selectedReceipt.discount > 0 && <div className={`flex justify-between text-orange-500`}><span>Discount</span><span>-{selectedReceipt.currency}{selectedReceipt.discount.toFixed(2)}</span></div>}
                      <div className={`flex justify-between font-bold text-xl pt-2 mt-2 border-t ${borderCard} ${selectedReceipt.type === "Return" ? 'text-red-500' : 'text-emerald-500'}`}>
                        <span>{selectedReceipt.type === "Return" ? "REFUND TOTAL" : "TOTAL"}</span>
                        <span>{selectedReceipt.currency}{selectedReceipt.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`p-4 border-t ${borderCard} ${bgInput} flex justify-between gap-3`}>
                    <button onClick={() => setSelectedReceipt(null)} className={`flex-1 py-2 rounded-lg font-semibold text-sm border ${borderCard} hover:bg-slate-200 dark:hover:bg-slate-800 transition`}>Close</button>
                    <button onClick={() => setTimeout(() => window.print(), 100)} className="flex-1 py-2 rounded-lg font-semibold text-sm bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition flex items-center justify-center gap-2"><Printer className="h-4 w-4" /> Print Copy</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "purchases" && (
          <div className="flex-1 flex flex-col p-4 md:p-6 gap-4 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
              <div className={`p-4 rounded-xl border ${borderCard} ${bgCard} shadow-sm flex flex-col justify-center relative overflow-hidden`}>
                <div className="absolute right-[-10px] top-[-10px] opacity-5 text-blue-500"><ArrowDownLeft className="h-32 w-32" /></div>
                <p className={`text-sm font-semibold ${textMuted} mb-1 uppercase tracking-wider`}>Total Purchases</p>
                <h3 className="text-3xl font-bold text-blue-500">{storeSettings.currency}{totalPurchasesAmt.toLocaleString()}</h3>
              </div>
              <div className={`p-4 rounded-xl border ${borderCard} ${bgCard} shadow-sm flex flex-col justify-center relative overflow-hidden`}>
                <div className="absolute right-[-10px] top-[-10px] opacity-5 text-orange-500"><Clock className="h-32 w-32" /></div>
                <p className={`text-sm font-semibold ${textMuted} mb-1 uppercase tracking-wider`}>Outstanding Payables</p>
                <h3 className="text-3xl font-bold text-orange-500">{storeSettings.currency}{totalPendingAmt.toLocaleString()}</h3>
              </div>
            </div>

            <div className={`flex flex-col sm:flex-row gap-3 shrink-0 p-3 rounded-xl border ${borderCard} ${bgCard} shadow-sm`}>
              <div className="relative flex-1">
                <Search className={`absolute left-3 top-2.5 h-4 w-4 ${textMuted}`} />
                <input 
                  ref={purchaseSearchRef} type="text" placeholder="Search by PO #, Supplier, or Contact..." value={purchaseSearchQuery} 
                  onChange={(e) => { setPurchaseSearchQuery(e.target.value); setFocusedPurchaseIndex(-1); }}
                  onKeyDown={(e) => { if(e.key === 'ArrowDown') { e.preventDefault(); setFocusedPurchaseIndex(0); purchaseSearchRef.current?.blur(); } }}
                  className={`w-full pl-9 p-2 border ${borderCard} rounded-lg ${bgInput} ${textMain} text-sm focus:border-orange-500 outline-none`} 
                />
              </div>
              <div className="relative w-full sm:w-48">
                <Calendar className={`absolute left-3 top-2.5 h-4 w-4 ${textMuted}`} />
                <select 
                  value={purchaseFilter} onChange={(e) => { setPurchaseFilter(e.target.value as any); setFocusedPurchaseIndex(-1); }}
                  className={`w-full pl-9 p-2 border ${borderCard} rounded-lg ${bgInput} ${textMain} text-sm focus:border-orange-500 outline-none appearance-none`}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>

            <div className={`flex-1 rounded-xl border ${borderCard} ${bgCard} shadow-sm overflow-hidden flex flex-col relative`}>
              <div className="overflow-x-auto overflow-y-auto flex-1">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className={`sticky top-0 z-10 ${isDark ? 'bg-slate-900' : 'bg-slate-100'} ${textMuted} text-[11px] uppercase tracking-wider border-b ${borderCard} shadow-sm`}>
                    <tr>
                      <th className="px-4 py-3 font-semibold">PO #</th>
                      <th className="px-4 py-3 font-semibold">Date & Time</th>
                      <th className="px-4 py-3 font-semibold">Supplier Details</th>
                      <th className="px-4 py-3 font-semibold">Recorded By</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
                    {filteredPurchases.map((pur, index) => {
                      const isFocused = focusedPurchaseIndex === index;
                      const isPending = pur.status === "Pending";
                      return (
                        <tr 
                          key={pur.orderId} onClick={() => setSelectedPurchase(pur)}
                          className={`cursor-pointer transition-colors ${isFocused ? (isDark ? 'bg-orange-500/20' : 'bg-orange-50') : (isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50')}`}
                        >
                          <td className="px-4 py-3 font-mono font-medium text-xs">{pur.orderId}</td>
                          <td className={`px-4 py-3 ${textMuted}`}>{format(new Date(pur.date), "dd MMM yyyy, HH:mm")}</td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-sm">{pur.supplier.name}</p>
                            <p className={`text-xs ${textMuted}`}>{pur.supplier.contact}</p>
                          </td>
                          <td className={`px-4 py-3 ${textMuted}`}>{pur.recordedBy}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isPending ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>{pur.status}</span>
                          </td>
                          <td className={`px-4 py-3 text-right font-bold text-slate-700 dark:text-slate-300`}>
                            {pur.currency}{pur.total.toLocaleString(undefined, {minimumFractionDigits: 2})}
                          </td>
                        </tr>
                      )
                    })}
                    {filteredPurchases.length === 0 && (<tr><td colSpan={6} className={`px-4 py-10 text-center ${textMuted}`}>No records found.</td></tr>)}
                  </tbody>
                </table>
              </div>
              <div className={`p-2 border-t ${borderCard} ${bgInput} text-center text-[10px] ${textMuted}`}>
                Use <kbd className="border rounded px-1.5 py-0.5 mx-1">↑</kbd> <kbd className="border rounded px-1.5 py-0.5 mx-1">↓</kbd> to navigate, and <kbd className="border rounded px-1.5 py-0.5 mx-1">Enter</kbd> to view details.
              </div>
            </div>
            
            {selectedPurchase && (
              <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className={`relative w-full max-w-md ${bgCard} border ${borderCard} rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-full`}>
                  <button onClick={() => setSelectedPurchase(null)} className="absolute top-4 right-4 p-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded-full transition z-10"><X className="h-4 w-4" /></button>
                  <div className={`p-6 border-b ${borderCard} bg-slate-100 dark:bg-slate-950 text-center`}>
                    <h2 className="font-bold text-xl uppercase tracking-wider">{storeSettings.storeName}</h2>
                    <p className={`text-xs mt-1 ${textMuted}`}>Purchase Order • Press ESC to close</p>
                  </div>
                  <div className="p-6 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><p className={`text-[10px] uppercase font-bold ${textMuted}`}>PO Number</p><p className="font-mono font-medium">{selectedPurchase.orderId}</p></div>
                      <div><p className={`text-[10px] uppercase font-bold ${textMuted}`}>Date & Time</p><p>{format(new Date(selectedPurchase.date), "dd MMM yyyy, HH:mm")}</p></div>
                      <div><p className={`text-[10px] uppercase font-bold ${textMuted}`}>Supplier</p><p className="font-semibold">{selectedPurchase.supplier.name}</p></div>
                      <div><p className={`text-[10px] uppercase font-bold ${textMuted}`}>Contact</p><p>{selectedPurchase.supplier.contact}</p></div>
                    </div>
                    <div className={`border-t border-b ${borderCard} py-3`}>
                      <p className={`text-[10px] uppercase font-bold ${textMuted} mb-2`}>Received Items</p>
                      <table className="w-full text-sm">
                        <tbody>
                          {selectedPurchase.items.map((item: any, i: number) => (
                            <tr key={i} className="border-b border-dashed border-slate-200 dark:border-slate-800 last:border-0">
                              <td className={`py-1.5 w-8 font-semibold ${textMuted}`}>{item.qty}x</td>
                              <td className="py-1.5 font-medium">{item.name}</td>
                              <td className="py-1.5 text-right whitespace-nowrap">{selectedPurchase.currency}{(item.price * item.qty).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className={`flex justify-between font-bold text-xl pt-2 mt-2 border-t ${borderCard} text-blue-500`}>
                        <span>TOTAL COST</span>
                        <span>{selectedPurchase.currency}{selectedPurchase.total.toFixed(2)}</span>
                      </div>
                      <div className={`flex justify-between font-semibold mt-1 ${selectedPurchase.status === 'Paid' ? 'text-emerald-500' : 'text-orange-500'}`}>
                        <span>STATUS</span>
                        <span className="uppercase">{selectedPurchase.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`p-4 border-t ${borderCard} ${bgInput} flex justify-between gap-3`}>
                    <button onClick={() => setSelectedPurchase(null)} className={`flex-1 py-2 rounded-lg font-semibold text-sm border ${borderCard} hover:bg-slate-200 dark:hover:bg-slate-800 transition`}>Close</button>
                    <button onClick={() => setTimeout(() => window.print(), 100)} className="flex-1 py-2 rounded-lg font-semibold text-sm bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition flex items-center justify-center gap-2"><Printer className="h-4 w-4" /> Print Copy</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "catalog" && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <div className={`p-5 rounded-xl shadow-sm border transition-colors ${isEditingProduct ? 'border-orange-500 ring-1 ring-orange-500' : borderCard} ${bgCard}`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg flex items-center gap-2"><PackagePlus className="h-5 w-5 text-orange-500"/> {isEditingProduct ? "Edit Menu Item" : "Add New Menu Item"}</h2>
                {isEditingProduct && <button onClick={() => {setIsEditingProduct(false); setNewProd({id:"", name:"", price:"", image:""});}} className={`text-xs font-semibold ${textMuted} hover:${textMain} border ${borderCard} px-3 py-1.5 rounded-lg`}>Cancel Edit</button>}
              </div>
              <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-4"><label className={`block text-xs font-medium mb-1 ${textMuted}`}>Product Name</label><input ref={prodNameRef} type="text" value={newProd.name} onChange={e => setNewProd({...newProd, name: e.target.value})} onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); prodPriceRef.current?.focus(); } }} className={`w-full border ${borderCard} ${bgInput} rounded-lg p-2.5 text-sm outline-none focus:border-orange-500`} required /></div>
                <div className="md:col-span-3"><label className={`block text-xs font-medium mb-1 ${textMuted}`}>Price</label><input ref={prodPriceRef} type="number" step="0.01" value={newProd.price} onChange={e => setNewProd({...newProd, price: e.target.value})} className={`w-full border ${borderCard} ${bgInput} rounded-lg p-2.5 text-sm outline-none focus:border-orange-500`} required /></div>
                <div className="md:col-span-3">
                  <label className={`block text-xs font-medium mb-1 ${textMuted}`}>Product Image</label>
                  <label className={`flex items-center justify-center w-full border border-dashed ${isDark ? 'border-slate-600 hover:bg-slate-800' : 'border-slate-400 hover:bg-slate-50'} rounded-lg p-2.5 text-sm cursor-pointer h-[42px] relative overflow-hidden transition`}>
                    {newProd.image && <img src={newProd.image} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-30" />}
                    <span className={`relative z-10 flex items-center px-2 py-0.5 rounded ${isDark ? 'bg-slate-900/80 text-slate-300' : 'bg-white/80 text-slate-600'} backdrop-blur-sm`}><Upload className="h-4 w-4 mr-2" /> {newProd.image ? "Change Image" : "Upload File"}</span>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, (val) => setNewProd({...newProd, image: val}))} className="hidden" />
                  </label>
                </div>
                <button type="submit" className={`md:col-span-2 text-white py-2.5 rounded-lg text-sm font-bold shadow-md w-full ${isEditingProduct ? 'bg-orange-600 hover:bg-orange-500' : 'bg-slate-800 hover:bg-slate-700'}`}>{isEditingProduct ? "Update Product" : "+ Add Product"}</button>
              </form>
            </div>
            
            <div className={`rounded-xl shadow-sm border ${borderCard} overflow-hidden ${bgCard}`}>
              <table className="w-full text-left text-sm"><thead className={`${isDark ? 'bg-slate-900' : 'bg-slate-50'} ${textMuted} text-xs uppercase border-b ${borderCard}`}><tr><th className="p-4 w-16">Image</th><th className="p-4">Name</th><th className="p-4">Price</th><th className="p-4 text-right">Actions</th></tr></thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                  {menuItems.map(item => (
                    <tr key={item.id} className={isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}>
                      <td className="p-3"><img src={item.image || "/placeholder.jpg"} className={`w-10 h-10 rounded-lg object-cover border ${borderCard}`} alt=""/></td>
                      <td className="p-3 font-semibold">{item.name}</td>
                      <td className={`p-3 font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{storeSettings.currency}{item.price.toFixed(2)}</td>
                      <td className="p-3 text-right space-x-2">
                        <button onClick={() => editProduct(item)} className={`text-blue-500 p-2 rounded-lg transition ${isDark ? 'hover:bg-slate-800' : 'hover:bg-blue-50'}`}><Edit className="h-4 w-4" /></button>
                        <button onClick={() => deleteProduct(item.id)} className={`text-red-500 p-2 rounded-lg transition ${isDark ? 'hover:bg-slate-800' : 'hover:bg-red-50'}`}><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6 max-w-2xl">
            <div className={`p-6 rounded-xl shadow-sm border ${borderCard} ${bgCard}`}>
              <div className="flex justify-between items-center mb-5">
                <h1 className="text-2xl font-bold">Store Configuration</h1>
                {!isEditingSettings ? <button onClick={() => setIsEditingSettings(true)} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-700"><Edit2 className="h-4 w-4" /> Edit</button> : <button onClick={saveSettings} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-500"><Save className="h-4 w-4" /> Save</button>}
              </div>
              <div className="space-y-4">
                <div><label className={`block text-sm font-medium mb-1 ${textMuted}`}>Store Name</label><input type="text" disabled={!isEditingSettings} value={tempSettings.storeName} onChange={e => setTempSettings({...tempSettings, storeName: e.target.value})} className={`w-full border ${borderCard} ${bgInput} rounded-lg p-2.5 text-sm disabled:opacity-50`} /></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className={`block text-sm font-medium mb-1 ${textMuted}`}>Currency</label><select disabled={!isEditingSettings} value={tempSettings.currency} onChange={e => setTempSettings({...tempSettings, currency: e.target.value})} className={`w-full border ${borderCard} ${bgInput} rounded-lg p-2.5 text-sm disabled:opacity-50`}>{CURRENCIES.map(c => <option key={c.symbol} value={c.symbol}>{c.label}</option>)}</select></div>
                  <div><label className={`block text-sm font-medium mb-1 ${textMuted}`}>Delivery Fee</label><input type="number" disabled={!isEditingSettings} value={tempSettings.deliveryFee} onChange={e => setTempSettings({...tempSettings, deliveryFee: parseFloat(e.target.value)})} className={`w-full border ${borderCard} ${bgInput} rounded-lg p-2.5 text-sm disabled:opacity-50`} /></div>
                  <div><label className={`block text-sm font-medium mb-1 ${textMuted}`}>Receipt Paper Size</label><select disabled={!isEditingSettings} value={tempSettings.receiptSize} onChange={e => setTempSettings({...tempSettings, receiptSize: e.target.value})} className={`w-full border ${borderCard} ${bgInput} rounded-lg p-2.5 text-sm disabled:opacity-50`}><option value="80mm">80mm</option><option value="58mm">58mm</option></select></div>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${textMuted}`}>Receipt Logo (Base64 Upload)</label>
                  <div className="flex items-end gap-4">
                    {tempSettings.logoUrl ? (
                      <img src={tempSettings.logoUrl} alt="Logo" className={`w-24 h-24 object-contain border ${borderCard} rounded-lg ${bgInput} p-2`} />
                    ) : (
                      <div className={`w-24 h-24 flex items-center justify-center border ${borderCard} rounded-lg ${bgInput} p-2 text-[10px] ${textMuted} text-center`}>No Logo</div>
                    )}
                    {isEditingSettings && <label className={`flex items-center justify-center border border-dashed border-slate-400 rounded-lg px-4 py-2.5 text-sm cursor-pointer hover:bg-slate-500/10 ${textMuted} font-medium h-fit`}><Upload className="h-4 w-4 mr-2" /> Upload PC Image<input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, (val) => setTempSettings({...tempSettings, logoUrl: val}))} className="hidden" /></label>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {(selectedReceipt || lastOrder || selectedPurchase) && (() => {
        const pData = selectedReceipt || lastOrder || selectedPurchase;
        return (
          <div id="printable-receipt" className="bg-white text-black p-3 text-xs font-mono hidden" style={{ width: storeSettings.receiptSize }}>
            <div className="text-center mb-3">
              {storeSettings.logoUrl && <img src={storeSettings.logoUrl} alt="Logo" className="w-14 h-14 object-contain mx-auto mb-1 grayscale contrast-125" style={{ filter: "grayscale(100%)", WebkitPrintColorAdjust: "exact", colorAdjust: "exact" }} />}
              <h1 className="font-bold text-lg uppercase">{storeSettings.storeName}</h1>
              <p>Terminal Receipt</p>
              <p className="mt-1 font-bold border-b border-black pb-1 border-dashed">{pData.type === "Return" ? "REFUND RECEIPT" : "INVOICE"}</p>
            </div>
            <div className="mb-3"><p><strong>No:</strong> {pData.orderId}</p><p><strong>Date:</strong> {format(new Date(pData.date), "dd/MM/yyyy HH:mm")}</p></div>
            <table className="w-full mb-3 text-[11px]">
              <thead><tr className="border-b border-black border-dashed"><th className="text-left pb-1">Qty</th><th className="text-left pb-1">Item</th><th className="text-right pb-1">Amt</th></tr></thead>
              <tbody>
                {pData.items.map((item: any, i: number) => (<tr key={i} className="align-top"><td className="py-1 w-6">{item.qty}x</td><td className="py-1 pr-1">{item.name}</td><td className="py-1 text-right whitespace-nowrap">{pData.currency}{(item.price * item.qty).toFixed(0)}</td></tr>))}
              </tbody>
            </table>
            <div className="border-t border-black pt-2 border-dashed text-[11px]">
              <div className="flex justify-between font-bold text-sm mt-2"><p>TOTAL</p><p>{pData.currency}{pData.total.toFixed(0)}</p></div>
            </div>
            <div className="text-center mt-4 text-[10px]"><p>*** THANK YOU ***</p></div>
          </div>
        )
      })()}
    </div>
  );
}