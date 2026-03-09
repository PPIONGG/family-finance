// Flat Rate: ดอกเบี้ยคิดจากเงินต้นตลอด
export function calculateFlat(principal: number, ratePercent: number, months: number) {
  const totalInterest = principal * (ratePercent / 100) * (months / 12)
  const totalAmount = principal + totalInterest
  const monthlyPayment = totalAmount / months
  return { totalInterest: round2(totalInterest), totalAmount: round2(totalAmount), monthlyPayment: round2(monthlyPayment) }
}

// Reducing Balance (PMT): ดอกเบี้ยลดลงตามเงินต้นที่เหลือ (คิดรายเดือน)
export function calculateReducing(principal: number, annualRatePercent: number, months: number) {
  const monthlyRate = annualRatePercent / 100 / 12
  if (monthlyRate === 0) return calculateNoInterest(principal, months)
  const monthlyPayment =
    principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1)
  const totalAmount = monthlyPayment * months
  const totalInterest = totalAmount - principal
  return { totalInterest: round2(totalInterest), totalAmount: round2(totalAmount), monthlyPayment: round2(monthlyPayment) }
}

// Reducing Balance Daily: ลดต้นลดดอกรายวัน (แบบ SEasyCash / สินเชื่อจริง)
// ใช้ค่างวดที่ user กรอกมา (จาก SEasyCash) แล้วคำนวณดอกเบี้ยรายวันตามจำนวนวันจริง
// งวดสุดท้ายปรับให้หมดพอดี
export function calculateReducingDaily(
  principal: number,
  annualRatePercent: number,
  months: number,
  startDate: Date,
  dueDay: number,
  fixedPayment?: number,
) {
  if (annualRatePercent === 0) return {
    ...calculateNoInterest(principal, months),
    schedule: generateDailySchedule(principal, 0, months, startDate, dueDay),
  }

  // ใช้ค่างวดที่ user กรอก หรือคำนวณจาก PMT เป็น fallback
  let payment: number
  if (fixedPayment && fixedPayment > 0) {
    payment = fixedPayment
  } else {
    const monthlyRate = annualRatePercent / 100 / 12
    payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1)
  }

  // สร้าง schedule: ค่างวดคงที่ + ดอกเบี้ยรายวัน, งวดสุดท้ายปรับให้หมดพอดี
  const schedule = generateDailySchedule(principal, annualRatePercent, months, startDate, dueDay, payment)

  const totalAmount = schedule.reduce((sum, s) => sum + s.totalPayment, 0)
  const totalInterest = totalAmount - principal

  return {
    totalInterest: round2(totalInterest),
    totalAmount: round2(totalAmount),
    monthlyPayment: round2(payment),
    schedule,
  }
}

// สร้าง amortization schedule แบบรายวัน (SEasyCash style)
// ค่างวดคงที่ (จาก PMT) ทุกงวด ยกเว้นงวดสุดท้ายปรับให้หมดพอดี
// ดอกเบี้ยคิดรายวันตามจำนวนวันจริงและยอดคงเหลือ
function generateDailySchedule(
  principal: number,
  annualRatePercent: number,
  months: number,
  startDate: Date,
  dueDay: number,
  fixedPayment?: number,
) {
  const dailyRate = annualRatePercent / 100 / 365
  const payment = fixedPayment ?? principal / months
  let balance = principal
  let prevDate = startDate
  const schedule: {
    installmentNumber: number
    dueDate: Date
    days: number
    interest: number
    principalPortion: number
    totalPayment: number
    remainingBalance: number
  }[] = []

  // หางวดแรกที่ห่างจากวันเริ่มอย่างน้อย 25 วัน
  let firstMonth = startDate.getMonth() + 1
  while (diffDays(startDate, new Date(startDate.getFullYear(), firstMonth, dueDay)) < 25) {
    firstMonth++
  }

  for (let i = 1; i <= months; i++) {
    const dueDate = new Date(startDate.getFullYear(), firstMonth + (i - 1), dueDay)
    const days = diffDays(prevDate, dueDate)
    const interest = round2(balance * dailyRate * days)

    // งวดสุดท้ายจ่ายให้หมดเป๊ะ
    const isLast = i === months
    const totalPayment = isLast ? round2(balance + interest) : round2(payment)
    const principalPortion = round2(totalPayment - interest)
    balance = isLast ? 0 : round2(balance - principalPortion)

    schedule.push({
      installmentNumber: i,
      dueDate,
      days,
      interest,
      principalPortion,
      totalPayment,
      remainingBalance: balance,
    })

    prevDate = dueDate
  }

  return schedule
}

// No Interest
export function calculateNoInterest(principal: number, months: number) {
  return { totalInterest: 0, totalAmount: principal, monthlyPayment: round2(principal / months) }
}

// Calculate based on type
export function calculateInstallment(
  principal: number,
  ratePercent: number,
  months: number,
  interestType: 'flat' | 'reducing' | 'reducing_daily' | 'none',
  startDate?: Date,
  dueDay?: number,
  fixedPayment?: number,
) {
  switch (interestType) {
    case 'flat':
      return calculateFlat(principal, ratePercent, months)
    case 'reducing':
      return calculateReducing(principal, ratePercent, months)
    case 'reducing_daily':
      return calculateReducingDaily(
        principal, ratePercent, months,
        startDate ?? new Date(), dueDay ?? 1,
        fixedPayment,
      )
    case 'none':
      return calculateNoInterest(principal, months)
  }
}

// คำนวณการหาร
export function calculateSplit(
  monthlyPayment: number,
  members: { profileId: string; splitType: 'equal' | 'percentage' | 'fixed'; splitValue?: number }[]
) {
  return members.map((m) => {
    let amountPerMonth: number
    switch (m.splitType) {
      case 'equal':
        amountPerMonth = monthlyPayment / members.length
        break
      case 'percentage':
        amountPerMonth = monthlyPayment * ((m.splitValue ?? 0) / 100)
        break
      case 'fixed':
        amountPerMonth = m.splitValue ?? 0
        break
    }
    return { ...m, amountPerMonth: round2(amountPerMonth) }
  })
}

// Generate payment schedule (แบบเท่ากันทุกงวด)
export function generatePaymentSchedule(
  installmentId: string,
  totalInstallments: number,
  monthlyPayment: number,
  startDate: Date,
  dueDay: number
) {
  // หางวดแรกที่ห่างจากวันเริ่มอย่างน้อย 25 วัน
  let firstMonth = startDate.getMonth() + 1
  while (diffDays(startDate, new Date(startDate.getFullYear(), firstMonth, dueDay)) < 25) {
    firstMonth++
  }

  const payments = []
  for (let i = 1; i <= totalInstallments; i++) {
    const dueDate = new Date(startDate.getFullYear(), firstMonth + (i - 1), dueDay)
    payments.push({
      installment_id: installmentId,
      installment_number: i,
      amount_due: monthlyPayment,
      amount_paid: 0,
      due_date: dueDate,
      status: i === 1 ? 'pending' as const : 'upcoming' as const,
    })
  }
  return payments
}

// Generate payment schedule จากวันชำระงวดแรกตรงๆ (Shopee style — ไม่ต้องคำนวณ 25 วัน)
export function generatePaymentScheduleFromFirstDate(
  installmentId: string,
  totalInstallments: number,
  monthlyPayment: number,
  firstPayDate: Date,
  dueDay: number,
) {
  const payments = []
  for (let i = 1; i <= totalInstallments; i++) {
    const dueDate = new Date(firstPayDate.getFullYear(), firstPayDate.getMonth() + (i - 1), dueDay)
    payments.push({
      installment_id: installmentId,
      installment_number: i,
      amount_due: monthlyPayment,
      amount_paid: 0,
      due_date: dueDate,
      status: i === 1 ? 'pending' as const : 'upcoming' as const,
    })
  }
  return payments
}

// Generate payment schedule แบบรายวัน (แต่ละงวดไม่เท่ากัน)
export function generateDailyPaymentSchedule(
  installmentId: string,
  schedule: { installmentNumber: number; dueDate: Date; totalPayment: number }[]
) {
  return schedule.map((s, i) => ({
    installment_id: installmentId,
    installment_number: s.installmentNumber,
    amount_due: round2(s.totalPayment),
    amount_paid: 0,
    due_date: s.dueDate,
    status: i === 0 ? 'pending' as const : 'upcoming' as const,
  }))
}

// หาจำนวนวันระหว่าง 2 วัน
function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
