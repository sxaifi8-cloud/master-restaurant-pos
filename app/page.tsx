"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  ShoppingBag, Printer, MapPin, User, Phone, Plus, Minus, 
  CheckCircle, Settings, PackagePlus, Utensils, Store, Trash2, 
  Users, Truck, Beef, Image as ImageIcon, Edit2, Save, Upload,
  Search, Menu, Banknote, Users2, Wallet, ShoppingCart, Edit,
  Moon, Sun, X, Calendar, ArrowUpRight, ArrowDownRight, Tag,
  ArrowDownLeft, Clock, PieChart, BookOpen, ShieldCheck, Lock, LogOut
} from "lucide-react";
import { format, isToday, isYesterday, isThisMonth } from "date-fns";

const CURRENCIES = [
  { symbol: "$", label: "USD ($)" },
  { symbol: "Rs ", label: "PKR (Rs)" },
  { symbol: "£", label: "GBP (£)" },
  { symbol: "€", label: "EUR (€)" },
];

const DEFAULT_SETTINGS = { currency: "Rs ", logoUrl: "", deliveryFee: 0.00, storeName: "Master Restaurant", receiptSize: "80mm" };

export default function DeliveryPOS() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [activeTab, setActiveTab] = useState<"pos" | "sales" | "catalog" | "purchases" | "reports" | "cashbook" | "staff" | "settings">("pos");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [mounted, setMounted] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  const [todayStr, setTodayStr] = useState("");
  const [yesterdayStr, setYesterdayStr] = useState("");
  const [currentMonthStr, setCurrentMonthStr] = useState("");

  const [toast, setToast] = useState<{show: boolean, msg: string, type: 'success' | 'error'}>({show: false, msg: "", type: "success"});
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({show: true, msg, type});
    setTimeout(() => setToast({show: false, msg: "", type: "success"}), 3000);
  };

  const isDark = theme === "dark";
  const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
  const textMain = isDark ? "text-slate-100" : "text-slate-900";
  const bgCard = isDark ? "bg-slate-900" : "bg-white";
  const borderCard = isDark ? "border-slate-800" : "border-slate-200";
  const bgInput = isDark ? "bg-slate-950" : "bg-slate-50";
  const textMuted = isDark ? "text-slate-400" : "text-slate-500";

  // Persistent Databases
  const [storeSettings, setStoreSettings] = useState(DEFAULT_SETTINGS);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [purchasesHistory, setPurchasesHistory] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [cashbook, setCashbook] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  
  // Authentication State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [pinInput, setPinInput] = useState("");

  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState({ ...storeSettings });

  const [searchQuery, setSearchQuery] = useState("");
  const [navZone, setNavZone] = useState<'inputs' | 'grid'>('grid');
  const [focusedProductIndex, setFocusedProductIndex] = useState<number>(0);
  
  const [salesSearchQuery, setSalesSearchQuery] = useState("");
  const [salesFilter, setSalesFilter] = useState<"today" | "yesterday" | "month" | "all">("all");
  const [salesTypeFilter, setSalesTypeFilter] = useState<"all" | "Sale" | "Return">("all");
  const [focusedSaleIndex, setFocusedSaleIndex] = useState<number>(-1);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  const [purchaseSearchQuery, setPurchaseSearchQuery] = useState("");
  const [purchaseFilter, setPurchaseFilter] = useState<"today" | "yesterday" | "month" | "all">("all");
  const [purchaseStatusFilter, setPurchaseStatusFilter] = useState<"all" | "Paid" | "Pending">("all");
  const [focusedPurchaseIndex, setFocusedPurchaseIndex] = useState<number>(-1);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);

  const [focusedCatalogIndex, setFocusedCatalogIndex] = useState<number>(-1);
  const [focusedCbIndex, setFocusedCbIndex] = useState<number>(-1);
  const [focusedStaffIndex, setFocusedStaffIndex] = useState<number>(-1);
  
  const searchRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const checkoutRef = useRef<HTMLButtonElement>(null);
  const salesSearchRef = useRef<HTMLInputElement>(null);
  const purchaseSearchRef = useRef<HTMLInputElement>(null);

  const purSupplierRef = useRef<HTMLInputElement>(null);
  const purContactRef = useRef<HTMLInputElement>(null);
  const purItemRef = useRef<HTMLInputElement>(null);
  const purQtyRef = useRef<HTMLInputElement>(null);
  const purUnitRef = useRef<HTMLSelectElement>(null);
  const purTotalRef = useRef<HTMLInputElement>(null);
  const purPaidRef = useRef<HTMLInputElement>(null);
  const purSubmitRef = useRef<HTMLButtonElement>(null);

  const staffNameRef = useRef<HTMLInputElement>(null);
  const staffRoleRef = useRef<HTMLSelectElement>(null);
  const staffPhoneRef = useRef<HTMLInputElement>(null);
  const staffEmailRef = useRef<HTMLInputElement>(null);
  const staffPinRef = useRef<HTMLInputElement>(null);
  const staffStatusRef = useRef<HTMLSelectElement>(null);
  const staffSubmitRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
    const now = new Date();
    setCurrentTime(now);
    setTodayStr(format(now, "yyyy-MM-dd"));
    setYesterdayStr(format(new Date(now.getTime() - 86400000), "yyyy-MM-dd"));
    setCurrentMonthStr(format(now, "yyyy-MM"));

    const timer = setInterval(() => setCurrentTime(new Date()), 60000);

    const savedData = localStorage.getItem("master_pos_data");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.menuItems) setMenuItems(parsed.menuItems);
        if (parsed.storeSettings) setStoreSettings(parsed.storeSettings);
        
        // FIX: Scrub bloated image data from old receipts to un-brick storage limits
        if (parsed.salesHistory) {
          const cleanedSales = parsed.salesHistory.map((sale: any) => ({
            ...sale,
            items: sale.items.map((item: any) => {
              const { image, ...rest } = item;
              return rest;
            })
          }));
          setSalesHistory(cleanedSales);
        }
        
        if (parsed.purchasesHistory) setPurchasesHistory(parsed.purchasesHistory);
        if (parsed.expenses) setExpenses(parsed.expenses);
        if (parsed.cashbook) setCashbook(parsed.cashbook);
        if (parsed.staffList) setStaffList(parsed.staffList);
      } catch (e) { console.error("Failed to load local storage data."); }
    }
    setAuthReady(true);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem("master_pos_data", JSON.stringify({ menuItems, storeSettings, salesHistory, purchasesHistory, expenses, cashbook, staffList }));
      } catch (error: any) {
        console.error("Storage Error:", error);
        if (error.name === 'QuotaExceededError') {
          showToast("Storage Full! Clear your browser data or delete old history.", "error");
        }
      }
    }
  }, [menuItems, storeSettings, salesHistory, purchasesHistory, expenses, cashbook, staffList, mounted]);

  useEffect(() => {
    if (!currentUser && staffList.length > 0) return; 
    if (activeTab === 'pos') { setTimeout(() => searchRef.current?.focus(), 100); setNavZone('grid'); if (menuItems.length > 0) setFocusedProductIndex(0); }
    if (activeTab === 'sales') setTimeout(() => salesSearchRef.current?.focus(), 100);
    if (activeTab === 'purchases') setTimeout(() => purchaseSearchRef.current?.focus(), 100);
    if (activeTab === 'staff') setTimeout(() => staffNameRef.current?.focus(), 100);
  }, [activeTab, menuItems.length, currentUser]);

  const [cart, setCart] = useState<any[]>([]);
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
  const [lastOrder, setLastOrder] = useState<any>(null);

  const [newProd, setNewProd] = useState({ id: "", name: "", price: "", image: "" });
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const prodNameRef = useRef<HTMLInputElement>(null);
  const prodPriceRef = useRef<HTMLInputElement>(null);

  const [newPur, setNewPur] = useState({ orderId: "", supplierName: "", contact: "", itemName: "", qty: "1", unit: "pcs", total: "", paid: "", status: "Paid" });
  const [isEditingPurchase, setIsEditingPurchase] = useState(false);

  const [newCb, setNewCb] = useState({ id: "", desc: "", type: "In", amount: "" });

  const [newStaff, setNewStaff] = useState({ id: "", name: "", role: "Cashier", phone: "", email: "", pin: "", status: "Active" });
  const [isEditingStaff, setIsEditingStaff] = useState(false);

  // --- Derived Calculations ---
  const filteredMenu = menuItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const filteredSales = salesHistory.filter(sale => {
    const sDateStr = sale.date.split("T")[0];
    let dateMatch = true;
    if (salesFilter === "today") dateMatch = sDateStr === todayStr;
    if (salesFilter === "yesterday") dateMatch = sDateStr === yesterdayStr;
    if (salesFilter === "month") dateMatch = sale.date.startsWith(currentMonthStr);
    let typeMatch = true;
    if (salesTypeFilter !== "all") typeMatch = sale.type === salesTypeFilter;
    const searchStr = `${sale.orderId} ${sale.customer.name} ${sale.customer.phone} ${sale.recordedBy}`.toLowerCase();
    return dateMatch && typeMatch && searchStr.includes(salesSearchQuery.toLowerCase());
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
    let statusMatch = true;
    if (purchaseStatusFilter !== "all") statusMatch = pur.status === purchaseStatusFilter;
    const searchStr = `${pur.orderId} ${pur.supplier.name} ${pur.supplier.contact} ${pur.recordedBy} ${pur.items?.[0]?.name || ''}`.toLowerCase();
    return dateMatch && statusMatch && searchStr.includes(purchaseSearchQuery.toLowerCase());
  });

  const totalPurchasesAmt = filteredPurchases.reduce((sum, p) => sum + p.total, 0);
  const totalPendingAmt = filteredPurchases.reduce((sum, p) => sum + (p.credit !== undefined ? p.credit : (p.status === "Pending" ? p.total : 0)), 0);

  const allTimeSales = salesHistory.filter(s => s.type === "Sale").reduce((sum, s) => sum + s.total, 0);
  const allTimeReturns = salesHistory.filter(s => s.type === "Return").reduce((sum, s) => sum + s.total, 0);
  const allTimePurchases = purchasesHistory.reduce((sum, p) => sum + p.total, 0);
  const allTimeExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = (allTimeSales - allTimeReturns) - allTimePurchases - allTimeExpenses;

  let currentBalance = 0;
  const cashbookWithBalance = [...cashbook].reverse().map(cb => {
    currentBalance += (cb.type === "In" ? cb.amount : -cb.amount);
    return { ...cb, balance: currentBalance };
  }).reverse();

  // Authentication Logic
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) {
      showToast("Please enter your PIN.", "error");
      return;
    }

    if (pinInput === "112233") {
      setCurrentUser({ id: "master", name: "System Admin", role: "Owner", pin: "112233", status: "Active" });
      setPinInput("");
      showToast("Logged in with Master Override PIN.", "success");
      return;
    }

    const user = staffList.find(s => s.pin === pinInput && s.status === 'Active');
    if (user) {
      setCurrentUser(user);
      setPinInput("");
      showToast(`Welcome back, ${user.name}!`, "success");
      if (user.role === 'Cashier' && !["pos", "sales", "cashbook"].includes(activeTab)) {
        setActiveTab("pos"); 
      }
    } else {
      showToast("Invalid PIN or account is inactive.", "error");
      setPinInput("");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab("pos");
    showToast("Terminal locked securely.", "success");
  };

  const activeUser = currentUser || (staffList.length === 0 ? { name: "Setup Admin", role: "Owner" } : null);
  const isManager = activeUser?.role === "Owner" || activeUser?.role === "Manager";

  const closeSalesModal = () => { setSelectedReceipt(null); setTimeout(() => salesSearchRef.current?.focus(), 50); };
  const closePurchaseModal = () => { setSelectedPurchase(null); setTimeout(() => purchaseSearchRef.current?.focus(), 50); };

  // --- Keyboard Flow ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeUser) return; 
      if (e.key === 'Tab') { setNavZone('inputs'); setFocusedProductIndex(-1); return; }
      if (e.ctrlKey && e.key.toLowerCase() === 'b') { e.preventDefault(); setIsSidebarOpen(prev => !prev); return; }
      
      if (e.key === 'F2') { e.preventDefault(); setActiveTab('pos'); return; }
      if (e.key === 'F3') { e.preventDefault(); setActiveTab('sales'); return; }
      if (e.key === 'F9') { e.preventDefault(); setActiveTab('cashbook'); return; }
      if (isManager) {
        if (e.key === 'F4') { e.preventDefault(); setActiveTab('catalog'); return; }
        if (e.key === 'F6') { e.preventDefault(); setActiveTab('purchases'); return; }
        if (e.key === 'F7') { e.preventDefault(); setActiveTab('reports'); return; }
        if (e.key === 'F8') { e.preventDefault(); setActiveTab('settings'); return; }
      }

      if (selectedReceipt) { if (e.key === 'Escape') { e.preventDefault(); closeSalesModal(); } if (e.key === 'p' && e.ctrlKey) { e.preventDefault(); setTimeout(() => window.print(), 100); } return; }
      if (selectedPurchase) { if (e.key === 'Escape') { e.preventDefault(); closePurchaseModal(); } if (e.key === 'p' && e.ctrlKey) { e.preventDefault(); setTimeout(() => window.print(), 100); } return; }

      const isInputFocused = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'SELECT' || document.activeElement?.tagName === 'TEXTAREA';

      if (activeTab === "sales") {
        if (e.key === 'ArrowDown' && !isInputFocused) { e.preventDefault(); setFocusedSaleIndex(p => Math.min(p + 1, filteredSales.length - 1)); }
        if (e.key === 'ArrowUp' && !isInputFocused) { e.preventDefault(); setFocusedSaleIndex(p => Math.max(p - 1, 0)); }
        if (e.key === 'Enter' && focusedSaleIndex >= 0 && filteredSales[focusedSaleIndex] && !isInputFocused) { e.preventDefault(); setSelectedReceipt(filteredSales[focusedSaleIndex]); }
        if (e.key === 'Escape') { setFocusedSaleIndex(-1); salesSearchRef.current?.blur(); }
        return;
      }

      if (activeTab === "purchases" && isManager) {
        if (e.key === 'ArrowDown' && !isInputFocused) { e.preventDefault(); setFocusedPurchaseIndex(p => Math.min(p + 1, filteredPurchases.length - 1)); }
        if (e.key === 'ArrowUp' && !isInputFocused) { e.preventDefault(); setFocusedPurchaseIndex(p => Math.max(p - 1, 0)); }
        if (e.key === 'Enter' && focusedPurchaseIndex >= 0 && filteredPurchases[focusedPurchaseIndex] && !isInputFocused) { e.preventDefault(); setSelectedPurchase(filteredPurchases[focusedPurchaseIndex]); }
        if (e.key === 'Escape') { setFocusedPurchaseIndex(-1); purchaseSearchRef.current?.blur(); }
        return;
      }

      if (activeTab === "catalog" && isManager) {
        if (e.key === 'ArrowDown' && !isInputFocused) { e.preventDefault(); setFocusedCatalogIndex(p => Math.min(p + 1, menuItems.length - 1)); }
        if (e.key === 'ArrowUp' && !isInputFocused) { e.preventDefault(); setFocusedCatalogIndex(p => Math.max(p - 1, 0)); }
        if (e.key === 'Enter' && focusedCatalogIndex >= 0 && menuItems[focusedCatalogIndex] && !isInputFocused) { e.preventDefault(); editProduct(menuItems[focusedCatalogIndex]); }
        if (e.key === 'Escape') { setFocusedCatalogIndex(-1); }
        return;
      }

      if (activeTab === "staff" && isManager) {
        if (e.key === 'ArrowDown' && !isInputFocused) { e.preventDefault(); setFocusedStaffIndex(p => Math.min(p + 1, staffList.length - 1)); }
        if (e.key === 'ArrowUp' && !isInputFocused) { e.preventDefault(); setFocusedStaffIndex(p => Math.max(p - 1, 0)); }
        if (e.key === 'Enter' && focusedStaffIndex >= 0 && staffList[focusedStaffIndex] && !isInputFocused) { e.preventDefault(); editStaff(staffList[focusedStaffIndex]); }
        if (e.key === 'Escape') { setFocusedStaffIndex(-1); }
        return;
      }

      if (activeTab === "cashbook") {
        if (e.key === 'ArrowDown' && !isInputFocused) { e.preventDefault(); setFocusedCbIndex(p => Math.min(p + 1, cashbookWithBalance.length - 1)); }
        if (e.key === 'ArrowUp' && !isInputFocused) { e.preventDefault(); setFocusedCbIndex(p => Math.max(p - 1, 0)); }
        if (e.key === 'Escape') { setFocusedCbIndex(-1); }
        return;
      }

      if (activeTab === "pos") {
        if (e.altKey && e.key.toLowerCase() === 'f') { e.preventDefault(); setNavZone('inputs'); searchRef.current?.focus(); return; }
        if (e.altKey && e.key.toLowerCase() === 'c') { e.preventDefault(); handleCheckout(); return; }
        if (navZone === 'grid') {
          if (e.key === 'ArrowRight') { e.preventDefault(); setFocusedProductIndex(p => Math.min(p + 1, filteredMenu.length - 1)); }
          if (e.key === 'ArrowLeft') { e.preventDefault(); setFocusedProductIndex(p => Math.max(p - 1, 0)); }
          if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedProductIndex(p => Math.min(p + 4, filteredMenu.length - 1)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); if (focusedProductIndex - 4 < 0) { setNavZone('inputs'); searchRef.current?.focus(); } else { setFocusedProductIndex(p => Math.max(p - 4, 0)); } }
          
          if (e.key === 'Enter') { 
            if (document.activeElement?.tagName === 'BUTTON' || document.activeElement?.tagName === 'INPUT') return;
            e.preventDefault(); 
            if (filteredMenu[focusedProductIndex]) addToCart(filteredMenu[focusedProductIndex]); 
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery, menuItems, cart, customer, storeSettings, activeTab, focusedProductIndex, filteredMenu, navZone, focusedSaleIndex, filteredSales, selectedReceipt, focusedPurchaseIndex, filteredPurchases, selectedPurchase, focusedCatalogIndex, focusedCbIndex, cashbookWithBalance, focusedStaffIndex, staffList, activeUser, isManager]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) { 
      const reader = new FileReader(); 
      reader.onloadend = () => { 
        const img = new window.Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 400; 
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.6);
          setter(compressedBase64); 
          showToast("Image optimized and added successfully!", "success"); 
        };
      };
      reader.readAsDataURL(file); 
    }
  };

  const addToCart = (item: any) => setCart((prev) => prev.find((i) => i.id === item.id) ? prev.map((i) => i.id === item.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...item, qty: 1 }]);
  const updateQty = (id: string, delta: number) => setCart((prev) => prev.map((i) => i.id === id ? { ...i, qty: i.qty + delta } : i).filter((i) => i.qty > 0));

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = subtotal + storeSettings.deliveryFee;

  const handleCheckout = () => {
    if (cart.length === 0 || !customer.address || !customer.phone) {
      showToast("Please add items and complete customer details.", "error");
      return;
    }

    // FIX: Strip images from receipt to preserve local storage limits
    const cleanCartItems = cart.map(item => {
      const { image, ...rest } = item;
      return rest;
    });

    const orderData = {
      orderId: `INV-${format(new Date(), "yyyyMMdd")}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString(), customer: { ...customer }, items: cleanCartItems, subtotal, deliveryFee: storeSettings.deliveryFee, discount: 0, total, currency: storeSettings.currency,
      type: "Sale", recordedBy: activeUser?.name || "Admin"
    };
    setLastOrder(orderData); setSalesHistory([orderData, ...salesHistory]); setCart([]); setCustomer({ name: "", phone: "", address: "" });
    showToast("Order placed successfully!", "success"); searchRef.current?.focus(); 
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.name || !newProd.price) {
      showToast("Product name and price are strictly required.", "error");
      return;
    }
    if (isEditingProduct) { setMenuItems(menuItems.map(item => item.id === newProd.id ? { ...item, name: newProd.name, price: parseFloat(newProd.price), image: newProd.image } : item)); setIsEditingProduct(false); } 
    else { setMenuItems([...menuItems, { id: Date.now().toString(), name: newProd.name, price: parseFloat(newProd.price), image: newProd.image }]); }
    setNewProd({ id: "", name: "", price: "", image: "" }); prodNameRef.current?.focus(); showToast("Product saved!", "success");
  };
  const editProduct = (item: any) => { setNewProd({ id: item.id, name: item.name, price: item.price.toString(), image: item.image }); setIsEditingProduct(true); prodNameRef.current?.focus(); };
  const deleteProduct = (id: string) => { if(confirm("Delete this product?")) setMenuItems(menuItems.filter(item => item.id !== id)); };

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPur.supplierName || !newPur.total || !newPur.itemName) {
      showToast("Supplier Name, Item Name, and Total Amount are strictly required.", "error");
      return;
    }
    const totalAmt = parseFloat(newPur.total) || 0; const paidAmt = parseFloat(newPur.paid) || 0; const creditAmt = totalAmt - paidAmt; const statusVal = creditAmt > 0 ? "Pending" : "Paid";

    if (isEditingPurchase) {
      setPurchasesHistory(purchasesHistory.map(p => p.orderId === newPur.orderId ? { 
        ...p, supplier: { name: newPur.supplierName, contact: newPur.contact }, 
        items: [{name: newPur.itemName, qty: parseFloat(newPur.qty) || 1, unit: newPur.unit, price: totalAmt / (parseFloat(newPur.qty) || 1)}],
        total: totalAmt, paid: paidAmt, credit: creditAmt, status: statusVal 
      } : p));
      setIsEditingPurchase(false);
    } else {
      const poData = {
        orderId: `PO-${format(new Date(), "yyyyMMdd")}-${Math.floor(1000 + Math.random() * 9000)}`, date: new Date().toISOString(), 
        supplier: { name: newPur.supplierName, contact: newPur.contact }, 
        items: [{name: newPur.itemName, qty: parseFloat(newPur.qty) || 1, unit: newPur.unit, price: totalAmt / (parseFloat(newPur.qty) || 1)}], 
        subtotal: totalAmt, total: totalAmt, paid: paidAmt, credit: creditAmt, currency: storeSettings.currency, status: statusVal, recordedBy: activeUser?.name || "Admin"
      };
      setPurchasesHistory([poData, ...purchasesHistory]);
    }
    setNewPur({ orderId: "", supplierName: "", contact: "", itemName: "", qty: "1", unit: "pcs", total: "", paid: "", status: "Paid" }); 
    purSupplierRef.current?.focus(); showToast("Purchase recorded!", "success");
  };

  const editPurchase = (pur: any) => { 
    setNewPur({ 
      orderId: pur.orderId, supplierName: pur.supplier.name, contact: pur.supplier.contact, 
      itemName: pur.items?.[0]?.name || "", qty: pur.items?.[0]?.qty?.toString() || "1", unit: pur.items?.[0]?.unit || "pcs",
      total: pur.total.toString(), paid: (pur.paid !== undefined ? pur.paid : pur.total).toString(), status: pur.status 
    }); 
    setIsEditingPurchase(true); purSupplierRef.current?.focus(); 
  };
  const deletePurchase = (id: string) => { if(confirm("Delete this purchase record?")) setPurchasesHistory(purchasesHistory.filter(p => p.orderId !== id)); };

  const handleSaveCb = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCb.desc || !newCb.amount) {
      showToast("Description and Amount are strictly required.", "error");
      return;
    }
    setCashbook([{ id: Date.now().toString(), date: new Date().toISOString(), desc: newCb.desc, type: newCb.type, amount: parseFloat(newCb.amount) }, ...cashbook]);
    setNewCb({ id: "", desc: "", type: "In", amount: "" }); showToast("Cash entry recorded!", "success");
  };
  const deleteCb = (id: string) => { if(confirm("Delete this entry?")) setCashbook(cashbook.filter(c => c.id !== id)); };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name.trim() || !newStaff.role || !newStaff.pin.trim()) {
      showToast("Staff Name, Role, and PIN Password are strictly required to save.", "error");
      return;
    }
    
    if (isEditingStaff) {
      setStaffList(staffList.map(s => s.id === newStaff.id ? newStaff : s)); setIsEditingStaff(false);
    } else {
      setStaffList([{ ...newStaff, id: Date.now().toString() }, ...staffList]);
    }
    setNewStaff({ id: "", name: "", role: "Cashier", phone: "", email: "", pin: "", status: "Active" });
    staffNameRef.current?.focus(); showToast("Staff member saved securely!", "success");
  };
  const editStaff = (user: any) => { setNewStaff(user); setIsEditingStaff(true); staffNameRef.current?.focus(); };
  const deleteStaff = (id: string) => { if(confirm("Delete this staff member?")) setStaffList(staffList.filter(s => s.id !== id)); };

  const saveSettings = () => { setStoreSettings(tempSettings); setIsEditingSettings(false); showToast("Settings saved!", "success"); };
  const printReceipt = () => setTimeout(() => window.print(), 100); 

  // --- LOGIN LOCK SCREEN ---
  if (authReady && staffList.length > 0 && !currentUser) {
    return (
      <div className={`min-h-screen ${bgMain} flex items-center justify-center font-sans ${textMain} transition-colors duration-300 p-4`}>
        <div className={`p-8 rounded-3xl shadow-2xl border ${borderCard} ${bgCard} w-full max-w-sm text-center relative overflow-hidden`}>
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-400 to-rose-500"></div>
          <Lock className="w-16 h-16 text-orange-500 mx-auto mb-4 opacity-90" />
          <h2 className="text-2xl font-black mb-1 tracking-tight">{storeSettings.storeName}</h2>
          <p className={`text-sm ${textMuted} mb-8`}>Enter your assigned PIN to access POS</p>
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="password" value={pinInput} onChange={e => setPinInput(e.target.value)} autoFocus placeholder="••••" className={`w-full text-center text-3xl tracking-[1em] font-mono border-2 ${borderCard} ${bgInput} rounded-xl p-4 outline-none focus:border-orange-500 transition-all`} />
            <button type="submit" className="w-full text-white bg-slate-900 dark:bg-orange-600 hover:bg-slate-800 dark:hover:bg-orange-500 py-3.5 rounded-xl text-lg font-bold shadow-lg transition-transform active:scale-95">Unlock Terminal</button>
          </form>
        </div>

        {toast.show && (
          <div className={`fixed bottom-10 right-10 text-white px-6 py-3 rounded-xl shadow-2xl z-[100] flex items-center gap-2 animate-bounce ${toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'}`}>
            {toast.type === 'error' ? <X className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
            <span className="font-bold">{toast.msg}</span>
          </div>
        )}
      </div>
    );
  }

  // --- MAIN DASHBOARD LAYOUT ---
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
          <button onClick={() => setActiveTab("cashbook")} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition ${activeTab === "cashbook" ? "bg-slate-800 text-white" : "hover:bg-slate-800 hover:text-white"}`}>
            <div className="flex items-center gap-3"><BookOpen className="h-5 w-5 shrink-0" /> {isSidebarOpen && "Cash Book"}</div>
            {isSidebarOpen && <span className="text-[10px] bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded">F9</span>}
          </button>

          {/* MANAGER ONLY TABS */}
          {isManager && (
            <>
              <p className={`text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-4 px-2 ${!isSidebarOpen && 'hidden'}`}>Admin Controls</p>
              <button onClick={() => setActiveTab("purchases")} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition ${activeTab === "purchases" ? "bg-slate-800 text-white" : "hover:bg-slate-800 hover:text-white"}`}>
                <div className="flex items-center gap-3"><ShoppingCart className="h-5 w-5 shrink-0" /> {isSidebarOpen && "Purchases"}</div>
                {isSidebarOpen && <span className="text-[10px] bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded">F6</span>}
              </button>
              <button onClick={() => setActiveTab("reports")} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition ${activeTab === "reports" ? "bg-slate-800 text-white" : "hover:bg-slate-800 hover:text-white"}`}>
                <div className="flex items-center gap-3"><PieChart className="h-5 w-5 shrink-0" /> {isSidebarOpen && "Reports"}</div>
                {isSidebarOpen && <span className="text-[10px] bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded">F7</span>}
              </button>
              <button onClick={() => setActiveTab("catalog")} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition ${activeTab === "catalog" ? "bg-slate-800 text-white" : "hover:bg-slate-800 hover:text-white"}`}>
                <div className="flex items-center gap-3"><Utensils className="h-5 w-5 shrink-0" /> {isSidebarOpen && "Catalog"}</div>
                {isSidebarOpen && <span className="text-[10px] bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded">F4</span>}
              </button>
              <button onClick={() => setActiveTab("staff")} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition ${activeTab === "staff" ? "bg-slate-800 text-white" : "hover:bg-slate-800 hover:text-white"}`}>
                <div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 shrink-0" /> {isSidebarOpen && "Staff Mgt."}</div>
              </button>
              <button onClick={() => { setActiveTab("settings"); setTempSettings({...storeSettings}); setIsEditingSettings(false); }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition ${activeTab === "settings" ? "bg-slate-800 text-white" : "hover:bg-slate-800 hover:text-white"}`}>
                <div className="flex items-center gap-3"><Settings className="h-5 w-5 shrink-0" /> {isSidebarOpen && "Settings"}</div>
                {isSidebarOpen && <span className="text-[10px] bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded">F8</span>}
              </button>
            </>
          )}

          {currentUser && (
            <button onClick={handleLogout} className="w-full flex items-center justify-between px-3 py-2.5 mt-6 rounded-lg font-medium text-rose-500 hover:bg-rose-500/10 transition">
              <div className="flex items-center gap-3"><LogOut className="h-5 w-5 shrink-0" /> {isSidebarOpen && "Lock Terminal"}</div>
            </button>
          )}
        </nav>
        
        <div className="mt-auto p-4 border-t border-slate-800 text-center bg-slate-950">
          <p className={`text-[9px] text-slate-500 uppercase tracking-widest leading-relaxed ${!isSidebarOpen && 'hidden'}`}>Powered By<br/><span className="text-orange-500 font-bold text-[10px]">Xaifi Digital Marketing Agency</span></p>
          {!isSidebarOpen && <p className="text-[9px] text-orange-500 font-bold tracking-widest mx-auto" style={{writingMode: 'vertical-rl', transform: 'rotate(180deg)'}}>XAIFI DIGITAL</p>}
        </div>
      </aside>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 text-white flex justify-between p-2 z-50 border-t border-slate-800 overflow-x-auto gap-2">
        <button onClick={() => setActiveTab("pos")} className={`flex flex-col items-center p-2 min-w-[64px] rounded-lg ${activeTab === "pos" ? "bg-slate-800 text-orange-500" : "text-slate-400"}`}><ShoppingBag className="h-5 w-5" /><span className="text-[10px] mt-1 font-medium">POS</span></button>
        <button onClick={() => setActiveTab("sales")} className={`flex flex-col items-center p-2 min-w-[64px] rounded-lg ${activeTab === "sales" ? "bg-slate-800 text-orange-500" : "text-slate-400"}`}><Banknote className="h-5 w-5" /><span className="text-[10px] mt-1 font-medium">Sales</span></button>
        <button onClick={() => setActiveTab("cashbook")} className={`flex flex-col items-center p-2 min-w-[64px] rounded-lg ${activeTab === "cashbook" ? "bg-slate-800 text-orange-500" : "text-slate-400"}`}><BookOpen className="h-5 w-5" /><span className="text-[10px] mt-1 font-medium">Cash</span></button>
        {isManager && (
          <>
            <button onClick={() => setActiveTab("purchases")} className={`flex flex-col items-center p-2 min-w-[64px] rounded-lg ${activeTab === "purchases" ? "bg-slate-800 text-orange-500" : "text-slate-400"}`}><ShoppingCart className="h-5 w-5" /><span className="text-[10px] mt-1 font-medium">Purchases</span></button>
            <button onClick={() => setActiveTab("reports")} className={`flex flex-col items-center p-2 min-w-[64px] rounded-lg ${activeTab === "reports" ? "bg-slate-800 text-orange-500" : "text-slate-400"}`}><PieChart className="h-5 w-5" /><span className="text-[10px] mt-1 font-medium">Reports</span></button>
          </>
        )}
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
              {activeTab === 'purchases' && <span className="ml-3 text-xs font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">F6</span>}
              {activeTab === 'reports' && <span className="ml-3 text-xs font-semibold px-2 py-0.5 rounded bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400">F7</span>}
              {activeTab === 'settings' && <span className="ml-3 text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">F8</span>}
              {activeTab === 'cashbook' && <span className="ml-3 text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">F9</span>}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {activeUser && (
              <button onClick={handleLogout} className={`hidden lg:flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border ${borderCard} ${isDark ? 'bg-slate-800 hover:bg-rose-900/50 hover:text-rose-400 hover:border-rose-500/50' : 'bg-slate-100 hover:bg-rose-100 hover:text-rose-600 hover:border-rose-300'} transition-all group`} title="Click to Lock Terminal">
                <User className="h-3.5 w-3.5 text-orange-500 group-hover:hidden" />
                <LogOut className="h-3.5 w-3.5 text-rose-500 hidden group-hover:block" />
                <span>{activeUser.name} ({activeUser.role})</span>
              </button>
            )}
            <button onClick={() => setTheme(isDark ? "light" : "dark")} className={`p-2 rounded-full ${isDark ? 'bg-slate-800 text-orange-400' : 'bg-slate-100 text-slate-600'} transition-colors ml-2`}>
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </header>

        {/* ================= 1. POS TERMINAL ================= */}
        {activeTab === "pos" && (
          <div className="flex-1 flex flex-col lg:flex-row p-3 gap-4 overflow-hidden">
            <div className={`flex-1 flex flex-col gap-3 overflow-hidden ${bgCard} rounded-xl shadow-sm border ${borderCard} p-4`}>
              <div className="relative w-full max-w-2xl mx-auto shrink-0 mb-2 z-10">
                <Search className={`absolute left-3 top-2.5 h-5 w-5 ${textMuted}`} />
                <input 
                  ref={searchRef} type="text" placeholder="Search Menu (Alt+F)..." value={searchQuery} 
                  onChange={(e) => { setSearchQuery(e.target.value); setNavZone('grid'); setFocusedProductIndex(0); }} 
                  onKeyDown={(e) => { 
                    if (e.key === 'ArrowRight') { e.preventDefault(); nameRef.current?.focus(); } 
                    else if (e.key === 'ArrowDown' || e.key === 'Enter') { e.preventDefault(); searchRef.current?.blur(); setNavZone('grid'); if (filteredMenu.length > 0) setFocusedProductIndex(0); } 
                  }}
                  className={`w-full pl-10 p-2.5 border ${borderCard} rounded-xl ${bgInput} ${textMain} text-sm focus:border-orange-500 outline-none shadow-inner transition-colors`} 
                />
              </div>
              
              <div className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5 pb-4 overflow-y-auto content-start px-2 pt-2">
                {filteredMenu.map((item, index) => {
                  const isFocused = navZone === 'grid' && focusedProductIndex === index;
                  return (
                    <div 
                      key={item.id} 
                      onClick={() => { addToCart(item); setNavZone('grid'); setFocusedProductIndex(index); }} 
                      className={`text-left cursor-pointer transition-all duration-150 flex flex-col overflow-hidden group rounded-xl relative 
                        ${isFocused ? 'ring-4 ring-orange-500 bg-orange-50 dark:bg-slate-700 scale-100 z-10' : `border ${borderCard} ${isDark ? 'bg-slate-800' : 'bg-white'} hover:border-orange-400`}`}
                    >
                      <div className="aspect-square w-full relative overflow-hidden bg-slate-200 dark:bg-slate-900">
                        {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" /> : <div className="flex items-center justify-center h-full text-slate-400"><ImageIcon className="h-8 w-8" /></div>}
                        <div className="absolute top-2 right-2 bg-orange-500 text-white rounded-full p-1 shadow-md opacity-90 group-hover:opacity-100 group-hover:scale-110 transition z-10"><Plus className="h-4 w-4" /></div>
                      </div>
                      <div className={`p-2.5 flex flex-col justify-between flex-1 ${!isFocused && (isDark ? 'bg-slate-800' : 'bg-white')}`}>
                        <p className="font-semibold text-xs sm:text-sm line-clamp-2 leading-tight">{item.name}</p>
                        <p className="text-orange-500 font-bold mt-1 text-sm">{storeSettings.currency}{item.price.toFixed(0)}</p>
                      </div>
                    </div>
                  )
                })}
                
                {filteredMenu.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center mt-20 text-center opacity-50">
                    <PackagePlus className="h-12 w-12 mb-4" />
                    <p className="text-lg font-bold">No Products Available</p>
                    <p className="text-sm mt-1 max-w-sm">If this is a new setup, please log in as an Owner or Manager to add items via the Catalog tab.</p>
                  </div>
                )}
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

        {/* ================= 2. SALES DASHBOARD ================= */}
        {activeTab === "sales" && (
          <div className="flex-1 flex flex-col p-4 md:p-6 gap-4 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
              <button onClick={() => setSalesTypeFilter(salesTypeFilter === "Sale" ? "all" : "Sale")} className={`p-4 rounded-xl border ${salesTypeFilter === "Sale" ? 'border-emerald-500 ring-1 ring-emerald-500' : borderCard} ${bgCard} shadow-sm flex flex-col justify-center relative overflow-hidden transition-all text-left hover:border-emerald-400`}>
                <div className="absolute right-[-10px] top-[-10px] opacity-5 text-emerald-500"><ArrowUpRight className="h-32 w-32" /></div>
                <p className={`text-sm font-semibold ${textMuted} mb-1 uppercase tracking-wider`}>Total Sales</p>
                <h3 className="text-3xl font-bold text-emerald-500">{storeSettings.currency}{totalSalesAmt.toLocaleString()}</h3>
              </button>
              <button onClick={() => setSalesTypeFilter(salesTypeFilter === "Return" ? "all" : "Return")} className={`p-4 rounded-xl border ${salesTypeFilter === "Return" ? 'border-red-500 ring-1 ring-red-500' : borderCard} ${bgCard} shadow-sm flex flex-col justify-center relative overflow-hidden transition-all text-left hover:border-red-400`}>
                <div className="absolute right-[-10px] top-[-10px] opacity-5 text-red-500"><ArrowDownRight className="h-32 w-32" /></div>
                <p className={`text-sm font-semibold ${textMuted} mb-1 uppercase tracking-wider`}>Sales Returns</p>
                <h3 className="text-3xl font-bold text-red-500">{storeSettings.currency}{totalReturnsAmt.toLocaleString()}</h3>
              </button>
              <div className={`p-4 rounded-xl border ${borderCard} ${bgCard} shadow-sm flex flex-col justify-center relative overflow-hidden`}>
                <div className="absolute right-[-10px] top-[-10px] opacity-5 text-orange-500"><Tag className="h-32 w-32" /></div>
                <p className={`text-sm font-semibold ${textMuted} mb-1 uppercase tracking-wider`}>Discounts Given</p>
                <h3 className="text-3xl font-bold text-orange-500">{storeSettings.currency}{totalDiscountAmt.toLocaleString()}</h3>
              </div>
            </div>

            <div className={`flex flex-col sm:flex-row gap-3 shrink-0 p-3 rounded-xl border ${borderCard} ${bgCard} shadow-sm`}>
              <div className="relative flex-1">
                <Search className={`absolute left-3 top-2.5 h-4 w-4 ${textMuted}`} />
                <input ref={salesSearchRef} type="text" placeholder="Search by Invoice, Name, Phone, or Staff..." value={salesSearchQuery} onChange={(e) => { setSalesSearchQuery(e.target.value); setFocusedSaleIndex(-1); }} onKeyDown={(e) => { if(e.key === 'ArrowDown') { e.preventDefault(); setFocusedSaleIndex(0); salesSearchRef.current?.blur(); } }} className={`w-full pl-9 p-2 border ${borderCard} rounded-lg ${bgInput} ${textMain} text-sm focus:border-orange-500 outline-none`} />
              </div>
              <div className="relative w-full sm:w-48">
                <Calendar className={`absolute left-3 top-2.5 h-4 w-4 ${textMuted}`} />
                <select value={salesFilter} onChange={(e) => { setSalesFilter(e.target.value as any); setFocusedSaleIndex(-1); }} className={`w-full pl-9 p-2 border ${borderCard} rounded-lg ${bgInput} ${textMain} text-sm focus:border-orange-500 outline-none appearance-none`}>
                  <option value="all">All Time</option><option value="today">Today</option><option value="yesterday">Yesterday</option><option value="month">This Month</option>
                </select>
              </div>
            </div>

            <div className={`flex-1 rounded-xl border ${borderCard} ${bgCard} shadow-sm overflow-hidden flex flex-col relative`}>
              <div className="overflow-x-auto overflow-y-auto flex-1">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className={`sticky top-0 z-10 ${isDark ? 'bg-slate-900' : 'bg-slate-100'} ${textMuted} text-[11px] uppercase tracking-wider border-b ${borderCard} shadow-sm`}>
                    <tr><th className="px-4 py-3 font-semibold">Invoice #</th><th className="px-4 py-3 font-semibold">Date & Time</th><th className="px-4 py-3 font-semibold">Customer Details</th><th className="px-4 py-3 font-semibold">Recorded By</th><th className="px-4 py-3 font-semibold">Type</th><th className="px-4 py-3 font-semibold text-right">Amount</th></tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
                    {filteredSales.map((sale, index) => {
                      const isFocused = focusedSaleIndex === index;
                      const isReturn = sale.type === "Return";
                      return (
                        <tr key={sale.orderId} onClick={() => setSelectedReceipt(sale)} className={`cursor-pointer transition-colors ${isFocused ? (isDark ? 'bg-orange-500/20' : 'bg-orange-50') : (isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50')}`}>
                          <td className="px-4 py-3 font-mono font-medium text-xs">{sale.orderId}</td>
                          <td className={`px-4 py-3 ${textMuted}`}>{format(new Date(sale.date), "dd MMM yyyy, HH:mm")}</td>
                          <td className="px-4 py-3"><p className="font-semibold text-sm">{sale.customer.name}</p><p className={`text-xs ${textMuted}`}>{sale.customer.phone} • {sale.customer.address}</p></td>
                          <td className={`px-4 py-3 ${textMuted}`}>{sale.recordedBy}</td>
                          <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isReturn ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>{sale.type}</span></td>
                          <td className={`px-4 py-3 text-right font-bold ${isReturn ? 'text-red-500' : 'text-emerald-500'}`}>{isReturn ? "-" : ""}{sale.currency}{sale.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                        </tr>
                      )
                    })}
                    {filteredSales.length === 0 && (<tr><td colSpan={6} className={`px-4 py-10 text-center ${textMuted}`}>No records found.</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
            
            {selectedReceipt && (
              <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className={`relative w-full max-w-md ${bgCard} border ${borderCard} rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-full`}>
                  <button onClick={closeSalesModal} className="absolute top-4 right-4 p-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded-full transition z-10"><X className="h-4 w-4" /></button>
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
                    <button onClick={closeSalesModal} className={`flex-1 py-2 rounded-lg font-semibold text-sm border ${borderCard} hover:bg-slate-200 dark:hover:bg-slate-800 transition`}>Close</button>
                    <button onClick={() => setTimeout(() => window.print(), 100)} className="flex-1 py-2 rounded-lg font-semibold text-sm bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition flex items-center justify-center gap-2"><Printer className="h-4 w-4" /> Print Copy</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= 3. PURCHASES DASHBOARD ================= */}
        {activeTab === "purchases" && isManager && (
          <div className="flex-1 flex flex-col p-4 md:p-6 gap-4 overflow-hidden">
            
            <div className="flex flex-col xl:flex-row gap-4 shrink-0">
              <div className={`flex-[2] p-4 rounded-xl shadow-sm border transition-colors ${isEditingPurchase ? 'border-blue-500 ring-1 ring-blue-500' : borderCard} ${bgCard}`}>
                <div className="flex justify-between items-center mb-3">
                  <h2 className="font-bold text-sm flex items-center gap-2 text-blue-500"><ShoppingCart className="h-4 w-4"/> {isEditingPurchase ? "Edit Purchase Order" : "Record New Purchase"}</h2>
                  {isEditingPurchase && <button onClick={() => {setIsEditingPurchase(false); setNewPur({orderId:"", supplierName:"", contact:"", itemName:"", qty:"1", unit:"pcs", total:"", paid:"", status:"Paid"});}} className={`text-xs font-semibold ${textMuted} hover:${textMain} border ${borderCard} px-2 py-1 rounded-lg`}>Cancel Edit</button>}
                </div>
                <form onSubmit={handleSavePurchase} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-x-4 gap-y-3 items-end">
                  <div className="lg:col-span-2"><label className={`block text-[10px] font-bold uppercase mb-1 ${textMuted}`}>Supplier Name</label><input ref={purSupplierRef} type="text" value={newPur.supplierName} onChange={e => setNewPur({...newPur, supplierName: e.target.value})} onKeyDown={(e) => { if(e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); purContactRef.current?.focus(); } }} className={`w-full border ${borderCard} ${bgInput} rounded-lg p-1.5 text-sm outline-none focus:border-blue-500`} required /></div>
                  <div className="lg:col-span-2"><label className={`block text-[10px] font-bold uppercase mb-1 ${textMuted}`}>Contact / Phone</label><input ref={purContactRef} type="text" value={newPur.contact} onChange={e => setNewPur({...newPur, contact: e.target.value})} onKeyDown={(e) => { if(e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); purItemRef.current?.focus(); } if(e.key === 'ArrowUp') { e.preventDefault(); purSupplierRef.current?.focus(); } }} className={`w-full border ${borderCard} ${bgInput} rounded-lg p-1.5 text-sm outline-none focus:border-blue-500`} /></div>
                  <div className="lg:col-span-2"><label className={`block text-[10px] font-bold uppercase mb-1 ${textMuted}`}>Item Buy (Name)</label><input ref={purItemRef} type="text" value={newPur.itemName} onChange={e => setNewPur({...newPur, itemName: e.target.value})} onKeyDown={(e) => { if(e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); purQtyRef.current?.focus(); } if(e.key === 'ArrowUp') { e.preventDefault(); purContactRef.current?.focus(); } }} className={`w-full border ${borderCard} ${bgInput} rounded-lg p-1.5 text-sm outline-none focus:border-blue-500`} required /></div>
                  
                  <div className="flex gap-2 lg:col-span-2">
                    <div className="flex-[2]"><label className={`block text-[10px] font-bold uppercase mb-1 ${textMuted}`}>Qty</label><input ref={purQtyRef} type="number" step="any" value={newPur.qty} onChange={e => setNewPur({...newPur, qty: e.target.value})} onKeyDown={(e) => { if(e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); purUnitRef.current?.focus(); } if(e.key === 'ArrowUp') { e.preventDefault(); purItemRef.current?.focus(); } }} className={`w-full border ${borderCard} ${bgInput} rounded-lg p-1.5 text-sm outline-none focus:border-blue-500`} required /></div>
                    <div className="flex-1">
                      <label className={`block text-[10px] font-bold uppercase mb-1 ${textMuted}`}>Unit</label>
                      <select ref={purUnitRef} value={newPur.unit || "pcs"} onChange={e => setNewPur({...newPur, unit: e.target.value})} onKeyDown={(e) => { if(e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); purTotalRef.current?.focus(); } if(e.key === 'ArrowUp') { e.preventDefault(); purQtyRef.current?.focus(); } }} className={`w-full border ${borderCard} ${bgInput} rounded-lg p-1.5 text-sm outline-none focus:border-blue-500 capitalize`}>
                        <option value="pcs">Pcs</option><option value="kg">Kg</option><option value="litre">Litre</option><option value="pack">Pack</option><option value="box">Box</option><option value="dozen">Dozen</option>
                      </select>
                    </div>
                  </div>

                  <div className="lg:col-span-2"><label className={`block text-[10px] font-bold uppercase mb-1 ${textMuted}`}>Total Amount</label><input ref={purTotalRef} type="number" step="0.01" value={newPur.total} onChange={e => setNewPur({...newPur, total: e.target.value})} onKeyDown={(e) => { if(e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); purPaidRef.current?.focus(); } if(e.key === 'ArrowUp') { e.preventDefault(); purUnitRef.current?.focus(); } }} className={`w-full border ${borderCard} ${bgInput} rounded-lg p-1.5 text-sm outline-none focus:border-blue-500`} required /></div>
                  <div className="lg:col-span-2"><label className={`block text-[10px] font-bold uppercase mb-1 ${textMuted}`}>Amount Paid</label><input ref={purPaidRef} type="number" step="0.01" value={newPur.paid} onChange={e => setNewPur({...newPur, paid: e.target.value})} onKeyDown={(e) => { if(e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); purSubmitRef.current?.focus(); } if(e.key === 'ArrowUp') { e.preventDefault(); purTotalRef.current?.focus(); } }} className={`w-full border ${borderCard} ${bgInput} rounded-lg p-1.5 text-sm outline-none focus:border-blue-500`} required /></div>
                  <div className="lg:col-span-2">
                    <label className={`block text-[10px] font-bold uppercase mb-1 ${textMuted}`}>Credit (Auto)</label>
                    <input disabled type="text" value={storeSettings.currency + ((parseFloat(newPur.total)||0) - (parseFloat(newPur.paid)||0)).toFixed(2)} className={`w-full border ${borderCard} bg-slate-100 dark:bg-slate-800 text-rose-500 font-bold rounded-lg p-1.5 text-sm outline-none`} />
                  </div>
                  <button ref={purSubmitRef} type="submit" onKeyDown={(e) => { if(e.key === 'ArrowUp') { e.preventDefault(); purPaidRef.current?.focus(); } }} className={`lg:col-span-2 text-white py-2 rounded-lg text-sm font-bold shadow-md w-full ${isEditingPurchase ? 'bg-blue-600 hover:bg-blue-500' : 'bg-slate-800 hover:bg-slate-700'}`}>{isEditingPurchase ? "Update Record" : "+ Add Purchase"}</button>
                </form>
              </div>

              <div className="flex-1 flex xl:flex-col gap-4">
                <button onClick={() => setPurchaseStatusFilter(purchaseStatusFilter === "all" ? "all" : "all")} className={`flex-1 p-4 rounded-xl border ${purchaseStatusFilter === "all" ? 'border-blue-500 ring-1 ring-blue-500' : borderCard} ${bgCard} shadow-sm flex flex-col justify-center relative overflow-hidden transition-all text-left hover:border-blue-400`}>
                  <div className="absolute right-[-10px] top-[-10px] opacity-5 text-blue-500"><ArrowDownLeft className="h-24 w-24" /></div>
                  <p className={`text-xs font-semibold ${textMuted} mb-1 uppercase tracking-wider`}>Total Purchases</p>
                  <h3 className="text-2xl font-bold text-blue-500">{storeSettings.currency}{totalPurchasesAmt.toLocaleString()}</h3>
                </button>
                <button onClick={() => setPurchaseStatusFilter(purchaseStatusFilter === "Pending" ? "all" : "Pending")} className={`flex-1 p-4 rounded-xl border ${purchaseStatusFilter === "Pending" ? 'border-orange-500 ring-1 ring-orange-500' : borderCard} ${bgCard} shadow-sm flex flex-col justify-center relative overflow-hidden transition-all text-left hover:border-orange-400`}>
                  <div className="absolute right-[-10px] top-[-10px] opacity-5 text-orange-500"><Clock className="h-24 w-24" /></div>
                  <p className={`text-xs font-semibold ${textMuted} mb-1 uppercase tracking-wider`}>Outstanding Payables</p>
                  <h3 className="text-2xl font-bold text-orange-500">{storeSettings.currency}{totalPendingAmt.toLocaleString()}</h3>
                </button>
              </div>
            </div>

            <div className={`flex flex-col sm:flex-row gap-3 shrink-0 p-3 rounded-xl border ${borderCard} ${bgCard} shadow-sm`}>
              <div className="relative flex-1">
                <Search className={`absolute left-3 top-2.5 h-4 w-4 ${textMuted}`} />
                <input ref={purchaseSearchRef} type="text" placeholder="Search by PO #, Supplier, Item Buy, or Contact..." value={purchaseSearchQuery} onChange={(e) => { setPurchaseSearchQuery(e.target.value); setFocusedPurchaseIndex(-1); }} onKeyDown={(e) => { if(e.key === 'ArrowDown') { e.preventDefault(); setFocusedPurchaseIndex(0); purchaseSearchRef.current?.blur(); } }} className={`w-full pl-9 p-2 border ${borderCard} rounded-lg ${bgInput} ${textMain} text-sm focus:border-blue-500 outline-none`} />
              </div>
              <div className="relative w-full sm:w-48">
                <Calendar className={`absolute left-3 top-2.5 h-4 w-4 ${textMuted}`} />
                <select value={purchaseFilter} onChange={(e) => { setPurchaseFilter(e.target.value as any); setFocusedPurchaseIndex(-1); }} className={`w-full pl-9 p-2 border ${borderCard} rounded-lg ${bgInput} ${textMain} text-sm focus:border-blue-500 outline-none appearance-none`}>
                  <option value="all">All Time</option><option value="today">Today</option><option value="yesterday">Yesterday</option><option value="month">This Month</option>
                </select>
              </div>
            </div>

            <div className={`flex-1 rounded-xl border ${borderCard} ${bgCard} shadow-sm overflow-hidden flex flex-col relative`}>
              <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className={`sticky top-0 z-10 ${isDark ? 'bg-slate-900' : 'bg-slate-100'} ${textMuted} text-[11px] uppercase tracking-wider border-b ${borderCard} shadow-sm`}>
                    <tr>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Supplier</th>
                      <th className="px-4 py-3 font-semibold">Item Buy</th>
                      <th className="px-4 py-3 font-semibold">Qty</th>
                      <th className="px-4 py-3 font-semibold text-right">Total</th>
                      <th className="px-4 py-3 font-semibold text-right">Paid</th>
                      <th className="px-4 py-3 font-semibold text-right">Credit</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
                    {filteredPurchases.map((pur, index) => {
                      const isFocused = focusedPurchaseIndex === index;
                      const isPending = pur.status === "Pending" || pur.credit > 0;
                      return (
                        <tr key={pur.orderId} onClick={() => setSelectedPurchase(pur)} className={`cursor-pointer transition-colors ${isFocused ? (isDark ? 'bg-blue-500/20' : 'bg-blue-50') : (isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50')}`}>
                          <td className={`px-4 py-3 ${textMuted}`}>{format(new Date(pur.date), "dd MMM yy")}</td>
                          <td className="px-4 py-3 font-medium">{pur.supplier.name}</td>
                          <td className="px-4 py-3 font-semibold">{pur.items?.[0]?.name || "N/A"}</td>
                          <td className={`px-4 py-3 ${textMuted}`}>{pur.items?.[0]?.qty || "1"} <span className="capitalize">{pur.items?.[0]?.unit || ""}</span></td>
                          <td className={`px-4 py-3 text-right font-bold text-slate-700 dark:text-slate-300`}>{pur.total.toLocaleString()}</td>
                          <td className={`px-4 py-3 text-right font-bold text-emerald-500`}>{pur.paid !== undefined ? pur.paid.toLocaleString() : pur.total.toLocaleString()}</td>
                          <td className={`px-4 py-3 text-right font-bold ${pur.credit > 0 ? 'text-rose-500' : 'text-slate-400'}`}>{pur.credit > 0 ? pur.credit.toLocaleString() : "-"}</td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <button onClick={(e) => { e.stopPropagation(); editPurchase(pur); }} className={`text-blue-500 p-2 rounded-lg transition ${isDark ? 'hover:bg-slate-800' : 'hover:bg-blue-50'}`}><Edit className="h-4 w-4" /></button>
                            <button onClick={(e) => { e.stopPropagation(); deletePurchase(pur.orderId); }} className={`text-red-500 p-2 rounded-lg transition ${isDark ? 'hover:bg-slate-800' : 'hover:bg-red-50'}`}><Trash2 className="h-4 w-4" /></button>
                          </td>
                        </tr>
                      )
                    })}
                    {filteredPurchases.length === 0 && (<tr><td colSpan={8} className={`px-4 py-10 text-center ${textMuted}`}>No purchase records found.</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Modal Overlay for Purchase Details */}
            {selectedPurchase && (
              <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className={`relative w-full max-w-md ${bgCard} border ${borderCard} rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-full`}>
                  <button onClick={closePurchaseModal} className="absolute top-4 right-4 p-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded-full transition z-10"><X className="h-4 w-4" /></button>
                  <div className={`p-6 border-b ${borderCard} bg-slate-100 dark:bg-slate-950 text-center`}>
                    <h2 className="font-bold text-xl uppercase tracking-wider">{storeSettings.storeName}</h2>
                    <p className={`text-xs mt-1 ${textMuted}`}>Purchase Order • Press ESC to close</p>
                  </div>
                  <div className="p-6 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><p className={`text-[10px] uppercase font-bold ${textMuted}`}>PO Number</p><p className="font-mono font-medium">{selectedPurchase.orderId}</p></div>
                      <div><p className={`text-[10px] uppercase font-bold ${textMuted}`}>Date & Time</p><p>{format(new Date(selectedPurchase.date), "dd MMM yyyy, HH:mm")}</p></div>
                      <div><p className={`text-[10px] uppercase font-bold ${textMuted}`}>Supplier</p><p className="font-semibold">{selectedPurchase.supplier.name}</p></div>
                      <div><p className={`text-[10px] uppercase font-bold ${textMuted}`}>Contact</p><p>{selectedPurchase.supplier.contact || "N/A"}</p></div>
                    </div>
                    <div className={`border-t border-b ${borderCard} py-3`}>
                      <p className={`text-[10px] uppercase font-bold ${textMuted} mb-2`}>Received Items</p>
                      <table className="w-full text-sm">
                        <tbody>
                          {selectedPurchase.items.map((item: any, i: number) => (
                            <tr key={i} className="border-b border-dashed border-slate-200 dark:border-slate-800 last:border-0">
                              <td className={`py-1.5 w-12 font-semibold ${textMuted}`}>{item.qty} <span className="capitalize">{item.unit || ""}</span></td>
                              <td className="py-1.5 font-medium">{item.name}</td>
                              <td className="py-1.5 text-right whitespace-nowrap">{selectedPurchase.currency}{(item.price * item.qty).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="space-y-1.5 text-sm border-t border-slate-200 dark:border-slate-800 pt-4">
                      <div className={`flex justify-between font-bold text-xl pt-2 mt-2 border-t ${borderCard} text-blue-500`}>
                        <span>TOTAL COST</span>
                        <span>{selectedPurchase.currency}{selectedPurchase.total.toFixed(2)}</span>
                      </div>
                      <div className={`flex justify-between font-semibold mt-1 text-emerald-500`}>
                        <span>PAID AMOUNT</span>
                        <span>{selectedPurchase.currency}{(selectedPurchase.paid !== undefined ? selectedPurchase.paid : selectedPurchase.total).toFixed(2)}</span>
                      </div>
                      {selectedPurchase.credit > 0 && (
                        <div className={`flex justify-between font-semibold mt-1 text-rose-500`}>
                          <span>CREDIT (DUE)</span>
                          <span>{selectedPurchase.currency}{selectedPurchase.credit.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={`p-4 border-t ${borderCard} ${bgInput} flex justify-between gap-3`}>
                    <button onClick={closePurchaseModal} className={`flex-1 py-2 rounded-lg font-semibold text-sm border ${borderCard} hover:bg-slate-200 dark:hover:bg-slate-800 transition`}>Close</button>
                    <button onClick={() => setTimeout(() => window.print(), 100)} className="flex-1 py-2 rounded-lg font-semibold text-sm bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition flex items-center justify-center gap-2"><Printer className="h-4 w-4" /> Print Copy</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= 4. FINANCIAL REPORTS ================= */}
        {activeTab === "reports" && isManager && (
          <div className="flex-1 flex flex-col p-4 md:p-6 gap-6 overflow-y-auto">
            <div className="flex items-center gap-2 mb-2"><PieChart className="h-6 w-6 text-indigo-500" /><h2 className="text-2xl font-bold">Financial Overview (All Time)</h2></div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className={`p-5 rounded-xl border ${borderCard} ${bgCard} shadow-sm flex flex-col`}>
                <p className={`text-xs font-bold ${textMuted} mb-2 uppercase tracking-wider`}>Gross Revenue</p>
                <h3 className="text-3xl font-bold text-emerald-500">{storeSettings.currency}{allTimeSales.toLocaleString()}</h3>
                <p className={`text-xs mt-2 ${textMuted}`}>Total sales excluding returns.</p>
              </div>
              <div className={`p-5 rounded-xl border ${borderCard} ${bgCard} shadow-sm flex flex-col`}>
                <p className={`text-xs font-bold ${textMuted} mb-2 uppercase tracking-wider`}>Cost of Purchases</p>
                <h3 className="text-3xl font-bold text-blue-500">{storeSettings.currency}{allTimePurchases.toLocaleString()}</h3>
                <p className={`text-xs mt-2 ${textMuted}`}>Total supplier and inventory cost.</p>
              </div>
              <div className={`p-5 rounded-xl border ${borderCard} ${bgCard} shadow-sm flex flex-col`}>
                <p className={`text-xs font-bold ${textMuted} mb-2 uppercase tracking-wider`}>Operational Expenses</p>
                <h3 className="text-3xl font-bold text-rose-500">{storeSettings.currency}{allTimeExpenses.toLocaleString()}</h3>
                <p className={`text-xs mt-2 ${textMuted}`}>Bills, salaries, and other costs.</p>
              </div>
              <div className={`p-5 rounded-xl border-2 ${netProfit >= 0 ? 'border-emerald-500 bg-emerald-500/10' : 'border-rose-500 bg-rose-500/10'} shadow-md flex flex-col relative overflow-hidden`}>
                <div className="absolute -right-4 -bottom-4 opacity-10"><PieChart className="h-32 w-32" /></div>
                <p className={`text-xs font-bold ${netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'} mb-2 uppercase tracking-wider`}>Net Profit</p>
                <h3 className={`text-4xl font-black ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{storeSettings.currency}{netProfit.toLocaleString()}</h3>
              </div>
            </div>

            <div className={`rounded-xl border ${borderCard} ${bgCard} shadow-sm overflow-hidden flex flex-col`}>
              <div className={`p-4 border-b ${borderCard} bg-slate-100 dark:bg-slate-900`}><h3 className="font-bold text-sm uppercase tracking-wider">Transaction Ledger</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className={`${textMuted} text-[11px] uppercase tracking-wider border-b ${borderCard}`}>
                    <tr><th className="px-4 py-3 font-semibold">Date</th><th className="px-4 py-3 font-semibold">Reference</th><th className="px-4 py-3 font-semibold">Type</th><th className="px-4 py-3 font-semibold text-right">Inflow</th><th className="px-4 py-3 font-semibold text-right">Outflow</th></tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
                    {[
                      ...salesHistory.map(s => ({ date: s.date, ref: s.orderId, type: s.type, in: s.type === 'Sale' ? s.total : 0, out: s.type === 'Return' ? s.total : 0 })),
                      ...purchasesHistory.map(p => ({ date: p.date, ref: p.orderId, type: "Purchase", in: 0, out: p.total })),
                      ...expenses.map(e => ({ date: e.date, ref: e.category, type: "Expense", in: 0, out: e.amount }))
                    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((txn, i) => (
                      <tr key={i} className={isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}>
                        <td className={`px-4 py-3 ${textMuted}`}>{format(new Date(txn.date), "dd MMM yyyy")}</td>
                        <td className="px-4 py-3 font-mono font-medium text-xs">{txn.ref}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${txn.type === 'Sale' ? 'bg-emerald-100 text-emerald-600' : txn.type === 'Purchase' ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'}`}>{txn.type}</span></td>
                        <td className={`px-4 py-3 text-right font-bold text-emerald-500`}>{txn.in > 0 ? `${storeSettings.currency}${txn.in.toLocaleString()}` : '-'}</td>
                        <td className={`px-4 py-3 text-right font-bold text-rose-500`}>{txn.out > 0 ? `${storeSettings.currency}${txn.out.toLocaleString()}` : '-'}</td>
                      </tr>
                    ))}
                    {(salesHistory.length === 0 && purchasesHistory.length === 0 && expenses.length === 0) && (<tr><td colSpan={5} className={`px-4 py-10 text-center ${textMuted}`}>No transactions recorded yet.</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= 5. CASH BOOK ================= */}
        {activeTab === "cashbook" && (
          <div className="flex-1 flex flex-col p-4 md:p-6 gap-4 overflow-hidden">
            <div className={`p-4 rounded-xl shadow-sm border ${borderCard} ${bgCard} shrink-0`}>
              <h2 className="font-bold text-md flex items-center gap-2 mb-3"><BookOpen className="h-5 w-5"/> Record Manual Cash Entry</h2>
              <form onSubmit={handleSaveCb} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                <div className="md:col-span-2"><label className={`block text-[10px] font-bold uppercase mb-1 ${textMuted}`}>Description</label><input type="text" value={newCb.desc} onChange={e => setNewCb({...newCb, desc: e.target.value})} className={`w-full border ${borderCard} ${bgInput} rounded-lg p-2 text-sm outline-none`} required /></div>
                <div><label className={`block text-[10px] font-bold uppercase mb-1 ${textMuted}`}>Type</label><select value={newCb.type} onChange={e => setNewCb({...newCb, type: e.target.value})} className={`w-full border ${borderCard} ${bgInput} rounded-lg p-2 text-sm outline-none`}><option value="In">Cash IN</option><option value="Out">Cash OUT</option></select></div>
                <div><label className={`block text-[10px] font-bold uppercase mb-1 ${textMuted}`}>Amount</label><input type="number" step="0.01" value={newCb.amount} onChange={e => setNewCb({...newCb, amount: e.target.value})} className={`w-full border ${borderCard} ${bgInput} rounded-lg p-2 text-sm outline-none`} required /></div>
                <button type="submit" className={`text-white py-2 rounded-lg text-sm font-bold shadow-md w-full bg-slate-800 hover:bg-slate-700`}>+ Add Entry</button>
              </form>
            </div>

            <div className={`flex-1 rounded-xl border ${borderCard} ${bgCard} shadow-sm overflow-hidden flex flex-col relative`}>
              <div className="overflow-x-auto overflow-y-auto flex-1">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className={`sticky top-0 z-10 ${isDark ? 'bg-slate-900' : 'bg-slate-100'} ${textMuted} text-[11px] uppercase tracking-wider border-b ${borderCard} shadow-sm`}>
                    <tr><th className="px-4 py-3 font-semibold">Date</th><th className="px-4 py-3 font-semibold">Description</th><th className="px-4 py-3 font-semibold text-right">Cash In</th><th className="px-4 py-3 font-semibold text-right">Cash Out</th><th className="px-4 py-3 font-semibold text-right">Balance</th><th className="px-4 py-3 font-semibold text-right">Actions</th></tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
                    {cashbookWithBalance.map((cb, index) => {
                      const isFocused = focusedCbIndex === index;
                      return (
                        <tr key={cb.id} className={`transition-colors ${isFocused ? (isDark ? 'bg-indigo-500/20' : 'bg-indigo-50') : (isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50')}`}>
                          <td className={`px-4 py-3 ${textMuted}`}>{format(new Date(cb.date), "dd MMM yyyy, HH:mm")}</td>
                          <td className="px-4 py-3 font-medium">{cb.desc}</td>
                          <td className={`px-4 py-3 text-right font-bold text-emerald-500`}>{cb.type === "In" ? `${storeSettings.currency}${cb.amount.toLocaleString()}` : '-'}</td>
                          <td className={`px-4 py-3 text-right font-bold text-rose-500`}>{cb.type === "Out" ? `${storeSettings.currency}${cb.amount.toLocaleString()}` : '-'}</td>
                          <td className={`px-4 py-3 text-right font-bold ${cb.balance >= 0 ? 'text-blue-500' : 'text-rose-500'}`}>{storeSettings.currency}{cb.balance.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right"><button onClick={() => deleteCb(cb.id)} className={`text-red-500 p-2 rounded-lg transition ${isDark ? 'hover:bg-slate-800' : 'hover:bg-red-50'}`}><Trash2 className="h-4 w-4" /></button></td>
                        </tr>
                      )
                    })}
                    {cashbook.length === 0 && (<tr><td colSpan={6} className={`px-4 py-10 text-center ${textMuted}`}>No manual cash book entries found.</td></tr>)}
                  </tbody>
                </table>
              </div>
              <div className={`p-2 border-t ${borderCard} ${bgInput} text-center text-[10px] ${textMuted}`}>
                Use <kbd className="border rounded px-1.5 py-0.5 mx-1">↑</kbd> <kbd className="border rounded px-1.5 py-0.5 mx-1">↓</kbd> to navigate.
              </div>
            </div>
          </div>
        )}

        {/* ================= 6. CATALOG ADMIN ================= */}
        {activeTab === "catalog" && isManager && (
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
                    <span className={`relative z-10 flex items-center px-2 py-0.5 rounded ${isDark ? 'bg-slate-900/80 text-slate-300' : 'bg-white/80 text-slate-600'} backdrop-blur-sm`}><Upload className="h-4 w-4 mr-2" /> {newProd.image ? "Change" : "Upload File"}</span>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, (val) => setNewProd({...newProd, image: val}))} className="hidden" />
                  </label>
                </div>
                <button type="submit" className={`md:col-span-2 text-white py-2.5 rounded-lg text-sm font-bold shadow-md w-full ${isEditingProduct ? 'bg-orange-600 hover:bg-orange-500' : 'bg-slate-800 hover:bg-slate-700'}`}>{isEditingProduct ? "Update Product" : "+ Add Product"}</button>
              </form>
            </div>
            
            <div className={`rounded-xl shadow-sm border ${borderCard} overflow-hidden ${bgCard}`}>
              <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
                <table className="w-full text-left text-sm"><thead className={`${isDark ? 'bg-slate-900' : 'bg-slate-50'} ${textMuted} text-xs uppercase border-b ${borderCard}`}><tr><th className="p-4 w-16">Image</th><th className="p-4">Name</th><th className="p-4">Price</th><th className="p-4 text-right">Actions</th></tr></thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                    {menuItems.map((item, index) => {
                      const isFocused = focusedCatalogIndex === index;
                      return (
                        <tr key={item.id} onClick={() => editProduct(item)} className={`cursor-pointer transition-colors ${isFocused ? (isDark ? 'bg-orange-500/20' : 'bg-orange-50') : (isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50')}`}>
                          <td className="p-3"><img src={item.image || "/placeholder.jpg"} className={`w-10 h-10 rounded-lg object-cover border ${borderCard}`} alt=""/></td>
                          <td className="p-3 font-semibold">{item.name}</td>
                          <td className={`p-3 font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{storeSettings.currency}{item.price.toFixed(2)}</td>
                          <td className="p-3 text-right space-x-2">
                            <button onClick={(e) => { e.stopPropagation(); editProduct(item); }} className={`text-blue-500 p-2 rounded-lg transition ${isDark ? 'hover:bg-slate-800' : 'hover:bg-blue-50'}`}><Edit className="h-4 w-4" /></button>
                            <button onClick={(e) => { e.stopPropagation(); deleteProduct(item.id); }} className={`text-red-500 p-2 rounded-lg transition ${isDark ? 'hover:bg-slate-800' : 'hover:bg-red-50'}`}><Trash2 className="h-4 w-4" /></button>
                          </td>
                        </tr>
                      )
                    })}
                    {menuItems.length === 0 && <tr><td colSpan={4} className={`px-4 py-10 text-center ${textMuted}`}>No products added yet.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className={`p-2 border-t ${borderCard} ${bgInput} text-center text-[10px] ${textMuted}`}>
                Use <kbd className="border rounded px-1.5 py-0.5 mx-1">↑</kbd> <kbd className="border rounded px-1.5 py-0.5 mx-1">↓</kbd> to navigate, and <kbd className="border rounded px-1.5 py-0.5 mx-1">Enter</kbd> to edit.
              </div>
            </div>
          </div>
        )}

        {/* ================= 7. STAFF MANAGEMENT ================= */}
        {activeTab === "staff" && isManager && (
          <div className="flex-1 flex flex-col p-4 md:p-6 gap-4 overflow-hidden">
            <div className={`p-5 rounded-xl shadow-sm border transition-colors ${isEditingStaff ? 'border-teal-500 ring-1 ring-teal-500' : borderCard} ${bgCard} shrink-0`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg flex items-center gap-2 text-teal-600"><ShieldCheck className="h-5 w-5"/> {isEditingStaff ? "Edit Staff Member" : "Add Staff Member"}</h2>
                {isEditingStaff && <button onClick={() => {setIsEditingStaff(false); setNewStaff({id:"", name:"", role:"Cashier", phone:"", email:"", pin:"", status:"Active"});}} className={`text-xs font-semibold ${textMuted} hover:${textMain} border ${borderCard} px-3 py-1.5 rounded-lg`}>Cancel Edit</button>}
              </div>
              <form onSubmit={handleSaveStaff} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                <div className="md:col-span-2"><label className={`block text-[10px] font-bold uppercase mb-1 ${textMuted}`}>Staff Name</label><input ref={staffNameRef} type="text" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} onKeyDown={(e) => { if(e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); staffRoleRef.current?.focus(); } }} className={`w-full border ${borderCard} ${bgInput} rounded-lg p-2 text-sm outline-none focus:border-teal-500`} required /></div>
                <div className="md:col-span-2">
                  <label className={`block text-[10px] font-bold uppercase mb-1 ${textMuted}`}>System Role</label>
                  <select ref={staffRoleRef} value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})} onKeyDown={(e) => { if(e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); staffPhoneRef.current?.focus(); } if(e.key === 'ArrowUp') { e.preventDefault(); staffNameRef.current?.focus(); } }} className={`w-full border ${borderCard} ${bgInput} rounded-lg p-2 text-sm outline-none focus:border-teal-500`}>
                    <option value="Owner">Owner</option><option value="Manager">Manager</option><option value="Cashier">Cashier</option><option value="Kitchen Staff">Kitchen Staff</option><option value="Delivery Rider">Delivery Rider</option>
                  </select>
                </div>
                <div className="md:col-span-2"><label className={`block text-[10px] font-bold uppercase mb-1 ${textMuted}`}>Phone / Contact</label><input ref={staffPhoneRef} type="tel" value={newStaff.phone} onChange={e => setNewStaff({...newStaff, phone: e.target.value})} onKeyDown={(e) => { if(e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); staffEmailRef.current?.focus(); } if(e.key === 'ArrowUp') { e.preventDefault(); staffRoleRef.current?.focus(); } }} className={`w-full border ${borderCard} ${bgInput} rounded-lg p-2 text-sm outline-none focus:border-teal-500`} required /></div>
                
                <div className="md:col-span-2"><label className={`block text-[10px] font-bold uppercase mb-1 ${textMuted}`}>Email / Username</label><input ref={staffEmailRef} type="text" value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} onKeyDown={(e) => { if(e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); staffPinRef.current?.focus(); } if(e.key === 'ArrowUp') { e.preventDefault(); staffPhoneRef.current?.focus(); } }} className={`w-full border ${borderCard} ${bgInput} rounded-lg p-2 text-sm outline-none focus:border-teal-500`} /></div>
                <div className="md:col-span-2"><label className={`block text-[10px] font-bold uppercase mb-1 ${textMuted}`}>PIN Password (For Login)</label><input ref={staffPinRef} type="text" placeholder="e.g. 1234" value={newStaff.pin} onChange={e => setNewStaff({...newStaff, pin: e.target.value})} onKeyDown={(e) => { if(e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); staffStatusRef.current?.focus(); } if(e.key === 'ArrowUp') { e.preventDefault(); staffEmailRef.current?.focus(); } }} className={`w-full border ${borderCard} ${bgInput} rounded-lg p-2 text-sm outline-none focus:border-teal-500 tracking-widest font-mono`} required /></div>
                <div className="md:col-span-2">
                  <label className={`block text-[10px] font-bold uppercase mb-1 ${textMuted}`}>Status</label>
                  <select ref={staffStatusRef} value={newStaff.status} onChange={e => setNewStaff({...newStaff, status: e.target.value})} onKeyDown={(e) => { if(e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); staffSubmitRef.current?.focus(); } if(e.key === 'ArrowUp') { e.preventDefault(); staffPinRef.current?.focus(); } }} className={`w-full border ${borderCard} ${bgInput} rounded-lg p-2 text-sm outline-none focus:border-teal-500`}>
                    <option value="Active">Active</option><option value="Inactive">Inactive</option>
                  </select>
                </div>
                
                <button ref={staffSubmitRef} type="submit" onKeyDown={(e) => { if(e.key === 'ArrowUp') { e.preventDefault(); staffStatusRef.current?.focus(); } }} className={`md:col-span-6 text-white py-2.5 rounded-lg text-sm font-bold shadow-md w-full ${isEditingStaff ? 'bg-teal-600 hover:bg-teal-500' : 'bg-slate-800 hover:bg-slate-700'}`}>{isEditingStaff ? "Update Staff Profile" : "+ Add Staff Member"}</button>
              </form>
            </div>

            <div className={`flex-1 rounded-xl border ${borderCard} ${bgCard} shadow-sm overflow-hidden flex flex-col relative`}>
              <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className={`sticky top-0 z-10 ${isDark ? 'bg-slate-900' : 'bg-slate-100'} ${textMuted} text-[11px] uppercase tracking-wider border-b ${borderCard} shadow-sm`}>
                    <tr>
                      <th className="px-4 py-3 font-semibold w-12">Role</th>
                      <th className="px-4 py-3 font-semibold">Staff Name</th>
                      <th className="px-4 py-3 font-semibold">Contact Info</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
                    {staffList.map((user, index) => {
                      const isFocused = focusedStaffIndex === index;
                      const roleColors: Record<string, string> = { Owner: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400", Manager: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400", Cashier: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400", "Kitchen Staff": "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400", "Delivery Rider": "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400" };
                      const colorClass = roleColors[user.role] || "bg-slate-100 text-slate-700";

                      return (
                        <tr key={user.id} onClick={() => editStaff(user)} className={`cursor-pointer transition-colors ${isFocused ? (isDark ? 'bg-teal-500/20' : 'bg-teal-50') : (isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50')}`}>
                          <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${colorClass}`}>{user.role}</span></td>
                          <td className="px-4 py-3 font-bold">{user.name}</td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-sm">{user.phone}</p>
                            <p className={`text-xs ${textMuted}`}>{user.email || "No Email provided"}</p>
                          </td>
                          <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${user.status === 'Active' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>{user.status}</span></td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <button onClick={(e) => { e.stopPropagation(); editStaff(user); }} className={`text-teal-500 p-2 rounded-lg transition ${isDark ? 'hover:bg-slate-800' : 'hover:bg-teal-50'}`}><Edit className="h-4 w-4" /></button>
                            <button onClick={(e) => { e.stopPropagation(); deleteStaff(user.id); }} className={`text-red-500 p-2 rounded-lg transition ${isDark ? 'hover:bg-slate-800' : 'hover:bg-red-50'}`}><Trash2 className="h-4 w-4" /></button>
                          </td>
                        </tr>
                      )
                    })}
                    {staffList.length === 0 && (<tr><td colSpan={5} className={`px-4 py-10 text-center ${textMuted}`}>No staff members added yet.</td></tr>)}
                  </tbody>
                </table>
              </div>
              <div className={`p-2 border-t ${borderCard} ${bgInput} text-center text-[10px] ${textMuted}`}>
                Use <kbd className="border rounded px-1.5 py-0.5 mx-1">↑</kbd> <kbd className="border rounded px-1.5 py-0.5 mx-1">↓</kbd> to navigate, and <kbd className="border rounded px-1.5 py-0.5 mx-1">Enter</kbd> to edit.
              </div>
            </div>
          </div>
        )}

        {/* ================= 8. SETTINGS ================= */}
        {activeTab === "settings" && isManager && (
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

      {/* HIDDEN PRINTABLE RECEIPT */}
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
            {pData.customer && <div className="mb-3 border-b border-black pb-3 border-dashed"><p className="font-bold">Bill To:</p><p>{pData.customer.name}</p><p>{pData.customer.phone}</p><p>{pData.customer.address}</p></div>}
            {pData.supplier && <div className="mb-3 border-b border-black pb-3 border-dashed"><p className="font-bold">Supplier:</p><p>{pData.supplier.name}</p><p>{pData.supplier.contact}</p></div>}
            <table className="w-full mb-3 text-[11px]">
              <thead><tr className="border-b border-black border-dashed"><th className="text-left pb-1">Qty</th><th className="text-left pb-1">Item</th><th className="text-right pb-1">Amt</th></tr></thead>
              <tbody>
                {pData.items.map((item: any, i: number) => (<tr key={i} className="align-top"><td className="py-1 w-6">{item.qty}x</td><td className="py-1 pr-1">{item.name}</td><td className="py-1 text-right whitespace-nowrap">{pData.currency}{(item.price * item.qty).toFixed(0)}</td></tr>))}
              </tbody>
            </table>
            <div className="border-t border-black pt-2 border-dashed text-[11px]">
              {pData.subtotal !== undefined && <div className="flex justify-between"><p>Subtotal</p><p>{pData.currency}{pData.subtotal.toFixed(0)}</p></div>}
              {pData.deliveryFee > 0 && <div className="flex justify-between"><p>Delivery</p><p>{pData.currency}{pData.deliveryFee.toFixed(0)}</p></div>}
              {pData.discount > 0 && <div className="flex justify-between"><p>Discount</p><p>-{pData.currency}{pData.discount.toFixed(0)}</p></div>}
              <div className="flex justify-between font-bold text-sm mt-2"><p>TOTAL</p><p>{pData.currency}{pData.total.toFixed(0)}</p></div>
            </div>
            <div className="text-center mt-4 text-[10px]"><p>*** THANK YOU ***</p></div>
          </div>
        )
      })()}

      {/* SUCCESS/ERROR TOAST MESSAGE */}
      {toast.show && (
        <div className={`fixed bottom-10 right-10 text-white px-6 py-3 rounded-xl shadow-2xl z-[100] flex items-center gap-2 animate-bounce ${toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'}`}>
          {toast.type === 'error' ? <X className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
          <span className="font-bold">{toast.msg}</span>
        </div>
      )}
    </div>
  );
}