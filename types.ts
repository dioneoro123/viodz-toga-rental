export type RentalStatus = 'Reserved' | 'Released' | 'Returned' | 'Late' | 'Damaged/Lost'
export type PaymentMethod = 'Cash' | 'GCash' | 'Bank Transfer'

export interface Payment {
  id: string
  amount: number
  method: PaymentMethod
  date: string
  note?: string
}

export interface Renter {
  id: string
  name: string
  college: string
  address: string
  phone: string
  toga: string
  amount: number
  deposit?: number
  manualLateFee?: number
  reviewNote?: string
  dueDate: string
  status: RentalStatus
  reservedDate: string
  releaseDate?: string
  releasedBy?: string
  returnedDate?: string
  payments: Payment[]
}
