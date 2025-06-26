export default interface AudioServiceInterface{
    download(url: string): Promise<string>;
}