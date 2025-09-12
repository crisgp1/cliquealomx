export interface UserProps {
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  constructor(private props: UserProps) {}

  static fromPrimitives(data: UserProps): User {
    return new User({
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    });
  }

  get clerkId(): string {
    return this.props.clerkId;
  }

  get email(): string {
    return this.props.email;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`.trim();
  }

  get imageUrl(): string | undefined {
    return this.props.imageUrl;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toPrimitives(): UserProps {
    return { ...this.props };
  }
}
