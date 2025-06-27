import * as dotenv from 'dotenv';
dotenv.config();

import bodyParser from 'body-parser';
import express, { Request, Response } from 'express';

import { sendMessage } from './twilio';

import './commands';
import { getCommand } from './commandManager';
import { AudioService } from './infra/service/audio.service';
import { TranscriptionService } from './infra/service/transcription.service';
import { SummarizeService } from './infra/service/summarize.service';
import { TranscribeMessageUseCase } from './usecase/transcribe-message/transcribe-message.usecases';
import { MessageMemoryRepository } from './infra/memory/message-memory.repository';

console.log(process.env.TWILIO_ACCOUNT_SID);

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))


app.post('/whatsapp', async (req: Request, res :Response) => {
    const {
        SmsMessageSid,
        MediaContentType0,
        NumMedia,
        ProfileName,
        WaId,
        Body,
        To,
        From,
        MediaUrl0,
        } = req.body;

    if(NumMedia == '1' && MediaContentType0 == 'audio/ogg' && MediaUrl0.length !==0){
        const audioService = new AudioService();
        const transcriptionService = new TranscriptionService();
        const summarizeService = new SummarizeService();
        const messageRepository = new MessageMemoryRepository();

        const transcribeMessageUseCase = new TranscribeMessageUseCase(
            transcriptionService, 
            audioService,
            summarizeService,
            messageRepository
        )

        const response = await transcribeMessageUseCase.execute({
            smsMessageSid: SmsMessageSid,
            mediaContentType0: MediaContentType0,
            numMedia: NumMedia, 
            profileName: ProfileName,
            waId: WaId,
            body: Body,
            to: To,
            from: From,
            mediaUrl0: MediaUrl0
        })
        if(!response) {
            sendMessage(To, From, 'Não foi possivel transcrever a mensagem');
            return;
        }

        sendMessage(To, From, response);
        return;
    }


    //Mensagem inicial
    const [commandName, ...args] = Body.split(' ');
    const command = getCommand(commandName);
    if(command){
        const response = command.execute(args);
        sendMessage(To, From, response);
    }else{
        sendMessage(To, From, 'Olá, envie um audio para transcrição ou envie "help" para lista de commando disponiveis.');
    }
})

app.get('/download', async (req: Request, res: Response) => {

    try {
        const serviceAudio = new AudioService();
        const url = process.env.AUDIO_FILE_PATH;

        if(url == undefined){
            res.status(400).send('URL não informado');
            return;
        }

        const response = await serviceAudio.download(url);
        res.json({ url: response })
    }catch(error) {
        res.status(500).send(error);
    }

});

app.post('/transcribe', async (req: Request, res: Response) => {
    try {
        const transcriptionService = new TranscriptionService();
        const audioPath = '/tmp/2856ac24-0984-4526-80d6-484c78b9db8f.mp3';

        if (audioPath == undefined) {
            res.status(400).send('AudioPath não informada');
            return;
        }
        const response = await transcriptionService.transcribe(audioPath);
        res.json({ text: response }); 
    } catch(error) {
        res.status(500).send(error);
    }
});

app.get('/summarize', async (req: Request, res: Response) => {
    try{
        const summarizeService = new SummarizeService();
        const text = 'O que é o OpenAI?';
        const response = await summarizeService.summarize(text);
        res.json({ text: response });
    }catch (error) {
        res.status(500).send(error);
    }
})

app.listen(port, () => console.log(`${port}`));