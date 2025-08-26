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
  let nomeCompleto = "";
  let cpf = "";

  client.onMessage(async (message: any) => {
    const texto = message.body?.trim();
    const telefone = message.from;
    // Validação de áudio recebido
const isAudio = message.mimetype?.startsWith('audio/');
if (isAudio && message.mediaKey && message.content) {
  console.log(`🎤 Áudio recebido de ${telefone} - Tipo: ${message.mimetype}`);

  const audioService = new AudioService();
  const transcriptionService = new TranscriptionService();
  const summarizeService = new SummarizeService();
  const messageRepository = new MessageMemoryRepository();

  const transcribeMessageUseCase = new TranscribeMessageUseCase(
    transcriptionService, 
    audioService,
    summarizeService,
    messageRepository
  );

  const response = await transcribeMessageUseCase.execute({
    smsMessageSid: message.id,
    mediaContentType0: message.mimetype,
    numMedia: '1',
    profileName: message.sender?.pushname || 'Desconhecido',
    waId: telefone,
    body: message.body || '',
    to: message.to,
    from: telefone,
    mediaUrl0: message.content
  });

  if (!response) {
    await client.sendText(telefone, '⚠️ Não foi possível transcrever o áudio.');
    return;
  }// Não foi possivel transcrever - CHAT

  await client.sendText(telefone, `📝 Transcrição do áudio:\n${response}`);
  return;
} else if (message.mimetype && message.mimetype.startsWith('audio/') === false) {
  console.log(`❌ Mensagem recebida não é áudio: ${message.mimetype}`);
  await client.sendText(telefone, '⚠️ Por favor, envie um áudio no formato suportado.');
  return;
}//// Não foi possivel transcrever - LOG SERVIDOR

    if (message.isGroupMsg) return;
    let estadoInicial = ""
    const estado = estadosUsuario.get(telefone);

  //   if (message.mimetype === 'audio/ogg' && message.mediaKey && message.content) {
  //   const audioService = new AudioService();
  //   const transcriptionService = new TranscriptionService();
  //   const summarizeService = new SummarizeService();
  //   const messageRepository = new MessageMemoryRepository();

  //   const transcribeMessageUseCase = new TranscribeMessageUseCase(
  //     transcriptionService, 
  //     audioService,
  //     summarizeService,
  //     messageRepository
  //   );

  //   const response = await transcribeMessageUseCase.execute({
  //     smsMessageSid: message.id,
  //     mediaContentType0: message.mimetype,
  //     numMedia: '1',
  //     profileName: message.sender?.pushname || 'Desconhecido',
  //     waId: telefone,
  //     body: message.body || '',
  //     to: message.to,
  //     from: telefone,
  //     mediaUrl0: message.content // ou use algum método para salvar o áudio temporariamente
  //   });//Transcreve

  //   if (!response) {
  //     await client.sendText(telefone, 'Não foi possível transcrever o áudio. 😕');
  //     return;
  //   }

  //   await client.sendText(telefone, `📝 Transcrição do áudio:\n${response}`);
  //   return;
  // }

    if (!estado) {
      estadosUsuario.set(telefone, "aguardando_se_confirmacao");
      await client.sendText(telefone,
        "Olá! 👋\nSeja bem-vindo(a) à SMJ Advocacia.\nAntes de continuarmos, por favor, poderia nos informar:\n👉 Você já é cliente do nosso escritório?\n" +
        "Responda com o número correspondente:\n*[1]* Sim, sou cliente\n*[2]* Não, ainda não sou cliente\n*[3]* Qual é o endereço do escritório?\n*[4]* Quais são os horários de atendimento?"
      );
      return;
    }

    if (estado === "aguardando_se_confirmacao") {
      if (texto === "1") {
        estadosUsuario.set(telefone, "cliente_envia_nome");
        estadoInicial = "cliente_envia_nome";
        await client.sendText(telefone,
          "Tudo certo!\nPor gentileza, nos envie:\n- Seu nome completo 📌"
        );
      } else if (texto === "2") {
        estadosUsuario.set(telefone, "nao_cliente_escolha_assunto");
        await client.sendText(telefone,
          "Entendi! 😊\nPoderia nos informar sobre qual assunto você precisa de atendimento?\n" +
          "*[1]* Aposentadoria\n" +
          "*[2]* Benefício previdenciário\n" +
          "*[3]* Trabalhista\n" +
          "*[4]* Auxilio doença"
        );
      } else if( texto === "3") {
        await client.sendText(telefone,
          "📍 Nosso endereço é:\nAv. Duque de Caxias, 80 - Centro, Lages - SC"
        );
      } else if( texto === "4") {
        await client.sendText(telefone,
          "🕒 Nosso horário de atendimento é de segunda a sexta-feira, das 8h às 12h e das 13h30 às 18h."
        );
      }

      else {
        await client.sendText(telefone, "Por favor, responda com *1*, *2*, *3* ou *4*.");
      }
      return;
    }

    if (estado === "cliente_envia_nome") {
      nomeCompleto = texto;
      estadosUsuario.set(telefone, "cliente_envia_cpf");
      await client.sendText(telefone, "Obrigado! Agora, por favor, envie seu CPF 📄");
      return;
    }

    if (estado === "cliente_envia_cpf") {
      cpf = texto;
      estadosUsuario.delete(telefone);

      await client.sendText(telefone,
        "Perfeito! ✅ Seu atendimento foi registrado.\nVocê receberá uma resposta em até 24h úteis."
      );

      const corpoEmail = `🤖 Novo atendimento do cliente:\n📱 Telefone: ${telefone}\n👤 Nome: ${nomeCompleto}\n🆔 CPF: ${cpf}`;
      
      await enviarEmailAssuntoSimples(telefone, "Novo atendimento via WhatsApp", corpoEmail);
      


      // limpa variáveis
      nomeCompleto = "";
      cpf = "";
      return;
    }

    if (estado === "nao_cliente_escolha_assunto") {
      if (texto === "1") {
        estadosUsuario.set(telefone, "cliente_envia_nome");
        await client.sendText(telefone,
          "Ótimo! Para atendimento de aposentadoria, por favor envie seu nome completo 📌"
        );
      } else if (texto === "2" || texto === "3" || texto === "4") {
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