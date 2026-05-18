export type Group = {
  id: string
  name: string
  status: 'active' | 'completed'
  created_at: string
}

export type Member = {
  id: string
  group_id: string
  name: string
  color: string
  device_id: string
  created_at: string
}

export type Expense = {
  id: string
  group_id: string
  paid_by: string
  amount: number
  description: string
  created_at: string
}

export type ExpenseSplit = {
  id: string
  expense_id: string
  member_id: string
}

export type ExpenseWithDetails = {
  id: string
  group_id: string
  paid_by: string
  amount: number
  description: string
  created_at: string
  payer: Pick<Member, 'id' | 'name' | 'color'>
  splits: Array<{ member_id: string }>
}

export type SettledTransfer = {
  id: string
  group_id: string
  from_member_id: string
  to_member_id: string
  amount: number
  created_at: string
}

export type Settlement = {
  from: Member
  to: Member
  amount: number
}
