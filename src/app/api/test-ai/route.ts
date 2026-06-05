import { NextResponse } from 'next/server'
import { translateText, AIResultSchema } from '@/lib/ai'

export async function GET() {
  const results: any[] = []

  // Document 1: Medical Bill Text
  const medicalBillText = `
    ST. JUDE CLINIC & HOSPITAL
    100 Medical Plaza, Suite 400
    Patient: John Doe
    Account: 88291-A
    Date: May 12, 2026
    
    Itemized Procedures & Surcharges:
    - Standard Outpatient Treatment Fee: $2,040.00
    - Out-of-network Specialist Consultation: $450.00
    
    Total Charge: $2,490.00
    Aetna Insurance Payment: -$1,200.00
    Patient Copayment Paid: -$50.00
    
    TOTAL OUTSTANDING BALANCE: $1,240.00
    Please remit payment by June 30, 2026. Unpaid balances will be sent to collections.
  `

  // Document 2: Lease Agreement Text
  const leaseAgreementText = `
    RESIDENTIAL TENANCY AGREEMENT
    Skyline Apartments, Unit 4B
    
    Landlord: Skyline Properties LLC
    Tenant: John Doe
    
    Term: 12 months, commencing July 1, 2026, and ending June 30, 2027.
    Rent: $2,100.00 per month, due in full on the 1st of each calendar month.
    Security Deposit: $2,100.00 due at signing.
    
    Late Payments: Rent unpaid after the 5th of the month will incur a 10% late fee.
    Termination: Early lease termination by tenant results in forfeiture of security deposit.
    Subletting: Subletting is strictly prohibited without prior written landlord approval.
  `

  // Document 3: Insurance Policy Notice Text
  const insuranceNoticeText = `
    SAFE-RIDE AUTO INSURANCE COMPANY
    Renewal Notice & Premium Statement
    Policy: AUTO-9821-X
    Renewal Effective Date: July 10, 2026
    
    Dear Policyholder,
    Your auto insurance policy is scheduled for automatic renewal on July 10, 2026.
    
    Coverage Details:
    - Bodily Injury / Property Damage: Standard Liability
    - Collision Deductible: $500.00
    - Comprehensive Deductible: $500.00
    
    Premium Adjustments:
    Due to regional risk adjustments, your monthly premium has been increased by 8% to $185.00.
    Payments must be received by the due date. Failure to pay will suspend coverage immediately.
  `

  // 1. Run Medical Bill Test
  try {
    console.log('[Test Route] Running Medical Bill Test...')
    const result = await translateText(medicalBillText)
    
    // Zod validation check
    const parseCheck = AIResultSchema.safeParse(result)
    
    results.push({
      test: 'Medical Bill Translation',
      success: parseCheck.success,
      errors: parseCheck.success ? null : parseCheck.error.errors,
      data: result
    })
  } catch (err: any) {
    results.push({
      test: 'Medical Bill Translation',
      success: false,
      error: err.message
    })
  }

  // 2. Run Lease Agreement Test
  try {
    console.log('[Test Route] Running Lease Agreement Test...')
    const result = await translateText(leaseAgreementText)
    const parseCheck = AIResultSchema.safeParse(result)
    
    results.push({
      test: 'Lease Agreement Translation',
      success: parseCheck.success,
      errors: parseCheck.success ? null : parseCheck.error.errors,
      data: result
    })
  } catch (err: any) {
    results.push({
      test: 'Lease Agreement Translation',
      success: false,
      error: err.message
    })
  }

  // 3. Run Insurance Policy Test
  try {
    console.log('[Test Route] Running Insurance Policy Test...')
    const result = await translateText(insuranceNoticeText)
    const parseCheck = AIResultSchema.safeParse(result)
    
    results.push({
      test: 'Insurance Policy Translation',
      success: parseCheck.success,
      errors: parseCheck.success ? null : parseCheck.error.errors,
      data: result
    })
  } catch (err: any) {
    results.push({
      test: 'Insurance Policy Translation',
      success: false,
      error: err.message
    })
  }

  // 4. Run Edge Case Validation: Malformed response parsing / empty string handling
  try {
    console.log('[Test Route] Running Edge Case Error/Fallback Test...')
    // Passing extremely small/unclassifiable text to trigger fallback/graceful handling
    const result = await translateText('empty or unclassifiable text')
    const parseCheck = AIResultSchema.safeParse(result)
    
    results.push({
      test: 'Edge Case / Fallback handling',
      success: parseCheck.success,
      data: result
    })
  } catch (err: any) {
    results.push({
      test: 'Edge Case / Fallback handling',
      success: false,
      error: err.message
    })
  }

  const allSuccess = results.every(r => r.success)

  return NextResponse.json({
    success: allSuccess,
    timestamp: new Date().toISOString(),
    results
  })
}
