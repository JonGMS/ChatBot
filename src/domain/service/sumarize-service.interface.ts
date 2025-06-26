export default interface SummarizeServiceInterface {
    summarize(text: string): Promise<string>;
}