export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400
  ) {
    super(message)
    this.name = 'DomainError'
  }
}

export class UserNotFoundError extends DomainError {
  constructor(userId: string) {
    super(`User '${userId}' not found`, 'USER_NOT_FOUND', 404)
  }
}

export class InsufficientBalanceError extends DomainError {
  constructor() {
    super('Sender has insufficient balance', 'INSUFFICIENT_BALANCE', 422)
  }
}

export class TransactionNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Transaction '${id}' not found`, 'TRANSACTION_NOT_FOUND', 404)
  }
}

export class TransactionNotPendingError extends DomainError {
  constructor() {
    super('Transaction is not in pending status', 'TRANSACTION_NOT_PENDING', 409)
  }
}

export class SameUserTransactionError extends DomainError {
  constructor() {
    super('Sender and receiver must be different users', 'SAME_USER_TRANSACTION', 400)
  }
}

export class InvalidAmountError extends DomainError {
  constructor() {
    super('Amount must be greater than 0', 'INVALID_AMOUNT', 400)
  }
}
