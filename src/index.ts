import * as dotenv from 'dotenv';
dotenv.config();

import bodyParser from 'body-parser';
import express, { Request, Response } from 'express';

import { sendMessage } from './twilio';




console.log(process.env.TWILIO_ACCOUNT_SID);

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!');
});

app.get('/bots', (req: Request, res: Response) => {
    res.json({
        message: 'Listando Todos os Bots'
    })
})

app.post('/send', async (req: Request, res :Response) => {
    const {from, to, body}= req.body;

    await sendMessage(from, to, body)
    res.send('Mensagem enviada!')
})

app.post('/bots', async (req: Request, res: Response) =>{
    console.log(req.body)
})

app.listen(port, () => console.log(`${port}`));