import { Message } from "../../domain/entities/message"
import { MessageRepositoryInterface } from "../../domain/repository/message-repository.interface";
import AudioServiceInterface from "../../domain/service/audio-service.interface";
import SummarizeServiceInterface from "../../domain/service/sumarize-service.interface";
import TranscriptionServiceInterface from "../../domain/service/transcription-service.interface";
import { MessageDto } from "./message.dto";

export class TranscribeMessageUseCase{
    constructor(
        private transcriptionService: TranscriptionServiceInterface,
        private audioService: AudioServiceInterface,
        private summarizationService: SummarizeServiceInterface,
        private messageRepository: MessageRepositoryInterface,
    ){}

    //DTO = Data Transforce Objectc
    async execute(messageData: MessageDto): Promise<string | undefined>{
        const newMessage = new Message(
            messageData.smsMessageSid,
            messageData.mediaContentType0,
            messageData.numMedia,
            messageData.profileName,
            messageData.waId,
            messageData.body,
            messageData.to,
            messageData.from,
            messageData.mediaUrl0
        );



        if(!newMessage.isMediaMessage()){
            console.log('Mensagem não tem midia!');
            return undefined;
        }

        this.messageRepository.add(newMessage);

        const mp3Path = await this.audioService.download(newMessage.mediaUrl0);

        const transcription = await this.transcriptionService.transcribe(mp3Path);

        if(transcription.length > 400){
            const summarizedTranscription = await this.summarizationService.summarize(transcription);
            newMessage.setTranscriptionText(summarizedTranscription);
            this.messageRepository.update(newMessage.smsMessageSid, newMessage);
            return summarizedTranscription;
        }

        newMessage.setTranscriptionText(transcription);

        this.messageRepository.update(newMessage.smsMessageSid, newMessage);

        return transcription;
    }
}