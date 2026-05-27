export type TransactionStatus = 'pending' | 'confirmed' | 'rejected'

export interface Transaction {
  id: string
  fromUserId: string
  toUserId: string
  amount: number
  status: TransactionStatus
  rejectionReason?: string
  createdAt: Date
}
