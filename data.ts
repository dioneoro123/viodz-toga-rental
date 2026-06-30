import type { Renter } from './types'

export const colleges = ['Forestry', 'Engineering', 'IT', 'HE', 'EDUC', 'CAS']

export const sampleRenters: Renter[] = [
  { id: 'VR-26041', name: 'Mikaela Santos', college: 'CCS', address: 'Brgy. San Roque, Antipolo', phone: '0917 246 8813', toga: 'Bachelor - Medium', amount: 1200, dueDate: '2026-07-04', status: 'Released', reservedDate: '2026-06-24', releaseDate: '2026-06-30', releasedBy: 'Ana', payments: [{ id: 'P-1', amount: 700, method: 'GCash', date: '2026-06-24' }] },
  { id: 'VR-26040', name: 'Jerome Villanueva', college: 'CBA', address: 'Mambugan, Antipolo City', phone: '0998 510 3472', toga: 'Bachelor - Large', amount: 1200, dueDate: '2026-07-03', status: 'Reserved', reservedDate: '2026-06-27', payments: [{ id: 'P-2', amount: 500, method: 'Cash', date: '2026-06-27' }] },
  { id: 'VR-26039', name: 'Patricia Mendoza', college: 'CTE', address: 'Cainta, Rizal', phone: '0915 704 1906', toga: 'Bachelor - Small', amount: 1200, dueDate: '2026-06-29', status: 'Late', reservedDate: '2026-06-20', releaseDate: '2026-06-25', releasedBy: 'Liza', payments: [{ id: 'P-3', amount: 1200, method: 'Bank Transfer', date: '2026-06-20' }] },
  { id: 'VR-26038', name: 'Angelo Ramirez', college: 'CAS', address: 'Taytay, Rizal', phone: '0922 438 2160', toga: 'Bachelor - XL', amount: 1400, dueDate: '2026-06-30', status: 'Returned', reservedDate: '2026-06-18', releaseDate: '2026-06-26', releasedBy: 'Ana', returnedDate: '2026-06-29', payments: [{ id: 'P-4', amount: 1400, method: 'Cash', date: '2026-06-26' }] },
  { id: 'VR-26037', name: 'Nicole Bautista', college: 'CHM', address: 'Masinag, Antipolo', phone: '0906 822 7441', toga: 'Master - Medium', amount: 1800, dueDate: '2026-07-06', status: 'Reserved', reservedDate: '2026-06-29', payments: [{ id: 'P-5', amount: 800, method: 'GCash', date: '2026-06-29' }] },
  { id: 'VR-CAS01', name: 'Granada, John', college: 'CAS', address: '', phone: '', toga: 'Bachelor - Medium', amount: 1000, deposit: 500, dueDate: '2026-07-12', status: 'Reserved', reservedDate: '2026-07-01', payments: [], reviewNote: 'Given total ₱1,000 and balance ₱500. Deposit inferred as ₱500. Review requested.' },
  { id: 'VR-CAS02', name: 'Landicho, Kati', college: 'CAS', address: '', phone: '', toga: 'Bachelor - Medium', amount: 500, deposit: 100, dueDate: '2026-07-12', status: 'Reserved', reservedDate: '2026-07-01', payments: [], reviewNote: 'Given amount ₱500 and deposit ₱100. Kept as provided. Review requested.' },
  { id: 'VR-CAS03', name: 'Ponpayas, Mabeth P.', college: 'CAS', address: '', phone: '', toga: 'Bachelor - Medium', amount: 700, deposit: 100, dueDate: '2026-07-12', status: 'Reserved', reservedDate: '2026-07-01', payments: [], reviewNote: 'Given amount ₱100 and balance ₱600. Total inferred as ₱700. Review requested.' },
]

export const money = (value: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(value)
export const dateLabel = (value?: string) => value ? new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${value}T00:00:00`)) : 'Not set'
export const today = () => {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone:'Asia/Manila', year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(new Date())
  const value = (type:string) => parts.find(part => part.type === type)?.value || ''
  return `${value('year')}-${value('month')}-${value('day')}`
}
export const paid = (r: Renter) => r.payments.reduce((sum, p) => sum + p.amount, 0)
export const lateDays = (r: Renter) => {
  if (r.status === 'Returned' || !['Late', 'Released'].includes(r.status)) return 0
  const diff = Math.floor((new Date(today()).getTime() - new Date(r.dueDate).getTime()) / 86400000)
  return Math.max(0, diff)
}
export const collected = (r: Renter) => (r.deposit || 0) + paid(r)
export const lateFee = (r: Renter) => lateDays(r) * 100 + (r.manualLateFee || 0)
export const balance = (r: Renter) => Math.max(0, r.amount + lateFee(r) - collected(r))
