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
