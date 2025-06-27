import { Message } from "../../domain/entities/message";

export class MessageMemoryRepository{
    private messages: Message[] = [];
    async add(message: Message): Promise<void>{
        this.messages.push(message);

    }

    async update(id: string, updateMessage: Message): Promise<void>{
        const messageIndex = this.messages.findIndex((message) => message.smsMessageSid === id);

        if(!messageIndex){
            throw new Error('Mensagem não encontrada');
        }

        this.messages[messageIndex] = updateMessage;
    }

}