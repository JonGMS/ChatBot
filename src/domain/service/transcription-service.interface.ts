export default interface TranscriptionServiceInterface{
    transcribe(audioUrl: string): Promise<string>;
}