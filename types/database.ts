import type { Group, Member, Expense, ExpenseSplit, SettledTransfer } from './index'

type TableDef<Row, Insert, Update> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

export type Database = {
  public: {
    Tables: {
      groups: TableDef<
        Group,
        Omit<Group, 'id' | 'created_at' | 'status'>,
        Partial<Omit<Group, 'id'>>
      >
      members: TableDef<
        Member,
        Omit<Member, 'id' | 'created_at'>,
        Partial<Omit<Member, 'id'>>
      >
      expenses: TableDef<
        Expense,
        Omit<Expense, 'id' | 'created_at'>,
        Partial<Omit<Expense, 'id'>>
      >
      expense_splits: TableDef<
        ExpenseSplit,
        Omit<ExpenseSplit, 'id'>,
        Partial<Omit<ExpenseSplit, 'id'>>
      >
      settled_transfers: TableDef<
        SettledTransfer,
        Omit<SettledTransfer, 'id' | 'created_at'>,
        Partial<Omit<SettledTransfer, 'id'>>
      >
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
