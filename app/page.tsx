'use client'

import React, { useState, useEffect, useRef } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import {
  FiShoppingCart, FiSearch, FiPlus, FiMinus, FiTrash2, FiX, FiSend,
  FiMessageCircle, FiDollarSign, FiTrendingUp, FiUsers, FiPackage,
  FiTag, FiBarChart2, FiClock, FiEdit2, FiPrinter,
  FiCheckCircle, FiAlertTriangle, FiPercent, FiHash,
  FiUser, FiPhone, FiCalendar, FiActivity,
  FiChevronDown, FiChevronUp, FiRefreshCw, FiMenu, FiSmartphone
} from 'react-icons/fi'

// ─── AGENT IDS ────────────────────────────────────────────────
const BILLING_AGENT_ID = '69a1871e538debb70c587988'
const ANALYTICS_AGENT_ID = '69a1871fdb8e0879c3c8f354'

// ─── THEME VARS ───────────────────────────────────────────────
const THEME_VARS: React.CSSProperties & Record<string, string> = {
  '--background': '220 15% 97%',
  '--foreground': '220 20% 15%',
  '--card': '0 0% 100%',
  '--card-foreground': '220 20% 15%',
  '--primary': '220 75% 50%',
  '--primary-foreground': '0 0% 100%',
  '--secondary': '220 12% 92%',
  '--secondary-foreground': '220 20% 20%',
  '--accent': '160 65% 40%',
  '--accent-foreground': '0 0% 100%',
  '--destructive': '0 70% 50%',
  '--muted': '220 10% 90%',
  '--muted-foreground': '220 12% 50%',
  '--border': '220 15% 88%',
  '--input': '220 12% 82%',
  '--ring': '220 75% 50%',
  '--sidebar-background': '220 14% 95%',
  '--sidebar-foreground': '220 20% 15%',
  '--sidebar-border': '220 14% 90%',
  '--sidebar-primary': '220 75% 50%',
  '--chart-1': '220 75% 50%',
  '--chart-2': '160 65% 40%',
  '--chart-3': '280 55% 55%',
  '--chart-4': '35 80% 50%',
  '--chart-5': '0 70% 50%',
  '--radius': '0.125rem',
}

// ─── TYPES ────────────────────────────────────────────────────
interface Product {
  id: string
  barcode: string
  name: string
  category: string
  price: number
  stock: number
  unit: string
}

interface CartItem extends Product {
  quantity: number
}

interface Bill {
  id: string
  date: string
  items: CartItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentMethod: string
  status: string
  customerName?: string
  discountCode?: string
  discountName?: string
  discountPercentage?: number
  customerPhone?: string
}

interface Customer {
  id: string
  name: string
  phone: string
  totalVisits: number
  totalSpend: number
  lastVisit: string
  loyaltyPoints: number
}

interface Offer {
  id: string
  name: string
  type: 'percentage' | 'flat' | 'bogo'
  value: number
  validFrom: string
  validTo: string
  categories: string[]
  active: boolean
  code: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  details?: Record<string, any>
}

type ScreenType = 'pos' | 'bills' | 'inventory' | 'discounts' | 'analytics' | 'customers'
type RoleType = 'cashier' | 'manager'

// ─── SAMPLE DATA ──────────────────────────────────────────────
const INITIAL_PRODUCTS: Product[] = [
  { id: 'P001', barcode: '8901234567890', name: 'Amul Milk 1L', category: 'Dairy', price: 65, stock: 150, unit: 'pcs' },
  { id: 'P002', barcode: '8901234567891', name: 'Whole Wheat Bread', category: 'Bakery', price: 45, stock: 80, unit: 'pcs' },
  { id: 'P003', barcode: '8901234567892', name: 'Basmati Rice 5kg', category: 'Grains', price: 450, stock: 60, unit: 'pcs' },
  { id: 'P004', barcode: '8901234567893', name: 'Olive Oil 1L', category: 'Oils', price: 599, stock: 35, unit: 'pcs' },
  { id: 'P005', barcode: '8901234567894', name: 'Sugar 1kg', category: 'Essentials', price: 48, stock: 200, unit: 'pcs' },
  { id: 'P006', barcode: '8901234567895', name: 'Red Label Tea 500g', category: 'Beverages', price: 295, stock: 45, unit: 'pcs' },
  { id: 'P007', barcode: '8901234567896', name: 'Maggi Noodles Pack', category: 'Instant Food', price: 72, stock: 120, unit: 'pcs' },
  { id: 'P008', barcode: '8901234567897', name: 'Coconut Oil 500ml', category: 'Oils', price: 189, stock: 55, unit: 'pcs' },
  { id: 'P009', barcode: '8901234567898', name: 'Eggs (12 pack)', category: 'Dairy', price: 84, stock: 90, unit: 'pcs' },
  { id: 'P010', barcode: '8901234567899', name: 'Tomato Ketchup 500g', category: 'Condiments', price: 115, stock: 70, unit: 'pcs' },
  { id: 'P011', barcode: '8901234567900', name: 'Fresh Paneer 200g', category: 'Dairy', price: 90, stock: 40, unit: 'pcs' },
  { id: 'P012', barcode: '8901234567901', name: 'Aashirvaad Atta 10kg', category: 'Grains', price: 480, stock: 50, unit: 'pcs' },
]

const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'C001', name: 'Rahul Sharma', phone: '9876543210', totalVisits: 45, totalSpend: 32500, lastVisit: '2025-02-26', loyaltyPoints: 1625 },
  { id: 'C002', name: 'Priya Patel', phone: '9876543211', totalVisits: 32, totalSpend: 28700, lastVisit: '2025-02-25', loyaltyPoints: 1435 },
  { id: 'C003', name: 'Amit Kumar', phone: '9876543212', totalVisits: 18, totalSpend: 15200, lastVisit: '2025-02-24', loyaltyPoints: 760 },
  { id: 'C004', name: 'Sneha Reddy', phone: '9876543213', totalVisits: 56, totalSpend: 41000, lastVisit: '2025-02-26', loyaltyPoints: 2050 },
  { id: 'C005', name: 'Vikram Singh', phone: '9876543214', totalVisits: 12, totalSpend: 8900, lastVisit: '2025-02-20', loyaltyPoints: 445 },
  { id: 'C006', name: 'Anita Joshi', phone: '9876543215', totalVisits: 28, totalSpend: 22300, lastVisit: '2025-02-23', loyaltyPoints: 1115 },
]

const INITIAL_OFFERS: Offer[] = [
  { id: 'O001', name: 'Weekend Dairy Delight', type: 'percentage', value: 15, validFrom: '2025-02-01', validTo: '2025-12-31', categories: ['Dairy'], active: true, code: 'DAIRY15' },
  { id: 'O002', name: 'Grain Saver Pack', type: 'flat', value: 50, validFrom: '2025-02-15', validTo: '2025-12-31', categories: ['Grains'], active: true, code: 'GRAIN50' },
  { id: 'O003', name: 'Buy 2 Get 1 Beverages', type: 'bogo', value: 0, validFrom: '2025-02-01', validTo: '2025-12-31', categories: ['Beverages'], active: true, code: 'BOGO' },
  { id: 'O004', name: 'Essentials Discount', type: 'percentage', value: 10, validFrom: '2025-01-01', validTo: '2025-12-31', categories: ['Essentials', 'Condiments'], active: true, code: 'SAVE10' },
  { id: 'O005', name: 'Diwali Special', type: 'percentage', value: 20, validFrom: '2025-01-01', validTo: '2025-12-31', categories: [], active: true, code: 'DIW' },
  { id: 'O006', name: 'Lucky 11', type: 'percentage', value: 11, validFrom: '2025-01-01', validTo: '2025-12-31', categories: [], active: true, code: '11' },
  { id: 'O007', name: 'Flat 100 Off', type: 'flat', value: 100, validFrom: '2025-01-01', validTo: '2025-12-31', categories: [], active: true, code: 'FLAT100' },
]

const SAMPLE_BILLS: Bill[] = [
  { id: 'B001', date: '2025-02-26 14:30', items: [{ ...INITIAL_PRODUCTS[0], quantity: 2 }, { ...INITIAL_PRODUCTS[1], quantity: 1 }, { ...INITIAL_PRODUCTS[6], quantity: 3 }], subtotal: 391, tax: 19.55, discount: 0, total: 410.55, paymentMethod: 'Cash', status: 'Completed', customerName: 'Rahul Sharma' },
  { id: 'B002', date: '2025-02-26 13:15', items: [{ ...INITIAL_PRODUCTS[2], quantity: 1 }, { ...INITIAL_PRODUCTS[4], quantity: 2 }], subtotal: 546, tax: 27.3, discount: 50, total: 523.3, paymentMethod: 'UPI', status: 'Completed' },
  { id: 'B003', date: '2025-02-26 11:45', items: [{ ...INITIAL_PRODUCTS[3], quantity: 1 }, { ...INITIAL_PRODUCTS[7], quantity: 1 }, { ...INITIAL_PRODUCTS[9], quantity: 2 }], subtotal: 1018, tax: 50.9, discount: 0, total: 1068.9, paymentMethod: 'Card', status: 'Completed', customerName: 'Priya Patel' },
  { id: 'B004', date: '2025-02-25 16:20', items: [{ ...INITIAL_PRODUCTS[5], quantity: 2 }, { ...INITIAL_PRODUCTS[8], quantity: 1 }], subtotal: 674, tax: 33.7, discount: 15, total: 692.7, paymentMethod: 'Cash', status: 'Completed' },
  { id: 'B005', date: '2025-02-25 10:00', items: [{ ...INITIAL_PRODUCTS[10], quantity: 3 }, { ...INITIAL_PRODUCTS[11], quantity: 1 }], subtotal: 750, tax: 37.5, discount: 0, total: 787.5, paymentMethod: 'UPI', status: 'Completed', customerName: 'Sneha Reddy' },
  { id: 'B006', date: '2025-02-24 15:30', items: [{ ...INITIAL_PRODUCTS[0], quantity: 4 }, { ...INITIAL_PRODUCTS[4], quantity: 3 }, { ...INITIAL_PRODUCTS[6], quantity: 2 }], subtotal: 548, tax: 27.4, discount: 0, total: 575.4, paymentMethod: 'Cash', status: 'Completed' },
  { id: 'B007', date: '2025-02-24 09:45', items: [{ ...INITIAL_PRODUCTS[1], quantity: 2 }, { ...INITIAL_PRODUCTS[8], quantity: 2 }], subtotal: 258, tax: 12.9, discount: 10, total: 260.9, paymentMethod: 'Card', status: 'Completed', customerName: 'Amit Kumar' },
]

const DAILY_SALES = [
  { day: 'Mon', revenue: 4200 },
  { day: 'Tue', revenue: 3800 },
  { day: 'Wed', revenue: 5100 },
  { day: 'Thu', revenue: 4600 },
  { day: 'Fri', revenue: 6200 },
  { day: 'Sat', revenue: 7800 },
  { day: 'Sun', revenue: 5500 },
]

const CATEGORY_DIST = [
  { name: 'Dairy', value: 28, color: 'hsl(220, 75%, 50%)' },
  { name: 'Grains', value: 22, color: 'hsl(160, 65%, 40%)' },
  { name: 'Oils', value: 18, color: 'hsl(280, 55%, 55%)' },
  { name: 'Beverages', value: 12, color: 'hsl(35, 80%, 50%)' },
  { name: 'Others', value: 20, color: 'hsl(0, 70%, 50%)' },
]

// ─── HELPERS ──────────────────────────────────────────────────
function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-1.5">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-2 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-2 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-3 mb-1">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part)
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount)
}

// ─── ERROR BOUNDARY ───────────────────────────────────────────
class PageErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-primary text-primary-foreground rounded-sm text-sm">Try again</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── SIDEBAR COMPONENT ───────────────────────────────────────
function AppSidebar({
  role, setRole, screen, setScreen, sidebarOpen
}: {
  role: RoleType
  setRole: (r: RoleType) => void
  screen: ScreenType
  setScreen: (s: ScreenType) => void
  sidebarOpen: boolean
}) {
  const cashierMenu: { label: string; icon: React.ReactNode; screen: ScreenType }[] = [
    { label: 'POS Checkout', icon: <FiShoppingCart size={18} />, screen: 'pos' },
    { label: 'Bill History', icon: <FiClock size={18} />, screen: 'bills' },
  ]
  const managerMenu: { label: string; icon: React.ReactNode; screen: ScreenType }[] = [
    { label: 'Dashboard', icon: <FiBarChart2 size={18} />, screen: 'analytics' },
    { label: 'Inventory', icon: <FiPackage size={18} />, screen: 'inventory' },
    { label: 'Discounts & Offers', icon: <FiTag size={18} />, screen: 'discounts' },
    { label: 'Customers', icon: <FiUsers size={18} />, screen: 'customers' },
    { label: 'Bill History', icon: <FiClock size={18} />, screen: 'bills' },
  ]
  const menuItems = role === 'cashier' ? cashierMenu : managerMenu

  return (
    <div className={`fixed left-0 top-0 h-full z-40 bg-card border-r border-border flex flex-col transition-all duration-200 ${sidebarOpen ? 'w-56' : 'w-0 overflow-hidden'}`}>
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-sm bg-primary flex items-center justify-center">
            <FiShoppingCart className="text-primary-foreground" size={16} />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground leading-tight">SuperMart</h1>
            <p className="text-[10px] text-muted-foreground leading-tight">POS System</p>
          </div>
        </div>
        <div className="flex items-center justify-between bg-secondary rounded-sm p-2">
          <span className="text-xs text-secondary-foreground font-medium">{role === 'cashier' ? 'Cashier' : 'Manager'}</span>
          <Switch checked={role === 'manager'} onCheckedChange={(checked) => {
            setRole(checked ? 'manager' : 'cashier')
            setScreen(checked ? 'analytics' : 'pos')
          }} />
        </div>
      </div>
      <nav className="flex-1 p-2 space-y-0.5">
        {menuItems.map((item) => (
          <button key={item.screen + item.label} onClick={() => setScreen(item.screen)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm transition-colors ${screen === item.screen ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-secondary'}`}>
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
            <FiUser size={13} className="text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs font-medium text-foreground leading-tight">{role === 'cashier' ? 'John (Cashier)' : 'Admin (Manager)'}</p>
            <p className="text-[10px] text-muted-foreground">Online</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── CHAT PANEL COMPONENT ────────────────────────────────────
function ChatPanel({
  open, onClose, agentId, agentName, messages, setMessages
}: {
  open: boolean
  onClose: () => void
  agentId: string
  agentName: string
  messages: ChatMessage[]
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
}) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)
    try {
      const result = await callAIAgent(userMsg, agentId)
      if (result.success) {
        const agentResult = result?.response?.result ?? {}
        const mainMessage = agentResult?.message ?? result?.response?.message ?? 'No response received.'
        setMessages(prev => [...prev, { role: 'assistant', content: mainMessage, details: agentResult }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: result?.error ?? 'Failed to get response.' }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Network error. Please try again.' }])
    }
    setLoading(false)
  }

  if (!open) return null

  return (
    <div className="fixed right-0 top-0 h-full w-[380px] bg-card border-l border-border z-50 flex flex-col">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FiMessageCircle size={16} className="text-primary" />
          <span className="text-sm font-semibold text-foreground">{agentName}</span>
        </div>
        <button onClick={onClose} className="p-1 rounded-sm hover:bg-secondary"><FiX size={16} /></button>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-xs mt-8">
            <FiMessageCircle size={28} className="mx-auto mb-2 opacity-40" />
            <p>Ask anything about {agentName === 'Billing Assistant' ? 'products, discounts, or billing' : 'sales trends and analytics'}</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-sm px-3 py-2 text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
              {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
              {msg.role === 'assistant' && msg.details && (
                <div className="mt-2 space-y-2">
                  {Array.isArray(msg.details?.details?.products) && msg.details.details.products.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold opacity-70">Products:</p>
                      {msg.details.details.products.map((p: Record<string, any>, pi: number) => (
                        <div key={pi} className="bg-background/50 rounded-sm p-1.5 text-xs">
                          <span className="font-medium">{p?.name ?? 'Unknown'}</span> - {p?.price ?? 'N/A'} ({p?.category ?? ''}) {p?.availability ?? ''}
                        </div>
                      ))}
                    </div>
                  )}
                  {Array.isArray(msg.details?.details?.discounts) && msg.details.details.discounts.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold opacity-70">Discounts:</p>
                      {msg.details.details.discounts.map((d: Record<string, any>, di: number) => (
                        <div key={di} className="bg-background/50 rounded-sm p-1.5 text-xs">
                          <span className="font-medium">{d?.offer_name ?? 'Offer'}</span> - {d?.discount_percentage ?? ''} off {d?.applicable_products ?? ''}
                        </div>
                      ))}
                    </div>
                  )}
                  {msg.details?.details?.billing_summary?.total && (
                    <div className="bg-background/50 rounded-sm p-2 text-xs space-y-0.5">
                      <p className="font-semibold opacity-70">Billing Summary:</p>
                      <p>Subtotal: {msg.details.details.billing_summary?.subtotal ?? 'N/A'}</p>
                      <p>Discount: {msg.details.details.billing_summary?.discount_applied ?? 'N/A'}</p>
                      <p className="font-semibold">Total: {msg.details.details.billing_summary?.total ?? 'N/A'}</p>
                    </div>
                  )}
                  {Array.isArray(msg.details?.data?.metrics) && msg.details.data.metrics.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold opacity-70">Metrics:</p>
                      {msg.details.data.metrics.map((m: Record<string, any>, mi: number) => (
                        <div key={mi} className="bg-background/50 rounded-sm p-1.5 text-xs flex justify-between">
                          <span>{m?.metric_name ?? 'Metric'}</span>
                          <span className="font-semibold">{m?.value ?? 'N/A'} <span className="text-green-600">{m?.change_percentage ?? ''}</span></span>
                        </div>
                      ))}
                    </div>
                  )}
                  {Array.isArray(msg.details?.data?.top_items) && msg.details.data.top_items.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold opacity-70">Top Items:</p>
                      {msg.details.data.top_items.map((t: Record<string, any>, ti: number) => (
                        <div key={ti} className="bg-background/50 rounded-sm p-1.5 text-xs flex justify-between">
                          <span>#{t?.rank ?? ti + 1} {t?.item_name ?? 'Item'}</span>
                          <span className="font-semibold">{t?.revenue ?? 'N/A'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {Array.isArray(msg.details?.recommendations) && msg.details.recommendations.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold opacity-70">Recommendations:</p>
                      <ul className="list-disc ml-3 text-xs space-y-0.5">
                        {msg.details.recommendations.map((r: string, ri: number) => (
                          <li key={ri}>{r ?? ''}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(msg.details?.suggestions) && msg.details.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {msg.details.suggestions.map((s: string, si: number) => (
                        <button key={si} onClick={() => { setInput(s ?? '') }} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-sm hover:bg-primary/20 transition-colors">{s ?? ''}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-secondary rounded-sm px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
              <FiRefreshCw size={12} className="animate-spin" />
              Thinking...
            </div>
          </div>
        )}
      </div>
      <div className="p-3 border-t border-border flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your question..." className="text-sm" onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }} />
        <Button size="sm" onClick={handleSend} disabled={loading || !input.trim()} className="px-3">
          <FiSend size={14} />
        </Button>
      </div>
    </div>
  )
}

// ─── RECEIPT MODAL COMPONENT ──────────────────────────────────
function ReceiptModal({
  open, onClose, bill
}: {
  open: boolean
  onClose: () => void
  bill: Bill | null
}) {
  const [whatsappSent, setWhatsappSent] = useState(false)

  if (!bill) return null

  const buildWhatsAppMessage = () => {
    const custName = bill.customerName ?? 'Valued Customer'
    const itemLines = Array.isArray(bill.items) ? bill.items.map(item => `- ${item?.name ?? 'Item'} x${item?.quantity ?? 0} = ${formatCurrency((item?.price ?? 0) * (item?.quantity ?? 0))}`).join('\n') : ''
    const discLine = bill.discount > 0
      ? `*Discount (${bill.discountName ?? 'Applied'}${bill.discountPercentage ? ' - ' + bill.discountPercentage + '%' : ''}):* -${formatCurrency(bill.discount)}`
      : ''

    return `*SuperMart - Purchase Receipt*

Hi ${custName}! Thank you for shopping at SuperMart.

*Bill #:* ${bill.id}
*Date:* ${bill.date}

*Items:*
${itemLines}

*Subtotal:* ${formatCurrency(bill.subtotal)}
*Tax (5%):* ${formatCurrency(bill.tax)}
${discLine ? discLine + '\n' : ''}*TOTAL:* ${formatCurrency(bill.total)}
*Payment:* ${bill.paymentMethod}

Welcome to the SuperMart family! Enjoy exclusive monthly offers and discounts. Stay tuned for next month's special deals!

Visit us again soon!
SuperMart - Your Trusted Supermarket`
  }

  const handleSendWhatsApp = () => {
    const phone = bill.customerPhone ?? ''
    const cleanPhone = phone.replace(/\D/g, '')
    const message = encodeURIComponent(buildWhatsAppMessage())
    const url = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${message}`
    window.open(url, '_blank')
    setWhatsappSent(true)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) { setWhatsappSent(false); onClose() } }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">Receipt</DialogTitle>
          <DialogDescription className="text-center text-xs">Bill #{bill.id}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm font-mono">
          <div className="text-center border-b border-dashed border-border pb-2">
            <p className="font-bold text-base">SuperMart</p>
            <p className="text-xs text-muted-foreground">123 Main Street, City</p>
            <p className="text-xs text-muted-foreground">Tel: +91-1234567890</p>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Bill: {bill.id}</span>
            <span>{bill.date}</span>
          </div>
          {bill.customerName && <p className="text-xs">Customer: {bill.customerName}</p>}
          {bill.customerPhone && <p className="text-xs text-muted-foreground">Phone: {bill.customerPhone}</p>}
          <Separator />
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span>Item</span>
              <span className="flex gap-4"><span className="w-8 text-center">Qty</span><span className="w-16 text-right">Total</span></span>
            </div>
            <Separator />
            {Array.isArray(bill.items) && bill.items.map((item, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="flex-1 truncate">{item?.name ?? 'Item'}</span>
                <span className="flex gap-4"><span className="w-8 text-center">{item?.quantity ?? 0}</span><span className="w-16 text-right">{formatCurrency((item?.price ?? 0) * (item?.quantity ?? 0))}</span></span>
              </div>
            ))}
          </div>
          <Separator />
          <div className="space-y-0.5 text-xs">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(bill.subtotal)}</span></div>
            <div className="flex justify-between"><span>Tax (5%)</span><span>{formatCurrency(bill.tax)}</span></div>
            {bill.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount{bill.discountName ? ` (${bill.discountName}${bill.discountPercentage ? ' - ' + bill.discountPercentage + '%' : ''})` : ''}</span>
                <span>-{formatCurrency(bill.discount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-sm"><span>TOTAL</span><span>{formatCurrency(bill.total)}</span></div>
          </div>
          <div className="text-center text-xs text-muted-foreground border-t border-dashed border-border pt-2">
            <p>Payment: {bill.paymentMethod}</p>
            <p className="mt-1">Thank you for shopping!</p>
          </div>
        </div>

        {/* WhatsApp Notification Section */}
        {bill.customerPhone && (
          <div className="mt-2 border border-green-200 rounded-sm bg-green-50 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <FiSmartphone size={14} className="text-green-600" />
              <span className="text-xs font-semibold text-green-800">WhatsApp Notification</span>
            </div>
            <p className="text-[10px] text-green-700">Send receipt and welcome message to {bill.customerName ?? 'customer'} ({bill.customerPhone})</p>
            {whatsappSent && (
              <div className="flex items-center gap-1 text-[10px] text-green-700 bg-green-100 rounded-sm px-2 py-1">
                <FiCheckCircle size={10} /> WhatsApp notification ready - check your browser
              </div>
            )}
            <Button size="sm" className="w-full h-8 text-xs bg-green-600 hover:bg-green-700 text-white gap-1" onClick={handleSendWhatsApp}>
              <FiSmartphone size={12} /> Send via WhatsApp
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => { setWhatsappSent(false); onClose() }}>Close</Button>
          <Button size="sm" onClick={() => window.print()} className="gap-1"><FiPrinter size={12} /> Print</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── POS CHECKOUT SCREEN ──────────────────────────────────────
function POSCheckoutScreen({
  products, cart, setCart, onGenerateBill, sampleMode, offers, customers, setCustomers
}: {
  products: Product[]
  cart: CartItem[]
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
  onGenerateBill: (paymentMethod: string, discountCode: string, discountInfo: { name: string; percentage: number; amount: number } | null, customerInfo: { name: string; phone: string } | null) => void
  sampleMode: boolean
  offers: Offer[]
  customers: Customer[]
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [barcodeInput, setBarcodeInput] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [discountCode, setDiscountCode] = useState('')
  const [appliedOffer, setAppliedOffer] = useState<Offer | null>(null)
  const [discountStatus, setDiscountStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerLookupStatus, setCustomerLookupStatus] = useState<string | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const barcodeRef = useRef<HTMLInputElement>(null)
  const sampleLoadedRef = useRef(false)

  useEffect(() => {
    if (barcodeRef.current) barcodeRef.current.focus()
  }, [])

  useEffect(() => {
    if (sampleMode && !sampleLoadedRef.current) {
      sampleLoadedRef.current = true
      setCart([
        { ...products[0], quantity: 2 },
        { ...products[2], quantity: 1 },
        { ...products[6], quantity: 3 },
        { ...products[9], quantity: 1 },
      ])
      setDiscountCode('SAVE10')
      setCustomerPhone('9876543210')
      setCustomerName('Rahul Sharma')
      setCustomerLookupStatus('Existing customer found')
      // Auto-apply SAVE10 for sample mode
      const sampleOffer = offers.find(o => o.code.toUpperCase() === 'SAVE10' && o.active)
      if (sampleOffer) {
        setAppliedOffer(sampleOffer)
        setDiscountStatus({ type: 'success', message: `"${sampleOffer.name}" applied - ${sampleOffer.type === 'percentage' ? sampleOffer.value + '% off' : formatCurrency(sampleOffer.value) + ' off'}` })
      }
    }
    if (!sampleMode && sampleLoadedRef.current) {
      sampleLoadedRef.current = false
      setAppliedOffer(null)
      setDiscountStatus(null)
      setCustomerPhone('')
      setCustomerName('')
      setCustomerLookupStatus(null)
    }
  }, [sampleMode, products, setCart, offers])

  const handleCustomerPhoneChange = (phone: string) => {
    setCustomerPhone(phone)
    if (phone.length >= 10) {
      const found = customers.find(c => c.phone === phone)
      if (found) {
        setCustomerName(found.name)
        setCustomerLookupStatus('Existing customer found')
      } else {
        setCustomerName('')
        setCustomerLookupStatus('New customer - enter name below')
      }
    } else {
      setCustomerLookupStatus(null)
      setCustomerName('')
    }
  }

  const handleApplyDiscount = () => {
    if (!discountCode.trim()) {
      setDiscountStatus({ type: 'error', message: 'Please enter a discount code' })
      setAppliedOffer(null)
      return
    }
    const matched = offers.find(o => o.code.toUpperCase() === discountCode.trim().toUpperCase() && o.active)
    if (matched) {
      setAppliedOffer(matched)
      setDiscountStatus({ type: 'success', message: `"${matched.name}" applied - ${matched.type === 'percentage' ? matched.value + '% off' : matched.type === 'flat' ? formatCurrency(matched.value) + ' off' : 'Buy One Get One'}` })
    } else {
      setAppliedOffer(null)
      setDiscountStatus({ type: 'error', message: 'Invalid or inactive discount code' })
    }
  }

  const handleBarcodeScan = () => {
    if (!barcodeInput.trim()) return
    const product = products.find(p => p.barcode === barcodeInput.trim())
    if (product) addToCart(product)
    setBarcodeInput('')
    barcodeRef.current?.focus()
  }

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === product.id)
      if (existing) {
        return prev.map(c => c.id === product.id ? { ...c, quantity: c.quantity + 1 } : c)
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.id === id) {
        const newQty = c.quantity + delta
        return newQty > 0 ? { ...c, quantity: newQty } : c
      }
      return c
    }).filter(c => c.quantity > 0))
  }

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(c => c.id !== id))
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.barcode.includes(searchQuery) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * 0.05
  const discountAmount = appliedOffer
    ? appliedOffer.type === 'percentage'
      ? subtotal * (appliedOffer.value / 100)
      : appliedOffer.type === 'flat'
        ? Math.min(appliedOffer.value, subtotal)
        : 0
    : 0
  const grandTotal = subtotal + tax - discountAmount

  const paymentMethods = ['Cash', 'Card', 'UPI', 'Split']

  return (
    <div className="flex gap-3 h-[calc(100vh-56px)]">
      {/* Left: Product Search */}
      <div className="flex-[3] flex flex-col min-w-0">
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <FiHash size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input ref={barcodeRef} value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleBarcodeScan() }} placeholder="Scan barcode or enter code..." className="pl-8 text-sm h-9" />
          </div>
          <Button size="sm" onClick={handleBarcodeScan} className="h-9 px-3">Scan</Button>
        </div>
        <div className="relative mb-3">
          <FiSearch size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search products by name, category..." className="pl-8 text-sm h-9" />
        </div>
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 pr-2">
            {filteredProducts.map((product) => (
              <button key={product.id} onClick={() => addToCart(product)} className="bg-card border border-border rounded-sm p-2.5 text-left hover:border-primary transition-colors group">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-foreground leading-tight truncate flex-1">{product.name}</p>
                  <Badge variant={product.stock < 20 ? 'destructive' : product.stock < 50 ? 'secondary' : 'outline'} className="text-[9px] px-1 py-0 ml-1 shrink-0">{product.stock}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{product.category}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-sm font-semibold text-primary">{formatCurrency(product.price)}</span>
                  <FiPlus size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right: Cart */}
      <div className="flex-[2] flex flex-col bg-card border border-border rounded-sm min-w-0">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiShoppingCart size={16} className="text-primary" />
            <span className="text-sm font-semibold">Cart ({cart.length})</span>
          </div>
          {cart.length > 0 && <button onClick={() => setCart([])} className="text-xs text-destructive hover:underline">Clear</button>}
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {cart.length === 0 && (
              <div className="text-center text-muted-foreground text-xs py-8">
                <FiShoppingCart size={24} className="mx-auto mb-2 opacity-30" />
                <p>Cart is empty</p>
                <p className="text-[10px] mt-1">Scan a barcode or search to add items</p>
              </div>
            )}
            {cart.map((item) => (
              <div key={item.id} className="flex items-center gap-2 bg-secondary/50 rounded-sm p-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground">{formatCurrency(item.price)} each</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 rounded-sm bg-background border border-border flex items-center justify-center hover:bg-secondary"><FiMinus size={10} /></button>
                  <span className="text-xs font-semibold w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 rounded-sm bg-background border border-border flex items-center justify-center hover:bg-secondary"><FiPlus size={10} /></button>
                </div>
                <span className="text-xs font-semibold w-16 text-right">{formatCurrency(item.price * item.quantity)}</span>
                <button onClick={() => removeFromCart(item.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded-sm"><FiTrash2 size={12} /></button>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Customer Info */}
        <div className="p-2 border-t border-border space-y-1.5">
          <div className="flex items-center gap-1.5">
            <FiSmartphone size={12} className="text-muted-foreground shrink-0" />
            <Input value={customerPhone} onChange={(e) => handleCustomerPhoneChange(e.target.value)} placeholder="Customer mobile number" className="text-xs h-7" type="tel" />
          </div>
          {customerLookupStatus && (
            <p className={`text-[10px] ml-5 ${customerLookupStatus.includes('Existing') ? 'text-green-600' : 'text-blue-600'}`}>
              {customerLookupStatus}
            </p>
          )}
          {customerPhone.length >= 10 && !customers.find(c => c.phone === customerPhone) && (
            <div className="flex items-center gap-1.5 ml-5">
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" className="text-xs h-7" />
            </div>
          )}
          {customerName && <p className="text-[10px] ml-5 text-foreground font-medium">Customer: {customerName}</p>}
        </div>

        {/* Summary */}
        <div className="p-3 border-t border-border space-y-2">
          <div className="flex gap-2">
            <Input value={discountCode} onChange={(e) => { setDiscountCode(e.target.value); if (discountStatus) { setDiscountStatus(null); setAppliedOffer(null) } }} placeholder="Discount code" className="text-xs h-8" onKeyDown={(e) => { if (e.key === 'Enter') handleApplyDiscount() }} />
            <Button variant="outline" size="sm" className="h-8 text-xs px-2 shrink-0" onClick={handleApplyDiscount}>Apply</Button>
          </div>
          {discountStatus && (
            <p className={`text-[10px] flex items-center gap-1 ${discountStatus.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
              {discountStatus.type === 'success' ? <FiCheckCircle size={10} /> : <FiAlertTriangle size={10} />}
              {discountStatus.message}
            </p>
          )}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tax (5%)</span><span>{formatCurrency(tax)}</span></div>
            {discountAmount > 0 && appliedOffer && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({appliedOffer.name} - {appliedOffer.type === 'percentage' ? appliedOffer.value + '%' : 'Flat'})</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-sm"><span>Grand Total</span><span className="text-primary">{formatCurrency(grandTotal)}</span></div>
          </div>

          {/* Payment Methods */}
          <div className="flex gap-1">
            {paymentMethods.map(m => (
              <button key={m} onClick={() => setPaymentMethod(m)} className={`flex-1 text-xs py-1.5 rounded-sm border transition-colors ${paymentMethod === m ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:bg-secondary'}`}>{m}</button>
            ))}
          </div>

          <Button className="w-full h-9 text-sm font-semibold" disabled={cart.length === 0} onClick={() => {
            const discInfo = appliedOffer ? {
              name: appliedOffer.name,
              percentage: appliedOffer.type === 'percentage' ? appliedOffer.value : 0,
              amount: discountAmount,
            } : null
            const custInfo = customerPhone.length >= 10 && customerName ? { name: customerName, phone: customerPhone } : null
            onGenerateBill(paymentMethod, discountCode, discInfo, custInfo)
            // Reset after bill generation
            setDiscountCode('')
            setAppliedOffer(null)
            setDiscountStatus(null)
            setCustomerPhone('')
            setCustomerName('')
            setCustomerLookupStatus(null)
          }}>
            <FiCheckCircle size={14} className="mr-1" /> Generate Bill
          </Button>
        </div>
      </div>

      {/* Floating Chat Button */}
      <button onClick={() => setChatOpen(true)} className="fixed bottom-5 right-5 w-11 h-11 bg-primary text-primary-foreground rounded-full flex items-center justify-center z-30 hover:opacity-90 transition-opacity" title="Ask Billing Assistant">
        <FiMessageCircle size={18} />
      </button>

      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} agentId={BILLING_AGENT_ID} agentName="Billing Assistant" messages={chatMessages} setMessages={setChatMessages} />
    </div>
  )
}

// ─── BILL HISTORY SCREEN ──────────────────────────────────────
function BillHistoryScreen({ bills }: { bills: Bill[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedBill, setExpandedBill] = useState<string | null>(null)
  const [receiptBill, setReceiptBill] = useState<Bill | null>(null)

  const filteredBills = bills.filter(b =>
    b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.customerName ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Bill History</h2>
        <span className="text-xs text-muted-foreground">{bills.length} transactions</span>
      </div>
      <div className="relative">
        <FiSearch size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by bill number or customer..." className="pl-8 text-sm h-9" />
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left p-2.5 text-xs font-semibold text-muted-foreground">Bill #</th>
                  <th className="text-left p-2.5 text-xs font-semibold text-muted-foreground">Date</th>
                  <th className="text-left p-2.5 text-xs font-semibold text-muted-foreground">Customer</th>
                  <th className="text-center p-2.5 text-xs font-semibold text-muted-foreground">Items</th>
                  <th className="text-right p-2.5 text-xs font-semibold text-muted-foreground">Total</th>
                  <th className="text-center p-2.5 text-xs font-semibold text-muted-foreground">Payment</th>
                  <th className="text-center p-2.5 text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="text-center p-2.5 text-xs font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((bill) => (
                  <React.Fragment key={bill.id}>
                    <tr className="border-b border-border hover:bg-secondary/30 cursor-pointer transition-colors" onClick={() => setExpandedBill(expandedBill === bill.id ? null : bill.id)}>
                      <td className="p-2.5 font-medium text-primary text-xs">{bill.id}</td>
                      <td className="p-2.5 text-xs">{bill.date}</td>
                      <td className="p-2.5 text-xs">{bill.customerName ?? '-'}</td>
                      <td className="p-2.5 text-center text-xs">{Array.isArray(bill.items) ? bill.items.length : 0}</td>
                      <td className="p-2.5 text-right text-xs font-semibold">{formatCurrency(bill.total)}</td>
                      <td className="p-2.5 text-center"><Badge variant="outline" className="text-[10px]">{bill.paymentMethod}</Badge></td>
                      <td className="p-2.5 text-center"><Badge className="text-[10px] bg-green-100 text-green-700 hover:bg-green-100">{bill.status}</Badge></td>
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={(e) => { e.stopPropagation(); setReceiptBill(bill) }} className="p-1 hover:bg-secondary rounded-sm"><FiPrinter size={12} /></button>
                          {expandedBill === bill.id ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
                        </div>
                      </td>
                    </tr>
                    {expandedBill === bill.id && (
                      <tr>
                        <td colSpan={8} className="p-3 bg-secondary/20">
                          <div className="space-y-1.5">
                            <p className="text-xs font-semibold text-muted-foreground">Items:</p>
                            {Array.isArray(bill.items) && bill.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-xs bg-background rounded-sm p-1.5">
                                <span>{item?.name ?? 'Item'} x{item?.quantity ?? 0}</span>
                                <span className="font-medium">{formatCurrency((item?.price ?? 0) * (item?.quantity ?? 0))}</span>
                              </div>
                            ))}
                            <Separator />
                            <div className="flex justify-between text-xs flex-wrap gap-1">
                              <span>Subtotal: {formatCurrency(bill.subtotal)}</span>
                              <span>Tax: {formatCurrency(bill.tax)}</span>
                              {bill.discount > 0 && (
                                <span className="text-green-600">
                                  Discount{bill.discountName ? ` (${bill.discountName}${bill.discountPercentage ? ' - ' + bill.discountPercentage + '%' : ''})` : ''}: -{formatCurrency(bill.discount)}
                                </span>
                              )}
                            </div>
                            {bill.customerPhone && (
                              <p className="text-[10px] text-muted-foreground mt-1">Customer Phone: {bill.customerPhone}</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {filteredBills.length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground text-sm">No bills found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <ReceiptModal open={receiptBill !== null} onClose={() => setReceiptBill(null)} bill={receiptBill} />
    </div>
  )
}

// ─── INVENTORY SCREEN ─────────────────────────────────────────
function InventoryScreen({
  products, setProducts
}: {
  products: Product[]
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [form, setForm] = useState({ name: '', barcode: '', category: '', price: '', stock: '', unit: 'pcs' })

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.barcode.includes(searchQuery) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const openAddModal = () => {
    setForm({ name: '', barcode: '', category: '', price: '', stock: '', unit: 'pcs' })
    setEditProduct(null)
    setShowAddModal(true)
  }

  const openEditModal = (product: Product) => {
    setForm({ name: product.name, barcode: product.barcode, category: product.category, price: String(product.price), stock: String(product.stock), unit: product.unit })
    setEditProduct(product)
    setShowAddModal(true)
  }

  const handleSave = () => {
    if (!form.name || !form.barcode || !form.price || !form.stock) return
    if (editProduct) {
      setProducts(prev => prev.map(p => p.id === editProduct.id ? { ...p, name: form.name, barcode: form.barcode, category: form.category, price: Number(form.price), stock: Number(form.stock), unit: form.unit } : p))
    } else {
      const newProduct: Product = { id: 'P' + String(Math.floor(Math.random() * 9000) + 1000), name: form.name, barcode: form.barcode, category: form.category, price: Number(form.price), stock: Number(form.stock), unit: form.unit }
      setProducts(prev => [...prev, newProduct])
    }
    setShowAddModal(false)
  }

  const handleDelete = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  const lowStockCount = products.filter(p => p.stock < 20).length
  const medStockCount = products.filter(p => p.stock >= 20 && p.stock < 50).length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Inventory Management</h2>
          <p className="text-xs text-muted-foreground">{products.length} products total</p>
        </div>
        <div className="flex gap-2 items-center">
          {lowStockCount > 0 && <Badge variant="destructive" className="text-xs gap-1"><FiAlertTriangle size={10} />{lowStockCount} Low Stock</Badge>}
          {medStockCount > 0 && <Badge variant="secondary" className="text-xs gap-1"><FiAlertTriangle size={10} />{medStockCount} Medium</Badge>}
          <Button size="sm" onClick={openAddModal} className="h-8 gap-1"><FiPlus size={12} /> Add Product</Button>
        </div>
      </div>
      <div className="relative">
        <FiSearch size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search products..." className="pl-8 text-sm h-9" />
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left p-2.5 text-xs font-semibold text-muted-foreground">Product</th>
                  <th className="text-left p-2.5 text-xs font-semibold text-muted-foreground">Barcode</th>
                  <th className="text-left p-2.5 text-xs font-semibold text-muted-foreground">Category</th>
                  <th className="text-right p-2.5 text-xs font-semibold text-muted-foreground">Price</th>
                  <th className="text-center p-2.5 text-xs font-semibold text-muted-foreground">Stock</th>
                  <th className="text-center p-2.5 text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="text-center p-2.5 text-xs font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                    <td className="p-2.5 text-xs font-medium">{product.name}</td>
                    <td className="p-2.5 text-xs text-muted-foreground font-mono">{product.barcode}</td>
                    <td className="p-2.5"><Badge variant="outline" className="text-[10px]">{product.category}</Badge></td>
                    <td className="p-2.5 text-xs text-right font-semibold">{formatCurrency(product.price)}</td>
                    <td className="p-2.5 text-xs text-center">{product.stock}</td>
                    <td className="p-2.5 text-center">
                      <Badge className={`text-[10px] ${product.stock < 20 ? 'bg-red-100 text-red-700 hover:bg-red-100' : product.stock < 50 ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' : 'bg-green-100 text-green-700 hover:bg-green-100'}`}>
                        {product.stock < 20 ? 'Low' : product.stock < 50 ? 'Medium' : 'In Stock'}
                      </Badge>
                    </td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEditModal(product)} className="p-1 hover:bg-secondary rounded-sm text-muted-foreground hover:text-foreground"><FiEdit2 size={12} /></button>
                        <button onClick={() => handleDelete(product.id)} className="p-1 hover:bg-destructive/10 rounded-sm text-destructive"><FiTrash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
            <DialogDescription>Fill in the product details below</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Product Name *</Label>
              <Input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Product name" className="text-sm h-8 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Barcode *</Label>
              <Input value={form.barcode} onChange={(e) => setForm(prev => ({ ...prev, barcode: e.target.value }))} placeholder="Barcode" className="text-sm h-8 mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Category</Label>
                <Input value={form.category} onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))} placeholder="Category" className="text-sm h-8 mt-1" />
              </div>
              <div>
                <Label className="text-xs">Unit</Label>
                <Input value={form.unit} onChange={(e) => setForm(prev => ({ ...prev, unit: e.target.value }))} placeholder="pcs" className="text-sm h-8 mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Price *</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm(prev => ({ ...prev, price: e.target.value }))} placeholder="0" className="text-sm h-8 mt-1" />
              </div>
              <div>
                <Label className="text-xs">Stock Qty *</Label>
                <Input type="number" value={form.stock} onChange={(e) => setForm(prev => ({ ...prev, stock: e.target.value }))} placeholder="0" className="text-sm h-8 mt-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={!form.name || !form.barcode || !form.price || !form.stock}>{editProduct ? 'Update' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── DISCOUNTS & OFFERS SCREEN ────────────────────────────────
function DiscountsScreen({
  offers, setOffers
}: {
  offers: Offer[]
  setOffers: React.Dispatch<React.SetStateAction<Offer[]>>
}) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editOffer, setEditOffer] = useState<Offer | null>(null)
  const [form, setForm] = useState({ name: '', type: 'percentage' as 'percentage' | 'flat' | 'bogo', value: '', validFrom: '', validTo: '', categories: '', code: '' })

  const generateCode = (name: string, type: string, value: string): string => {
    if (!name) return ''
    const words = name.toUpperCase().split(/\s+/)
    const prefix = words.length > 1 ? words.map(w => w[0] ?? '').join('').slice(0, 4) : name.toUpperCase().slice(0, 4)
    if (type === 'percentage' && value) return prefix + value
    if (type === 'flat' && value) return 'FLAT' + value
    return prefix
  }

  const openAddModal = () => {
    setForm({ name: '', type: 'percentage', value: '', validFrom: '', validTo: '', categories: '', code: '' })
    setEditOffer(null)
    setShowAddModal(true)
  }

  const openEditModal = (offer: Offer) => {
    setForm({ name: offer.name, type: offer.type, value: String(offer.value), validFrom: offer.validFrom, validTo: offer.validTo, categories: Array.isArray(offer.categories) ? offer.categories.join(', ') : '', code: offer.code ?? '' })
    setEditOffer(offer)
    setShowAddModal(true)
  }

  const handleSave = () => {
    if (!form.name || !form.validFrom || !form.validTo) return
    const cats = form.categories.split(',').map(c => c.trim()).filter(Boolean)
    const code = form.code.trim() || generateCode(form.name, form.type, form.value)
    if (editOffer) {
      setOffers(prev => prev.map(o => o.id === editOffer.id ? { ...o, name: form.name, type: form.type, value: Number(form.value), validFrom: form.validFrom, validTo: form.validTo, categories: cats, code } : o))
    } else {
      const newOffer: Offer = { id: 'O' + String(Math.floor(Math.random() * 9000) + 1000), name: form.name, type: form.type, value: Number(form.value), validFrom: form.validFrom, validTo: form.validTo, categories: cats, active: true, code }
      setOffers(prev => [...prev, newOffer])
    }
    setShowAddModal(false)
  }

  const toggleOffer = (id: string) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, active: !o.active } : o))
  }

  const deleteOffer = (id: string) => {
    setOffers(prev => prev.filter(o => o.id !== id))
  }

  const typeLabel = (type: string) => {
    if (type === 'percentage') return 'Percentage Off'
    if (type === 'flat') return 'Flat Discount'
    return 'Buy One Get One'
  }

  const typeIcon = (type: string) => {
    if (type === 'percentage') return <FiPercent size={16} />
    if (type === 'flat') return <FiDollarSign size={16} />
    return <FiTag size={16} />
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Discounts & Offers</h2>
          <p className="text-xs text-muted-foreground">{offers.filter(o => o.active).length} active offers</p>
        </div>
        <Button size="sm" onClick={openAddModal} className="h-8 gap-1"><FiPlus size={12} /> Create Offer</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {offers.map((offer) => (
          <Card key={offer.id} className={`${!offer.active ? 'opacity-60' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-sm flex items-center justify-center ${offer.active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {typeIcon(offer.type)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{offer.name}</p>
                    <p className="text-[10px] text-muted-foreground">{typeLabel(offer.type)}</p>
                  </div>
                </div>
                <Switch checked={offer.active} onCheckedChange={() => toggleOffer(offer.id)} />
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Code:</span>
                  <Badge variant="secondary" className="text-[10px] font-mono font-bold tracking-wider">{offer.code}</Badge>
                </div>
                {offer.type !== 'bogo' && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">Value:</span>
                    <span className="font-semibold">{offer.type === 'percentage' ? `${offer.value}%` : formatCurrency(offer.value)}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <FiCalendar size={10} className="text-muted-foreground" />
                  <span className="text-muted-foreground">{offer.validFrom} to {offer.validTo}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {Array.isArray(offer.categories) && offer.categories.map((cat, i) => (
                    <Badge key={i} variant="outline" className="text-[9px]">{cat}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-1 mt-3">
                <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 gap-1" onClick={() => openEditModal(offer)}><FiEdit2 size={10} /> Edit</Button>
                <Button variant="outline" size="sm" className="h-7 text-[10px] text-destructive hover:text-destructive gap-1" onClick={() => deleteOffer(offer.id)}><FiTrash2 size={10} /> Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editOffer ? 'Edit Offer' : 'Create Offer'}</DialogTitle>
            <DialogDescription>Configure the promotional offer</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Offer Name *</Label>
              <Input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Offer name" className="text-sm h-8 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Type</Label>
              <div className="flex gap-1 mt-1">
                {(['percentage', 'flat', 'bogo'] as const).map(t => (
                  <button key={t} onClick={() => setForm(prev => ({ ...prev, type: t }))} className={`flex-1 text-xs py-1.5 rounded-sm border transition-colors ${form.type === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:bg-secondary'}`}>{t === 'percentage' ? '% Off' : t === 'flat' ? 'Flat' : 'BOGO'}</button>
                ))}
              </div>
            </div>
            {form.type !== 'bogo' && (
              <div>
                <Label className="text-xs">Value *</Label>
                <Input type="number" value={form.value} onChange={(e) => setForm(prev => ({ ...prev, value: e.target.value }))} placeholder="0" className="text-sm h-8 mt-1" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Valid From *</Label>
                <Input type="date" value={form.validFrom} onChange={(e) => setForm(prev => ({ ...prev, validFrom: e.target.value }))} className="text-sm h-8 mt-1" />
              </div>
              <div>
                <Label className="text-xs">Valid To *</Label>
                <Input type="date" value={form.validTo} onChange={(e) => setForm(prev => ({ ...prev, validTo: e.target.value }))} className="text-sm h-8 mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Discount Code</Label>
              <div className="flex gap-2 mt-1">
                <Input value={form.code} onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))} placeholder="e.g. SAVE10" className="text-sm h-8 font-mono" />
                <Button variant="outline" size="sm" className="h-8 text-xs px-2 shrink-0" onClick={() => setForm(prev => ({ ...prev, code: generateCode(prev.name, prev.type, prev.value) }))}>Auto</Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Leave blank to auto-generate. This code is used at POS checkout.</p>
            </div>
            <div>
              <Label className="text-xs">Applicable Categories (comma-separated)</Label>
              <Input value={form.categories} onChange={(e) => setForm(prev => ({ ...prev, categories: e.target.value }))} placeholder="Dairy, Grains" className="text-sm h-8 mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={!form.name || !form.validFrom || !form.validTo}>{editOffer ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── ANALYTICS DASHBOARD SCREEN ──────────────────────────────
function AnalyticsDashboardScreen({ bills }: { bills: Bill[] }) {
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])

  const todaysBills = bills.filter(b => (b.date ?? '').includes('2025-02-26'))
  const todayRevenue = todaysBills.reduce((sum, b) => sum + (b.total ?? 0), 0)
  const totalTransactions = bills.length
  const totalRevenue = bills.reduce((sum, b) => sum + (b.total ?? 0), 0)
  const avgBillValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0

  const allItems = bills.flatMap(b => Array.isArray(b.items) ? b.items : [])
  const itemCount: Record<string, { name: string; qty: number; revenue: number }> = {}
  allItems.forEach(item => {
    const name = item?.name ?? 'Unknown'
    if (!itemCount[name]) itemCount[name] = { name, qty: 0, revenue: 0 }
    itemCount[name].qty += item?.quantity ?? 0
    itemCount[name].revenue += (item?.price ?? 0) * (item?.quantity ?? 0)
  })
  const topProducts = Object.values(itemCount).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

  const maxDailySale = Math.max(...DAILY_SALES.map(d => d.revenue))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Analytics Dashboard</h2>
        <Button size="sm" onClick={() => setChatOpen(true)} className="h-8 gap-1"><FiMessageCircle size={12} /> Ask Analytics</Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Today Revenue</p>
                <p className="text-xl font-bold text-foreground mt-0.5">{formatCurrency(todayRevenue)}</p>
                <p className="text-[10px] text-green-600 font-medium mt-0.5 flex items-center gap-0.5"><FiTrendingUp size={10} /> +12.5% vs yesterday</p>
              </div>
              <div className="w-9 h-9 rounded-sm bg-blue-100 flex items-center justify-center"><FiDollarSign size={16} className="text-blue-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Transactions</p>
                <p className="text-xl font-bold text-foreground mt-0.5">{totalTransactions}</p>
                <p className="text-[10px] text-green-600 font-medium mt-0.5 flex items-center gap-0.5"><FiTrendingUp size={10} /> +8 today</p>
              </div>
              <div className="w-9 h-9 rounded-sm bg-green-100 flex items-center justify-center"><FiActivity size={16} className="text-green-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Avg Bill Value</p>
                <p className="text-xl font-bold text-foreground mt-0.5">{formatCurrency(avgBillValue)}</p>
                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">per transaction</p>
              </div>
              <div className="w-9 h-9 rounded-sm bg-purple-100 flex items-center justify-center"><FiBarChart2 size={16} className="text-purple-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Top Product</p>
                <p className="text-sm font-bold text-foreground mt-0.5 truncate">{topProducts[0]?.name ?? 'N/A'}</p>
                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{topProducts[0]?.qty ?? 0} units sold</p>
              </div>
              <div className="w-9 h-9 rounded-sm bg-orange-100 flex items-center justify-center"><FiPackage size={16} className="text-orange-600" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Daily Sales Bar Chart */}
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-sm">Weekly Sales</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-2">
            <div className="flex items-end gap-2 h-40">
              {DAILY_SALES.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-muted-foreground font-medium">{String(d.revenue / 1000)}k</span>
                  <div className="w-full rounded-sm transition-all duration-500" style={{ height: `${(d.revenue / maxDailySale) * 120}px`, backgroundColor: `hsl(220, 75%, ${50 + i * 3}%)` }} />
                  <span className="text-[10px] text-muted-foreground">{d.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-sm">Category Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-2">
            <div className="space-y-2.5">
              {CATEGORY_DIST.map((cat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-16 text-right shrink-0">{cat.name}</span>
                  <div className="flex-1 h-5 bg-secondary rounded-sm overflow-hidden">
                    <div className="h-full rounded-sm transition-all duration-500" style={{ width: `${cat.value}%`, backgroundColor: cat.color }} />
                  </div>
                  <span className="text-xs font-semibold w-8">{cat.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products Table */}
      <Card>
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-sm">Top Selling Products</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-2">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-xs font-semibold text-muted-foreground">#</th>
                  <th className="text-left p-2 text-xs font-semibold text-muted-foreground">Product</th>
                  <th className="text-right p-2 text-xs font-semibold text-muted-foreground">Units Sold</th>
                  <th className="text-right p-2 text-xs font-semibold text-muted-foreground">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="p-2 text-xs text-muted-foreground">{i + 1}</td>
                    <td className="p-2 text-xs font-medium">{product.name}</td>
                    <td className="p-2 text-xs text-right">{product.qty}</td>
                    <td className="p-2 text-xs text-right font-semibold">{formatCurrency(product.revenue)}</td>
                  </tr>
                ))}
                {topProducts.length === 0 && (
                  <tr><td colSpan={4} className="p-4 text-center text-muted-foreground text-xs">No sales data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} agentId={ANALYTICS_AGENT_ID} agentName="Sales Analytics" messages={chatMessages} setMessages={setChatMessages} />
    </div>
  )
}

// ─── CUSTOMER MANAGEMENT SCREEN ──────────────────────────────
function CustomerManagementScreen({
  customers, setCustomers, bills
}: {
  customers: Customer[]
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>
  bills: Bill[]
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [form, setForm] = useState({ name: '', phone: '' })

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  )

  const handleAddCustomer = () => {
    if (!form.name || !form.phone) return
    const newCustomer: Customer = { id: 'C' + String(Math.floor(Math.random() * 9000) + 1000), name: form.name, phone: form.phone, totalVisits: 0, totalSpend: 0, lastVisit: 'N/A', loyaltyPoints: 0 }
    setCustomers(prev => [...prev, newCustomer])
    setForm({ name: '', phone: '' })
    setShowAddModal(false)
  }

  const getCustomerBills = (name: string) => {
    return bills.filter(b => b.customerName === name)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Customer Management</h2>
          <p className="text-xs text-muted-foreground">{customers.length} customers</p>
        </div>
        <Button size="sm" onClick={() => { setForm({ name: '', phone: '' }); setShowAddModal(true) }} className="h-8 gap-1"><FiPlus size={12} /> Add Customer</Button>
      </div>
      <div className="relative">
        <FiSearch size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name or phone..." className="pl-8 text-sm h-9" />
      </div>

      <div className="flex gap-3">
        <div className={`${selectedCustomer ? 'flex-[3]' : 'flex-1'} transition-all min-w-0`}>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="text-left p-2.5 text-xs font-semibold text-muted-foreground">Name</th>
                      <th className="text-left p-2.5 text-xs font-semibold text-muted-foreground">Phone</th>
                      <th className="text-center p-2.5 text-xs font-semibold text-muted-foreground">Visits</th>
                      <th className="text-right p-2.5 text-xs font-semibold text-muted-foreground">Total Spend</th>
                      <th className="text-left p-2.5 text-xs font-semibold text-muted-foreground">Last Visit</th>
                      <th className="text-center p-2.5 text-xs font-semibold text-muted-foreground">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id} className={`border-b border-border cursor-pointer transition-colors ${selectedCustomer?.id === customer.id ? 'bg-primary/5' : 'hover:bg-secondary/30'}`} onClick={() => setSelectedCustomer(selectedCustomer?.id === customer.id ? null : customer)}>
                        <td className="p-2.5 text-xs font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><FiUser size={10} className="text-primary" /></div>
                            {customer.name}
                          </div>
                        </td>
                        <td className="p-2.5 text-xs text-muted-foreground">{customer.phone}</td>
                        <td className="p-2.5 text-xs text-center">{customer.totalVisits}</td>
                        <td className="p-2.5 text-xs text-right font-semibold">{formatCurrency(customer.totalSpend)}</td>
                        <td className="p-2.5 text-xs">{customer.lastVisit}</td>
                        <td className="p-2.5 text-center"><Badge variant="secondary" className="text-[10px]">{customer.loyaltyPoints} pts</Badge></td>
                      </tr>
                    ))}
                    {filteredCustomers.length === 0 && (
                      <tr><td colSpan={6} className="p-8 text-center text-muted-foreground text-sm">No customers found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer Detail Panel */}
        {selectedCustomer && (
          <div className="flex-[2] min-w-0">
            <Card className="sticky top-16">
              <CardHeader className="p-3 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Customer Details</CardTitle>
                  <button onClick={() => setSelectedCustomer(null)} className="p-1 hover:bg-secondary rounded-sm"><FiX size={14} /></button>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <FiUser size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{selectedCustomer.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><FiPhone size={10} /> {selectedCustomer.phone}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-secondary/50 rounded-sm p-2 text-center">
                    <p className="text-lg font-bold text-primary">{selectedCustomer.totalVisits}</p>
                    <p className="text-[10px] text-muted-foreground">Total Visits</p>
                  </div>
                  <div className="bg-secondary/50 rounded-sm p-2 text-center">
                    <p className="text-lg font-bold text-primary">{selectedCustomer.loyaltyPoints}</p>
                    <p className="text-[10px] text-muted-foreground">Loyalty Points</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Total Spend</span>
                    <span className="font-semibold">{formatCurrency(selectedCustomer.totalSpend)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Last Visit</span>
                    <span>{selectedCustomer.lastVisit}</span>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-semibold mb-1.5">Purchase History</p>
                  {getCustomerBills(selectedCustomer.name).length === 0 && (
                    <p className="text-xs text-muted-foreground">No linked purchase history</p>
                  )}
                  {getCustomerBills(selectedCustomer.name).map((bill) => (
                    <div key={bill.id} className="flex justify-between items-center text-xs bg-secondary/50 rounded-sm p-1.5 mb-1">
                      <div>
                        <span className="font-medium text-primary">{bill.id}</span>
                        <span className="text-muted-foreground ml-2">{bill.date}</span>
                      </div>
                      <span className="font-semibold">{formatCurrency(bill.total)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
            <DialogDescription>Enter customer details</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Full Name *</Label>
              <Input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Customer name" className="text-sm h-8 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Phone Number *</Label>
              <Input value={form.phone} onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))} placeholder="Phone number" className="text-sm h-8 mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAddCustomer} disabled={!form.name || !form.phone}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── AGENT STATUS DISPLAY ─────────────────────────────────────
function AgentStatusPanel({ activeAgentId }: { activeAgentId: string | null }) {
  const agents = [
    { id: BILLING_AGENT_ID, name: 'Billing Assistant Agent', purpose: 'Product queries, discount lookups, transaction support', model: 'OpenAI gpt-4.1' },
    { id: ANALYTICS_AGENT_ID, name: 'Sales Analytics Agent', purpose: 'Sales trends, top sellers, revenue insights', model: 'Perplexity sonar-pro' },
  ]
  return (
    <Card className="mt-4">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">AI Agents</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-1.5">
        {agents.map(agent => (
          <div key={agent.id} className="flex items-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full shrink-0 ${activeAgentId === agent.id ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
            <div className="min-w-0 flex-1">
              <span className="font-medium text-foreground">{agent.name}</span>
              <span className="text-muted-foreground ml-1">-- {agent.purpose}</span>
            </div>
            <Badge variant="outline" className="text-[9px] shrink-0">{agent.model}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ─── MAIN PAGE EXPORT ─────────────────────────────────────────
export default function Page() {
  const [role, setRole] = useState<RoleType>('cashier')
  const [screen, setScreen] = useState<ScreenType>('pos')
  const [sampleMode, setSampleMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  // Shared state
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS)
  const [cart, setCart] = useState<CartItem[]>([])
  const [bills, setBills] = useState<Bill[]>(SAMPLE_BILLS)
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS)
  const [offers, setOffers] = useState<Offer[]>(INITIAL_OFFERS)

  // Receipt modal state
  const [receiptBill, setReceiptBill] = useState<Bill | null>(null)
  const [showReceipt, setShowReceipt] = useState(false)

  const handleGenerateBill = (paymentMethod: string, discountCode: string, discountInfo: { name: string; percentage: number; amount: number } | null, customerInfo: { name: string; phone: string } | null) => {
    if (cart.length === 0) return
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const tax = subtotal * 0.05
    const discountAmount = discountInfo?.amount ?? 0
    const total = subtotal + tax - discountAmount

    const billId = 'B' + String(Math.floor(Math.random() * 9000) + 1000)
    const now = new Date()
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const newBill: Bill = {
      id: billId,
      date: dateStr,
      items: [...cart],
      subtotal,
      tax,
      discount: discountAmount,
      total,
      paymentMethod,
      status: 'Completed',
      customerName: customerInfo?.name,
      customerPhone: customerInfo?.phone,
      discountCode: discountCode || undefined,
      discountName: discountInfo?.name,
      discountPercentage: discountInfo?.percentage,
    }

    // Decrease stock
    setProducts(prev => prev.map(p => {
      const cartItem = cart.find(c => c.id === p.id)
      if (cartItem) return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) }
      return p
    }))

    // Update customer stats if customer info is provided
    if (customerInfo) {
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      const existingCustomer = customers.find(c => c.phone === customerInfo.phone)
      if (existingCustomer) {
        setCustomers(prev => prev.map(c => {
          if (c.phone === customerInfo.phone) {
            return {
              ...c,
              totalVisits: c.totalVisits + 1,
              totalSpend: c.totalSpend + total,
              lastVisit: todayStr,
              loyaltyPoints: c.loyaltyPoints + Math.floor(total / 10),
            }
          }
          return c
        }))
      } else {
        const newCustomer: Customer = {
          id: 'C' + String(Math.floor(Math.random() * 9000) + 1000),
          name: customerInfo.name,
          phone: customerInfo.phone,
          totalVisits: 1,
          totalSpend: total,
          lastVisit: todayStr,
          loyaltyPoints: Math.floor(total / 10),
        }
        setCustomers(prev => [...prev, newCustomer])
      }
    }

    setBills(prev => [newBill, ...prev])
    setReceiptBill(newBill)
    setShowReceipt(true)
    setCart([])
  }

  const screenTitle = (): string => {
    switch (screen) {
      case 'pos': return 'POS Checkout'
      case 'bills': return 'Bill History'
      case 'inventory': return 'Inventory Management'
      case 'discounts': return 'Discounts & Offers'
      case 'analytics': return 'Analytics Dashboard'
      case 'customers': return 'Customer Management'
      default: return ''
    }
  }

  return (
    <PageErrorBoundary>
      <div style={THEME_VARS} className="min-h-screen bg-background text-foreground font-sans">
        <AppSidebar role={role} setRole={setRole} screen={screen} setScreen={setScreen} sidebarOpen={sidebarOpen} />

        {/* Main Content Area */}
        <div className={`transition-all duration-200 ${sidebarOpen ? 'ml-56' : 'ml-0'}`}>
          {/* Top Bar */}
          <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4 sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-secondary rounded-sm">
                <FiMenu size={16} />
              </button>
              <h2 className="text-sm font-semibold">{screenTitle()}</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground cursor-pointer">Sample Data</Label>
                <Switch id="sample-toggle" checked={sampleMode} onCheckedChange={setSampleMode} />
              </div>
              <Badge variant="outline" className="text-[10px]">{role === 'cashier' ? 'Cashier Mode' : 'Manager Mode'}</Badge>
            </div>
          </div>

          {/* Screen Content */}
          <div className="p-4">
            {screen === 'pos' && (
              <POSCheckoutScreen products={products} cart={cart} setCart={setCart} onGenerateBill={handleGenerateBill} sampleMode={sampleMode} offers={offers} customers={customers} setCustomers={setCustomers} />
            )}
            {screen === 'bills' && (
              <BillHistoryScreen bills={bills} />
            )}
            {screen === 'inventory' && (
              <InventoryScreen products={products} setProducts={setProducts} />
            )}
            {screen === 'discounts' && (
              <DiscountsScreen offers={offers} setOffers={setOffers} />
            )}
            {screen === 'analytics' && (
              <AnalyticsDashboardScreen bills={bills} />
            )}
            {screen === 'customers' && (
              <CustomerManagementScreen customers={customers} setCustomers={setCustomers} bills={bills} />
            )}

            <AgentStatusPanel activeAgentId={activeAgentId} />
          </div>
        </div>

        <ReceiptModal open={showReceipt} onClose={() => setShowReceipt(false)} bill={receiptBill} />
      </div>
    </PageErrorBoundary>
  )
}
