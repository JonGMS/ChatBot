import SummarizeServiceInterface from "../domain/service/sumarize-service.interface";

export class SummarizeService implements SummarizeServiceInterface{
    async summarize(text: string): Promise<string>{
        return '';
    }
}