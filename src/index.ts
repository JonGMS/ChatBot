import * as dotenv from 'dotenv';
dotenv.config();

import bodyParser from 'body-parser';
import express, { Request, Response } from 'express';

import { sendMessage } from './twilio';

import './commands';
import { getCommand } from './commandManager';
import { AudioService } from './infra/audio.service';
import { TranscriptionService } from './infra/transcription.service';
import { SummarizeService } from './infra/summarize.service';

console.log(process.env.TWILIO_ACCOUNT_SID);

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))


app.post('/whatsapp', async (req: Request, res :Response) => {
    const {To, From, Body} = req.body;

    const [commandName, ...args] = Body.split(' ');
    const command = getCommand(commandName);
    if(command){
        const response = command.execute(args);
        sendMessage(To, From, response);
    }else{
        sendMessage(To, From, 'Comando não reconhecido. \nEnvie "help" para a lista de comandos disponíveis.');
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