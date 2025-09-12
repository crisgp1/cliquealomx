export class UserId {
  public readonly value: string;

  constructor(value: string) {
    if (!value || value.trim() === '') {
      throw new Error('UserId cannot be empty');
    }

    // Clerk user IDs start with "user_"
    if (!value.startsWith('user_')) {
      throw new Error('Invalid Clerk UserId format');
    }

    this.value = value;
  }

  public equals(other: UserId): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
