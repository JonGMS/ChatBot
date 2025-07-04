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
import { create } from 'venom-bot';
import type { Whatsapp } from 'venom-bot/dist/api/whatsapp'; 
import { enviarEmailAssuntoSimples } from './infra/service/email.service'

console.log(process.env.TWILIO_ACCOUNT_SID);

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))

const estadosUsuario = new Map<string, string>();

const options = {
  session: 'session-smj',
  multidevice: true,
  disableWelcome: true,
  logQR: true,
  headless: 'new'

};


create(options as any).then((client: Whatsapp) => {
  console.log("🤖 Bot iniciado!");

  client.onMessage(async (message: any) => {
    const texto = message.body?.trim();
    const telefone = message.from;

    if (message.isGroupMsg) return;

    const estado = estadosUsuario.get(telefone);

    // INÍCIO (sem estado)
    if (!estado) {
      estadosUsuario.set(telefone, "aguardando_se_confirmacao");

      await client.sendText(telefone,
        "Olá! 👋\nSeja bem-vindo(a) à SMJ Advocacia.\nAntes de continuarmos, por favor, poderia nos informar:\n👉 Você já é cliente do nosso escritório?\n" +
        "Responda com o número correspondente:\n*[1]* Sim, sou cliente\n*[2]* Não, ainda não sou cliente"
      );
      return;
    }

    // MENU PRINCIPAL – Cliente ou não
    if (estado === "aguardando_se_confirmacao") {
      if (texto === "1") {
        estadosUsuario.set(telefone, "cliente_andamento_ou_outro");
        await client.sendText(telefone,
          "Perfeito! 😊\nVocê deseja saber o andamento do seu processo?\n" +
          "*[1]* Sim, quero saber o andamento\n" +
          "*[2]* Não, é outro assunto"
        );
      } else if (texto === "2") {
        estadosUsuario.set(telefone, "nao_cliente_escolha_assunto");
        await client.sendText(telefone,
          "Entendi! 😊\nPoderia nos informar sobre qual assunto você precisa de atendimento?\n" +
          "*[1]* Aposentadoria\n" +
          "*[2]* Benefício previdenciário\n" +
          "*[3]* Trabalhista"
        );
      } else {
        await client.sendText(telefone, "Por favor, responda com *1* ou *2*.");
      }
      return;
    }

    // CLIENTE: andamento ou outro
    if (estado === "cliente_andamento_ou_outro") {
      if (texto === "1") {
        estadosUsuario.set(telefone, "cliente_envia_nome");
        await client.sendText(telefone,
          "Tudo certo!\nPor gentileza, nos envie:\n- Seu nome completo 📌"
        );
        await client.sendText(telefone,
          "Sua mensagem será encaminhada ao responsável e você receberá uma resposta em até 24 horas úteis. ⏱"// 📩 EMAIL!!!!!!!!!
        );
        
        await enviarEmailAssuntoSimples(telefone, "Usuário finalizou com a opção 'outro assunto'.", estado);
      } else if (texto === "2") {
        estadosUsuario.delete(telefone); // fim da conversa
        await client.sendText(telefone,
          "Certo! Encaminharemos seu atendimento para análise." // 📩 EMAIL!!!!!!!!!
        );
        await enviarEmailAssuntoSimples(telefone, "Usuário finalizou com a opção 'outro assunto'.", estado);
      } else {
        await client.sendText(telefone, "Por favor, responda com *1* ou *2*.");
      }
      return;
    }

    // NÃO CLIENTE: escolha do assunto
    if (estado === "nao_cliente_escolha_assunto") {
      if (texto === "1") {
        estadosUsuario.delete(telefone);
        await client.sendText(telefone,
          "Ótimo! Para atendimento de aposentadoria, é necessário agendar um horário com a Dra. Sandra.\n" +
          "Por favor, envie seu nome completo, que retornaremos com as opções de agendamento.\n" +
          "Ou se preferir, entre em contato pelo telefone: (49) 3289-3000 📆📞"// 📩 EMAIL!!!!!!!!! e Fazer um recebedor de nome
        );
        await enviarEmailAssuntoSimples(telefone, "Usuário finalizou com a opção 'outro assunto'.", estado);
      } else if (texto === "2" || texto === "3") {
        estadosUsuario.delete(telefone);
        await client.sendText(telefone,
          "Perfeito! ✅\nVocê pode comparecer diretamente ao escritório sem necessidade de agendamento.\n\n" +
          "📍 Atendimento presencial:\n" +
          "🕘 De segunda a quinta, das 08h às 12h e das 13h30 às 18h.\n" +
          "Estamos à disposição para te atender! 👩‍⚖👨‍⚖"
        );
      } else {
        await client.sendText(telefone, "Por favor, responda com *1*, *2* ou *3*.");
      }
      return;
    }

    // Caso o usuário continue após o fluxo
    if (estado === "cliente_envia_nome") {
      estadosUsuario.delete(telefone);
      await client.sendText(telefone, "Obrigado! Seu atendimento foi registrado. ✅");// 📩 EMAIL!!!!!!!!!
    }
    await enviarEmailAssuntoSimples(telefone, "Usuário finalizou com a opção 'outro assunto'.", estado);
  });
});



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