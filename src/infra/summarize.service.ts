import SummarizeServiceInterface from "../domain/service/sumarize-service.interface";

export class SummarizeService implements SummarizeServiceInterface{
    private temperature = 0.7;
    private prom

    async summarize(text: string): Promise<string>{
        return '';
    }
}