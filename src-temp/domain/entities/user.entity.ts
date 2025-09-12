import { UserEmail } from '../value-objects/user-email.vo';
import { UserId } from '../value-objects/user-id.vo';
import { UserCreatedEvent } from '../events/user-created.event';

export interface UserProps {
  id: UserId;
  clerkId: string;
  email: UserEmail;
  firstName: string;
  lastName: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private constructor(private props: UserProps) {}

  public static create(
    clerkId: string,
    email: UserEmail,
    firstName: string,
    lastName: string,
    imageUrl?: string,
  ): User {
    const user = new User({
      id: new UserId(clerkId),
      clerkId,
      email,
      firstName,
      lastName,
      imageUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Emitir evento de dominio
    user.addDomainEvent(new UserCreatedEvent(user.getId().value, user.getEmail().value, user.getFullName()));

    return user;
  }

  public static fromPrimitives(data: {
    clerkId: string;
    email: string;
    firstName: string;
    lastName: string;
    imageUrl?: string;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return new User({
      id: new UserId(data.clerkId),
      clerkId: data.clerkId,
      email: new UserEmail(data.email),
      firstName: data.firstName,
      lastName: data.lastName,
      imageUrl: data.imageUrl,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  // Getters
  public getId(): UserId {
    return this.props.id;
  }

  public getClerkId(): string {
    return this.props.clerkId;
  }

  public getEmail(): UserEmail {
    return this.props.email;
  }

  public getFirstName(): string {
    return this.props.firstName;
  }

  public getLastName(): string {
    return this.props.lastName;
  }

  public getFullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`.trim();
  }

  public getImageUrl(): string | undefined {
    return this.props.imageUrl;
  }

  public getCreatedAt(): Date {
    return this.props.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  public updateProfile(firstName: string, lastName: string, imageUrl?: string): void {
    this.props.firstName = firstName;
    this.props.lastName = lastName;
    if (imageUrl !== undefined) {
      this.props.imageUrl = imageUrl;
    }
    this.props.updatedAt = new Date();
  }

  public toPrimitives() {
    return {
      clerkId: this.props.clerkId,
      email: this.props.email.value,
      firstName: this.props.firstName,
      lastName: this.props.lastName,
      imageUrl: this.props.imageUrl,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }

  // Domain events management
  private domainEvents: any[] = [];

  public addDomainEvent(event: any): void {
    this.domainEvents.push(event);
  }

  public getDomainEvents(): any[] {
    return this.domainEvents;
  }

  public clearDomainEvents(): void {
    this.domainEvents = [];
  }
}
