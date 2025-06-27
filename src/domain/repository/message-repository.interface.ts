import { Message } from "../entities/message";

export interface MessageRepositoryInterface {
    add(message : Message): Promise<void>;
    findById(id: string): Message | undefined;
    update(id: string, updateMessage: Message): Message | undefined;
}