import TranscriptionServiceInterface from "../domain/service/transcription-service.interface";

export class TranscriptionService implements TranscriptionServiceInterface{
    transcribe(audioUrl: string): Promise<string> {
        return Promise.resolve('');
    }
}