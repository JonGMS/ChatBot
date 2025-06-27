import OpenAI from "openai";
import SummarizeServiceInterface from "../../domain/service/sumarize-service.interface";

export class SummarizeService implements SummarizeServiceInterface{
    private temperature = 0.7;
    private prompt = 'Summarize';
    private openai: OpenAI;
    private model = 'gpt-3.5-turbo';

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    async summarize(text: string): Promise<string>{
        const response = await this.openai.chat.completions.create({
            messages: [{ role: 'user', content: `${this.prompt} ${text}`}],
            model: this.model,
            temperature: this.temperature,
        })
        if(!response.choices[0].message.content){
            throw new Error('Erro ao resumir texto');
        }
        return '';
    }
}