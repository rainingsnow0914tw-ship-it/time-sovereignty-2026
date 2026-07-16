export class InvalidTransitionError extends Error {
  constructor(machine: string, from: string, to: string) {
    super(`Invalid ${machine} transition: ${from} -> ${to}`);
    this.name = "InvalidTransitionError";
  }
}

export class DomainInvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainInvariantError";
  }
}
