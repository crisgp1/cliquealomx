export class UserEmail {
  public readonly value: string;

  constructor(value: string) {
    if (!value || value.trim() === '') {
      throw new Error('Email cannot be empty');
    }

    if (!this.isValidEmail(value)) {
      throw new Error('Invalid email format');
    }

    this.value = value.toLowerCase().trim();
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  public equals(other: UserEmail): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
