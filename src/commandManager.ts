interface Command {
    name: string;
    description : string;
    execute: (args: string[]) => string;
}

const commandList : Command[] = [];

export const addComand = (command : Command) => {
    commandList.push(command);
}

export const getCommand = (name: string): Command | undefined => {
    return commandList.find(command => command.name === name);
}

export const listCommands = (): Command[] => {
    return commandList;
}