import { createClient } from '@supabase/supabase-js'
import type { Renter } from './types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
export const hasSupabase = Boolean(url && anonKey)
export const supabase = hasSupabase ? createClient(url!, anonKey!) : null

export async function signIn(email:string, password:string) {
  if (!supabase) return
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}
export async function signOut() { if (supabase) await supabase.auth.signOut() }

export function renterToRow(r: Renter) {
  return { reference_no:r.id, dedupe_key:`${r.name.trim().toLowerCase()}|${r.college.trim().toLowerCase()}`, name:r.name, college:r.college, address:r.address, phone:r.phone, toga:r.toga, total_amount:r.amount, deposit_amount:r.deposit||0, manual_late_fee:r.manualLateFee||0, due_date:r.dueDate, status:r.status, reserved_date:r.reservedDate, release_date:r.releaseDate||null, released_by:r.releasedBy||null, returned_date:r.returnedDate||null, review_note:r.reviewNote||null }
}

export async function upsertRenters(renters:Renter[]) {
  if (!supabase) return
  const { data, error } = await supabase.from('renters').upsert(renters.map(renterToRow), { onConflict:'dedupe_key' }).select('id, reference_no')
  if (error) throw error
  for (const row of data || []) {
    const renter = renters.find(r => r.id === row.reference_no); if (!renter) continue
    await supabase.from('payments').delete().eq('renter_id', row.id)
    if (renter.payments.length) {
      const { error:paymentError } = await supabase.from('payments').insert(renter.payments.map(p => ({ renter_id:row.id, amount:p.amount, method:p.method, payment_date:p.date, note:p.note||null })))
      if (paymentError) throw paymentError
    }
  }
}

export async function fetchRenters():Promise<Renter[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('renters').select('*, payments(*)').order('created_at', { ascending:false })
  if (error) throw error
  return (data || []).map((r:any) => ({ id:r.reference_no, name:r.name, college:r.college, address:r.address||'', phone:r.phone||'', toga:r.toga, amount:Number(r.total_amount), deposit:Number(r.deposit_amount), manualLateFee:Number(r.manual_late_fee), dueDate:r.due_date, status:r.status, reservedDate:r.reserved_date, releaseDate:r.release_date||undefined, releasedBy:r.released_by||undefined, returnedDate:r.returned_date||undefined, reviewNote:r.review_note||undefined, payments:(r.payments||[]).map((p:any)=>({id:p.id,amount:Number(p.amount),method:p.method,date:p.payment_date,note:p.note||undefined})) }))
}
