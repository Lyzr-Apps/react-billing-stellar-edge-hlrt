'use client'

/**
 * Excel Utility - Dynamic SheetJS loader for Excel read/write
 * Loads XLSX library from CDN at runtime to avoid npm install issues
 */

declare global {
  interface Window {
    XLSX: any
  }
}

let xlsxLoaded = false
let xlsxLoadPromise: Promise<any> | null = null

/**
 * Dynamically load SheetJS (XLSX) library from CDN
 */
export async function loadXLSX(): Promise<any> {
  if (typeof window === 'undefined') return null
  if (xlsxLoaded && window.XLSX) return window.XLSX

  if (xlsxLoadPromise) return xlsxLoadPromise

  xlsxLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js'
    script.onload = () => {
      xlsxLoaded = true
      resolve(window.XLSX)
    }
    script.onerror = () => {
      xlsxLoadPromise = null
      reject(new Error('Failed to load XLSX library'))
    }
    document.head.appendChild(script)
  })

  return xlsxLoadPromise
}

// ─── TYPES ─────────────────────────────────────────────────────

export interface DailySalesRow {
  day: string
  revenue: number
}

export interface CategoryRow {
  name: string
  value: number
}

export interface ProductSalesRow {
  product: string
  category: string
  unitsSold: number
  revenue: number
}

export interface ExcelSalesData {
  dailySales: DailySalesRow[]
  categoryDistribution: CategoryRow[]
  productSales: ProductSalesRow[]
}

// ─── CHART COLORS ──────────────────────────────────────────────

const CHART_COLORS = [
  'hsl(220, 75%, 50%)',
  'hsl(160, 65%, 40%)',
  'hsl(280, 55%, 55%)',
  'hsl(35, 80%, 50%)',
  'hsl(0, 70%, 50%)',
  'hsl(190, 60%, 45%)',
  'hsl(330, 60%, 50%)',
  'hsl(60, 70%, 45%)',
]

// ─── DOWNLOAD TEMPLATE ─────────────────────────────────────────

/**
 * Download an Excel template file with 3 sheets:
 * 1. Daily Sales - columns: Day, Revenue
 * 2. Category Distribution - columns: Category, Percentage
 * 3. Product Sales - columns: Product, Category, Units Sold, Revenue
 *
 * Each sheet contains sample data rows to guide the user.
 */
export async function downloadExcelTemplate(): Promise<void> {
  const XLSX = await loadXLSX()
  if (!XLSX) throw new Error('XLSX library not available')

  const wb = XLSX.utils.book_new()

  // Sheet 1: Daily Sales
  const dailySalesData = [
    ['Day', 'Revenue'],
    ['Mon', 4200],
    ['Tue', 3800],
    ['Wed', 5100],
    ['Thu', 4600],
    ['Fri', 6200],
    ['Sat', 7800],
    ['Sun', 5500],
  ]
  const ws1 = XLSX.utils.aoa_to_sheet(dailySalesData)
  ws1['!cols'] = [{ wch: 15 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, ws1, 'Daily Sales')

  // Sheet 2: Category Distribution
  const categoryData = [
    ['Category', 'Percentage'],
    ['Dairy', 28],
    ['Grains', 22],
    ['Oils', 18],
    ['Beverages', 12],
    ['Essentials', 10],
    ['Others', 10],
  ]
  const ws2 = XLSX.utils.aoa_to_sheet(categoryData)
  ws2['!cols'] = [{ wch: 20 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, ws2, 'Category Distribution')

  // Sheet 3: Product Sales
  const productData = [
    ['Product', 'Category', 'Units Sold', 'Revenue'],
    ['Amul Milk 1L', 'Dairy', 85, 5525],
    ['Basmati Rice 5kg', 'Grains', 42, 18900],
    ['Whole Wheat Bread', 'Bakery', 65, 2925],
    ['Sugar 1kg', 'Essentials', 120, 5760],
    ['Red Label Tea 500g', 'Beverages', 38, 11210],
    ['Maggi Noodles Pack', 'Instant Food', 95, 6840],
    ['Olive Oil 1L', 'Oils', 22, 13178],
    ['Eggs (12 pack)', 'Dairy', 56, 4704],
    ['Coconut Oil 500ml', 'Oils', 34, 6426],
    ['Tomato Ketchup 500g', 'Condiments', 48, 5520],
  ]
  const ws3 = XLSX.utils.aoa_to_sheet(productData)
  ws3['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, ws3, 'Product Sales')

  // Download
  XLSX.writeFile(wb, 'SuperMart_Analytics_Template.xlsx')
}

// ─── IMPORT EXCEL FILE ─────────────────────────────────────────

/**
 * Parse an uploaded Excel file and extract sales data from all 3 sheets.
 * Returns structured data that maps directly to the analytics charts.
 */
export async function importExcelFile(file: File): Promise<ExcelSalesData> {
  const XLSX = await loadXLSX()
  if (!XLSX) throw new Error('XLSX library not available')

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })

        const result: ExcelSalesData = {
          dailySales: [],
          categoryDistribution: [],
          productSales: [],
        }

        // Parse Sheet 1: Daily Sales
        const sheet1Name = workbook.SheetNames[0]
        if (sheet1Name) {
          const ws1 = workbook.Sheets[sheet1Name]
          const rows: any[][] = XLSX.utils.sheet_to_json(ws1, { header: 1 })
          // Skip header row
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i]
            if (row && row[0] != null && row[1] != null) {
              result.dailySales.push({
                day: String(row[0]).trim(),
                revenue: Number(row[1]) || 0,
              })
            }
          }
        }

        // Parse Sheet 2: Category Distribution
        const sheet2Name = workbook.SheetNames[1]
        if (sheet2Name) {
          const ws2 = workbook.Sheets[sheet2Name]
          const rows: any[][] = XLSX.utils.sheet_to_json(ws2, { header: 1 })
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i]
            if (row && row[0] != null && row[1] != null) {
              result.categoryDistribution.push({
                name: String(row[0]).trim(),
                value: Number(row[1]) || 0,
              })
            }
          }
        }

        // Parse Sheet 3: Product Sales
        const sheet3Name = workbook.SheetNames[2]
        if (sheet3Name) {
          const ws3 = workbook.Sheets[sheet3Name]
          const rows: any[][] = XLSX.utils.sheet_to_json(ws3, { header: 1 })
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i]
            if (row && row[0] != null) {
              result.productSales.push({
                product: String(row[0]).trim(),
                category: row[1] != null ? String(row[1]).trim() : '',
                unitsSold: Number(row[2]) || 0,
                revenue: Number(row[3]) || 0,
              })
            }
          }
        }

        // Sort product sales by revenue descending
        result.productSales.sort((a, b) => b.revenue - a.revenue)

        resolve(result)
      } catch (err) {
        reject(new Error('Failed to parse Excel file. Make sure it follows the template format.'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Assign colors to category distribution data
 */
export function assignCategoryColors(categories: CategoryRow[]): Array<CategoryRow & { color: string }> {
  return categories.map((cat, i) => ({
    ...cat,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }))
}

// ─── ANALYTICS FULL EXPORT ─────────────────────────────────────

export interface AnalyticsExportData {
  todayRevenue: number
  totalTransactions: number
  avgBillValue: number
  topProductName: string
  topProductUnits: number
  weeklySales: Array<{ day: string; revenue: number }>
  categoryDist: Array<{ name: string; value: number }>
  topProducts: Array<{ name: string; qty: number; revenue: number }>
  stockDetails: Array<{ name: string; barcode: string; category: string; price: number; stock: number; unit: string; status: string }>
}

/**
 * Export full analytics dashboard data to Excel with 5 sheets:
 * 1. Dashboard Summary - Key metrics
 * 2. Weekly Sales - Day-wise revenue
 * 3. Category Distribution - Category percentages
 * 4. Top Selling Products - Product sales table
 * 5. Stock Inventory - Current stock quantities and status
 */
export async function exportAnalyticsExcel(data: AnalyticsExportData): Promise<void> {
  const XLSX = await loadXLSX()
  if (!XLSX) throw new Error('XLSX library not available')

  const wb = XLSX.utils.book_new()
  const today = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })

  // Sheet 1: Dashboard Summary
  const summaryData = [
    ['SuperMart - Analytics Report'],
    [`Generated: ${today}`],
    [''],
    ['Metric', 'Value'],
    ['Today Revenue', data.todayRevenue],
    ['Total Transactions', data.totalTransactions],
    ['Average Bill Value', data.avgBillValue],
    ['Top Product', data.topProductName],
    ['Top Product Units Sold', data.topProductUnits],
  ]
  const ws1 = XLSX.utils.aoa_to_sheet(summaryData)
  ws1['!cols'] = [{ wch: 25 }, { wch: 20 }]
  ws1['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }]
  XLSX.utils.book_append_sheet(wb, ws1, 'Dashboard Summary')

  // Sheet 2: Weekly Sales
  const weeklySalesArr: any[][] = [['Day', 'Revenue (INR)']]
  data.weeklySales.forEach(d => weeklySalesArr.push([d.day, d.revenue]))
  weeklySalesArr.push(['', ''])
  weeklySalesArr.push(['Total', data.weeklySales.reduce((s, d) => s + d.revenue, 0)])
  const ws2 = XLSX.utils.aoa_to_sheet(weeklySalesArr)
  ws2['!cols'] = [{ wch: 15 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(wb, ws2, 'Weekly Sales')

  // Sheet 3: Category Distribution
  const catArr: any[][] = [['Category', 'Percentage (%)']]
  data.categoryDist.forEach(c => catArr.push([c.name, c.value]))
  const ws3 = XLSX.utils.aoa_to_sheet(catArr)
  ws3['!cols'] = [{ wch: 20 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(wb, ws3, 'Category Distribution')

  // Sheet 4: Top Selling Products
  const prodArr: any[][] = [['#', 'Product', 'Units Sold', 'Revenue (INR)']]
  data.topProducts.forEach((p, i) => prodArr.push([i + 1, p.name, p.qty, p.revenue]))
  const ws4 = XLSX.utils.aoa_to_sheet(prodArr)
  ws4['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 12 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(wb, ws4, 'Top Selling Products')

  // Sheet 5: Stock Inventory
  const stockArr: any[][] = [['Product', 'Barcode', 'Category', 'Price (INR)', 'Stock Qty', 'Unit', 'Status']]
  data.stockDetails.forEach(p => stockArr.push([p.name, p.barcode, p.category, p.price, p.stock, p.unit, p.status]))
  stockArr.push(['', '', '', '', '', '', ''])
  const totalStock = data.stockDetails.reduce((s, p) => s + p.stock, 0)
  const lowStockCount = data.stockDetails.filter(p => p.stock < 20).length
  stockArr.push(['Total Items', String(data.stockDetails.length), '', '', totalStock, '', `${lowStockCount} Low Stock`])
  const ws5 = XLSX.utils.aoa_to_sheet(stockArr)
  ws5['!cols'] = [{ wch: 25 }, { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 8 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, ws5, 'Stock Inventory')

  XLSX.writeFile(wb, `SuperMart_Analytics_${new Date().toISOString().split('T')[0]}.xlsx`)
}

// ─── CUSTOMER EXPORT ────────────────────────────────────────────

export interface CustomerExportRow {
  id: string
  name: string
  phone: string
  totalVisits: number
  totalSpend: number
  lastVisit: string
  loyaltyPoints: number
}

/**
 * Export customer list to Excel
 */
export async function exportCustomersExcel(customers: CustomerExportRow[]): Promise<void> {
  const XLSX = await loadXLSX()
  if (!XLSX) throw new Error('XLSX library not available')

  const wb = XLSX.utils.book_new()
  const today = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })

  const custArr: any[][] = [
    ['SuperMart - Customer Data'],
    [`Exported: ${today}`],
    [''],
    ['Customer ID', 'Name', 'Phone', 'Total Visits', 'Total Spend (INR)', 'Last Visit', 'Loyalty Points'],
  ]
  customers.forEach(c => custArr.push([c.id, c.name, c.phone, c.totalVisits, c.totalSpend, c.lastVisit, c.loyaltyPoints]))
  custArr.push(['', '', '', '', '', '', ''])
  custArr.push(['Total Customers', String(customers.length), '', '', customers.reduce((s, c) => s + c.totalSpend, 0), '', customers.reduce((s, c) => s + c.loyaltyPoints, 0)])

  const ws = XLSX.utils.aoa_to_sheet(custArr)
  ws['!cols'] = [{ wch: 14 }, { wch: 20 }, { wch: 14 }, { wch: 12 }, { wch: 18 }, { wch: 14 }, { wch: 14 }]
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }]
  XLSX.utils.book_append_sheet(wb, ws, 'Customers')

  XLSX.writeFile(wb, `SuperMart_Customers_${new Date().toISOString().split('T')[0]}.xlsx`)
}

/**
 * Download a customer import template
 */
export async function downloadCustomerTemplate(): Promise<void> {
  const XLSX = await loadXLSX()
  if (!XLSX) throw new Error('XLSX library not available')

  const wb = XLSX.utils.book_new()
  const templateData = [
    ['Name', 'Phone', 'Total Visits', 'Total Spend', 'Last Visit (YYYY-MM-DD)', 'Loyalty Points'],
    ['Rahul Sharma', '9876543210', 45, 32500, '2025-02-26', 1625],
    ['Priya Patel', '9876543211', 32, 28700, '2025-02-25', 1435],
    ['', '', '', '', '', ''],
    ['Instructions:'],
    ['- Fill customer data starting from row 2'],
    ['- Name and Phone are required fields'],
    ['- Phone must be 10 digits (no country code)'],
    ['- Leave Total Visits, Total Spend, Last Visit, Loyalty Points as 0 for new customers'],
    ['- Save as .xlsx and import'],
  ]
  const ws = XLSX.utils.aoa_to_sheet(templateData)
  ws['!cols'] = [{ wch: 20 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 22 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, ws, 'Customers')

  XLSX.writeFile(wb, 'SuperMart_Customer_Import_Template.xlsx')
}

/**
 * Import customers from Excel file
 */
export async function importCustomersExcel(file: File): Promise<CustomerExportRow[]> {
  const XLSX = await loadXLSX()
  if (!XLSX) throw new Error('XLSX library not available')

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        if (!sheetName) { reject(new Error('No sheets found')); return }

        const ws = workbook.Sheets[sheetName]
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 })

        const customers: CustomerExportRow[] = []
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i]
          if (!row || !row[0] || !row[1]) continue
          const name = String(row[0]).trim()
          const phone = String(row[1]).trim().replace(/\D/g, '')
          if (!name || phone.length < 10) continue
          // Skip instruction rows
          if (name.toLowerCase().startsWith('instructions') || name.startsWith('-')) continue

          customers.push({
            id: 'C' + String(Math.floor(Math.random() * 9000) + 1000),
            name,
            phone: phone.slice(-10),
            totalVisits: Number(row[2]) || 0,
            totalSpend: Number(row[3]) || 0,
            lastVisit: row[4] ? String(row[4]).trim() : 'N/A',
            loyaltyPoints: Number(row[5]) || 0,
          })
        }

        if (customers.length === 0) {
          reject(new Error('No valid customer data found. Ensure Name and Phone columns are filled.'))
          return
        }

        resolve(customers)
      } catch (err) {
        reject(new Error('Failed to parse Excel file. Please use the template format.'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}
