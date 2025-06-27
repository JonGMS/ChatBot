import { addComand, listCommands } from "./commandManager";


// addComand({
//     name: '', 
//     description: 'Responde com "pong"',
//     execute: () => 'pong',
// });

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

