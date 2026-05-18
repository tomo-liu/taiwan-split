import type { Member, ExpenseWithDetails } from '@/types'

export type MemberBalance = {
  member: Member
  balance: number // positive = to receive, negative = to pay
}

export type SettlementTransfer = {
  from: Member
  to: Member
  amount: number
}

/**
 * Calculates each member's net balance from the expense list.
 * balance = total_paid - total_owed (integer NTD)
 */
export function calculateBalances(
  members: Member[],
  expenses: ExpenseWithDetails[]
): MemberBalance[] {
  const balanceMap = new Map<string, number>(members.map((m) => [m.id, 0]))

  for (const exp of expenses) {
    const n = exp.splits.length
    if (n === 0) continue

    // Integer division: first (remainder) members owe 1 NTD more
    const base = Math.floor(exp.amount / n)
    const remainder = exp.amount - base * n

    // Credit payer the full amount
    balanceMap.set(exp.paid_by, (balanceMap.get(exp.paid_by) ?? 0) + exp.amount)

    // Debit each split member
    exp.splits.forEach((split, i) => {
      const owed = base + (i < remainder ? 1 : 0)
      balanceMap.set(split.member_id, (balanceMap.get(split.member_id) ?? 0) - owed)
    })
  }

  const memberMap = new Map(members.map((m) => [m.id, m]))
  return Array.from(balanceMap.entries())
    .map(([id, balance]) => ({ member: memberMap.get(id)!, balance }))
    .sort((a, b) => b.balance - a.balance)
}

/**
 * Greedy minimum-transfers algorithm.
 * Matches the largest debtor to the largest creditor each step.
 */
export function calculateSettlements(balances: MemberBalance[]): SettlementTransfer[] {
  const creditors = balances
    .filter((b) => b.balance > 0)
    .map((b) => ({ member: b.member, amount: b.balance }))
    .sort((a, b) => b.amount - a.amount)

  const debtors = balances
    .filter((b) => b.balance < 0)
    .map((b) => ({ member: b.member, amount: -b.balance }))
    .sort((a, b) => b.amount - a.amount)

  const transfers: SettlementTransfer[] = []
  let ci = 0
  let di = 0

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci]
    const debtor = debtors[di]
    const amount = Math.min(creditor.amount, debtor.amount)

    transfers.push({ from: debtor.member, to: creditor.member, amount })

    creditor.amount -= amount
    debtor.amount -= amount

    if (creditor.amount === 0) ci++
    if (debtor.amount === 0) di++
  }

  return transfers
}
