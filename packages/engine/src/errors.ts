export class InvalidActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidActionError";
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class TransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransitionError";
  }
}
