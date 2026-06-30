import { readFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'

const sources = [
  ['EDUC', '/Users/dionerazeoro/Downloads/EDUC - toga_page_cleaned.csv'],
  ['Engineering', '/Users/dionerazeoro/Downloads/ENGINEERING - Engineering_Toga_Rental_2026_Page.csv'],
  ['Forestry', '/Users/dionerazeoro/Downloads/FORESTRY - Master_Forestry_Toga_Rental_2026.csv'],
  ['IT', '/Users/dionerazeoro/Downloads/IT - IT_toga_page_cleaned.csv'],
  ['CAS', '/Users/dionerazeoro/Downloads/TOGA_CAS - VIODZ_TOGA_CAS_Pages_1_3_Combined.csv'],
  ['HE', '/Users/dionerazeoro/Downloads/Toga_HE - VIODZ_TOGA_RENTAL_2026_Pages_1_to_4_combined.csv'],
]

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const dryRun = process.argv.includes('--dry-run')
if (!dryRun && (!url || !key)) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before importing.')
const supabase = dryRun ? null : createClient(url, key, { auth: { persistSession: false } })

function parseCsv(text) {
  const rows = []; let row = []; let cell = ''; let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '"' && text[i + 1] === '"') { cell += '"'; i++ }
    else if (c === '"') quoted = !quoted
    else if (c === ',' && !quoted) { row.push(cell.trim()); cell = '' }
    else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); row = []; cell = ''
    } else cell += c
  }
  if (cell || row.length) { row.push(cell.trim()); rows.push(row) }
  return rows
}

const clean = value => String(value || '').trim().replace(/\s+/g, ' ')
const number = value => Number(clean(value).replace(/[^0-9.-]/g, '')) || 0
const keyFor = (name, college) => `${clean(name).toLowerCase()}|${clean(college).toLowerCase()}`

function normalize(text, college, source) {
  const rows = parseCsv(text); const headers = rows.shift().map(h => clean(h).toLowerCase().replace(/[^a-z0-9]/g, ''))
  const at = (row, names) => { const i = headers.findIndex(h => names.includes(h)); return i < 0 ? '' : clean(row[i]) }
  return rows.map((row, index) => {
    const name = at(row, ['name', 'renter', 'fullname']); if (!name) return null
    const legacyAmount = number(at(row, ['amount']))
    const explicitDeposit = number(at(row, ['deposit']))
    const notedBalance = number(at(row, ['balance']))
    let deposit = explicitDeposit || legacyAmount; let total = Math.max(900, deposit); let review_note = null
    const lower = name.toLowerCase()
    if (college === 'CAS' && lower.includes('granada') && lower.includes('john')) { total = 1000; deposit = 500; review_note = 'Given total ₱1,000 and balance ₱500. Deposit inferred as ₱500.' }
    else if (college === 'CAS' && lower.includes('landicho') && lower.includes('kati')) { total = 500; deposit = 100; review_note = 'Given amount ₱500 and deposit ₱100. Kept as provided.' }
    else if (college === 'CAS' && lower.includes('ponpayas') && lower.includes('mabeth')) { total = 700; deposit = 100; review_note = 'Given amount ₱100 and balance ₱600. Total inferred as ₱700.' }
    else if (notedBalance && Math.abs(total - deposit - notedBalance) > .01) review_note = `Source balance ₱${notedBalance} differs from calculated balance ₱${total - deposit}.`
    return {
      reference_no: `CSV-${college.toUpperCase()}-${String(index + 1).padStart(3, '0')}`,
      dedupe_key: keyFor(name, college), name, college,
      address: at(row, ['address']), phone: at(row, ['cellnumber', 'phone', 'contact']),
      toga: at(row, ['toga', 'togatype', 'size']) || 'Bachelor - Medium', total_amount: total,
      deposit_amount: deposit, due_date: '2026-07-12', status: 'Reserved', reserved_date: '2026-07-01',
      review_note, import_source: source,
    }
  }).filter(Boolean)
}

let imported = 0
const auditedRows = []
for (const [college, path] of sources) {
  const rows = normalize(await readFile(path, 'utf8'), college, path.split('/').pop())
  auditedRows.push(...rows)
  if (!dryRun) {
    const { error } = await supabase.from('renters').upsert(rows, { onConflict: 'dedupe_key', ignoreDuplicates: true })
    if (error) throw error
  }
  imported += rows.length
  console.log(`${college}: processed ${rows.length}`)
}
console.log(`${dryRun ? 'Dry run complete' : 'Done'}. Processed ${imported} rows. Existing duplicate renter-college pairs were skipped.`)
const duplicateGroups = Object.entries(auditedRows.reduce((groups, row) => ({ ...groups, [row.dedupe_key]: [...(groups[row.dedupe_key] || []), row] }), {})).filter(([, rows]) => rows.length > 1)
if (duplicateGroups.length) {
  console.log('Duplicate source records:')
  for (const [, rows] of duplicateGroups) console.log(`${rows[0].name} | ${rows[0].college} | ${rows.map(row => row.reference_no).join(', ')}`)
} else console.log('No duplicate name-and-college pairs found in source files.')
const crossCollege = Object.entries(auditedRows.reduce((groups, row) => { const name = clean(row.name).toLowerCase(); return { ...groups, [name]: [...(groups[name] || []), row] } }, {})).filter(([, rows]) => rows.length > 1)
if (crossCollege.length) {
  console.log('Names repeated across source files:')
  for (const [, rows] of crossCollege) console.log(`${rows[0].name} | ${rows.map(row => `${row.college} ${row.reference_no}`).join(', ')}`)
}
if (!dryRun) {
  const { data, error } = await supabase.from('renters').select('college')
  if (error) throw error
  const counts = data.reduce((result, row) => ({ ...result, [row.college]: (result[row.college] || 0) + 1 }), {})
  console.log(`Verified in Supabase: ${data.length} total`)
  for (const college of Object.keys(counts).sort()) console.log(`${college}: ${counts[college]}`)
}
