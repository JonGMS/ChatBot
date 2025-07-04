import { addComand, listCommands } from "./commandManager";


addComand({
    name: '1', 
    description: 'SubMenu Atendimento ao Cliente',
    execute: () => 'Perfeito! 😊\nVocê deseja saber o andamento do seu processo?\n\n*[1]* Sim, quero saber o andamento\n*[2]* Não, é outro assunto',
});

addComand({
    name: 'ping', 
    description: 'Responde com "pong"',
    execute: () => 'pong',
});

addComand({
    name: 'echo', 
    description: 'Repete a mensagem que foi enviada"',
    execute: (args: string[]) => (args.join(' ')),
});

addComand({
    name: 'help', 
    description: 'Lista todos os comandos disponíveis',
    execute: () => {
        return listCommands().map(
            command => `${command.name}:${command.description}`
        ).join('\n');
    },
})

