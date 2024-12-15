export class CreateMessageDto {
    readonly chatId: string;      // Chat session ID
    readonly senderId: string;    // Sender's user ID
    readonly receiverId: string;  // Receiver's user ID
    readonly message: string;     // The message content
}
