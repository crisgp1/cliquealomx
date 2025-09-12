export class UserCreatedEvent {
  public readonly eventName = 'user.created';
  public readonly occurredOn: Date;

  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly fullName: string,
  ) {
    this.occurredOn = new Date();
  }

  public toPrimitives() {
    return {
      eventName: this.eventName,
      occurredOn: this.occurredOn,
      userId: this.userId,
      email: this.email,
      fullName: this.fullName,
    };
  }
}
