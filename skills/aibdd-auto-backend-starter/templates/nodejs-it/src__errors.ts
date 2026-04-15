export class BusinessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessError';
  }
}

export class NotFoundError extends BusinessError {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class InvalidStateError extends BusinessError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStateError';
  }
}
