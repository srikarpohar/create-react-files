import { Argument } from "./arguments.js";
import { Option } from './option.js';
import parserRegexes from './constants.js';
import { capitalizeFirstLetter } from './utils.js'

export class Command {
    static allCommands = [];
    static globalHelpOption = new Option('h', 'help', 'Display help for command', false, '--help');

    static isGlobalHelpOption = function(option) {
        return [`-${Command.globalHelpOption.shortForm}`, `--${Command.globalHelpOption.name}`].includes(option);
    }
    
    static displayGlobalHelp = function() {
        const arg0 = process.argv0;
        console.log(`Usage: ${arg0} [options] [command]`);
    
        console.log("Options:")
        console.table([{
            option: '-h --help',
            description: 'Display help for command',
            defaultValue: false
        }])
    
        console.log("Commands:")
        let commandLines = [];
        for(let command of Command.allCommands) {
            let key = `${command.name} [options]`;
            for(let arg of command.arguments) {
                key = `${key} ${arg.required ? `<${arg.name}>` : `[${arg.name}]`}`
            }
    
            commandLines.push({
                command: key,
                description: command.description
            })
        }
        console.table(commandLines);
    }

    constructor() {
        this.name = '';
        this.description = '';
        this.arguments = [];
        this.options = [];
        this.commandAction = () => console.log("This command doesn't do anything yet!");
        Command.allCommands.push(this);
    }

    createCommand(commandString, description) {
        this.description = description;
        const commandStrings = commandString.split(" ");

        if(commandStrings?.length) {
            this.name = commandStrings[0];
            let args = [];
            for(let i=1;i < commandStrings.length;i++) {
                const arg = commandStrings[i],
                    isArray = arg.includes('...'),
                    argName = isArray ? arg.slice(1, -4) : arg.slice(1, -1);

                if(parserRegexes.argRequiredRegex.test(arg)) {
                    args.push(new Argument(argName, true, isArray ? [] : ''))
                } else if(parserRegexes.argNotReqRegex.test(arg)) {
                    args.push(new Argument(argName, false, isArray ? [] : ''))
                } else {
                    throw Error(`Argument ${arg} is not given correctly`);
                }
            }

            this.arguments = args;
        }

    }

    createArgument(argString, isOptionArg, defaultValue) {
        let arg = null;

        if(parserRegexes.argRegex.test(argString)) {
            let temp = argString.match(parserRegexes.argRegex),
                argName = temp[0].slice(1,-1),
                isArray = argName.includes('...');

            if(isArray) {
                if(!Array.isArray(defaultValue))
                    throw Error(`Give correct default for option ${argString}`);
            } else if(Array.isArray(defaultValue)) {
                throw Error(`Give correct default for option ${argString}`);
            }

            arg = new Argument(argName, temp[0][0] == '<', defaultValue ? defaultValue : 
                (isArray ? [] : false));
        }

        if(arg && !isOptionArg) {
            this.arguments.push(arg);
        }

        return arg;
    }

    createOption(optionString, description, defaultValue) {

        let shortForm = '', option = '', optionArg = '', longForm = '';

        if(parserRegexes.shortFormRegex.test(optionString)) {
            shortForm = optionString.match(parserRegexes.shortFormRegex)[0][1];
        }

        if(parserRegexes.optionRegex.test(optionString)) {
            longForm = optionString.match(parserRegexes.optionRegex)[0];
            const optionArr = longForm.slice(2).split("-");
            option = optionArr.reduce((acc, cur) => acc + (acc != '' ? capitalizeFirstLetter(cur) : cur),'')
        }

        optionArg = this.createArgument(optionString, true, defaultValue);

        this.options.push(new Option(shortForm, option, description, defaultValue, optionArg, longForm))
    }

    createAction(action) {
        this.commandAction = action; 
        // action is a fn with args: arguments of command and options 
        // object with it's values
    }

    displayCommandHelp() {
        const arg0 = process.argv0;
        let usageLine = `Usage: ${arg0} ${this.name} [options]`;

        for(let arg of this.arguments) {
            usageLine = `${usageLine} ${arg.required ? `<${arg.name}>` : `[${arg.name}]`}`
        }
        console.log(usageLine);

        console.log('');

        if(this.description.length) {
            console.log(this.description);
            console.log('');
        }

        if(this.options.length) {
            console.log("Options:");
            let optionLines = [];
            for(let option of this.options) {
                let optionName = `${option.shortForm ? `-${option.shortForm} ` : ''}${option.longForm}`;
                optionName = `${optionName}${option.argument ? ` ${option.argument.required ? `<${option.argument.name}>` : `[${option.argument.name}]`}` 
                    : ''}`
                optionLines.push({
                    'Option': optionName,
                    'Description': option.description,
                    'Default Value': option.defaultValue
                })
            }
            console.table(optionLines);
        }
    }

    parseCommand(args) {
        const commandOptionsQueue = [];
        let showCommandHelp = false;

        if(!args.length || Command.isGlobalHelpOption(args[0])) {
            Command.displayGlobalHelp();
            return {
                argValues: [],
                optionValues: {}
            };
        }

        let argIndex = 0;
        for(let arg of args) {
            arg = arg.replace('"', '');
            if(parserRegexes.shortFormRegex.test(arg)) {
                const shortForm = arg.match(parserRegexes.shortFormRegex)[0].slice(1);
                let commandOption = null;

                for(let option of shortForm.split('')) {
                    commandOption = this.options.find(doc => doc.shortForm == option);

                    if(commandOption) {
                        commandOptionsQueue.push({
                            ...commandOption,
                            type: 'option'
                        })
                    } else if(Command.globalHelpOption.shortForm == option) {
                        showCommandHelp = true;
                        break;
                    } else {
                        throw Error('Enter valid shortform for option. Use -h or --help to know more about options.');
                    }
                }

                argIndex = 0;
            } else if(parserRegexes.optionRegex.test(arg)) {
                const longForm = arg.match(parserRegexes.optionRegex)[0].slice(2),
                    commandOption = this.options.find(doc => doc.name == longForm);

                if(commandOption) {
                    commandOptionsQueue.push({
                        ...commandOption,
                        type: 'option'
                    })
                } else if(Command.globalHelpOption.name == longForm) {
                    showCommandHelp = true;
                    break;
                } else {
                    throw Error('Enter valid name for option. Use -h or --help to know more about options.');
                }

                argIndex = 0;
            } else if(arg == this.name) {
                commandOptionsQueue.push({
                    type: 'command'
                })
                argIndex = 0;
            } else {
                if(commandOptionsQueue.length) {
                    const previousCommand = commandOptionsQueue[commandOptionsQueue.length - 1];
                    if(previousCommand.type == 'command') {
                        const isValidArg = this.arguments[argIndex] && typeof this.arguments[argIndex].defaultValue == typeof arg;
                        if(!isValidArg) {
                            throw Error(`${arg} for command ${this.name} is not of correct type or is not present`);
                        }

                        commandOptionsQueue[commandOptionsQueue.length - 1] = {
                            ...previousCommand,
                            argValues: previousCommand.argValues ? {...previousCommand.argValues, 
                                [this.arguments[argIndex].name]: arg
                            } : {
                                [this.arguments[argIndex].name] : arg
                            }
                        }

                        argIndex++;
                    } else if(previousCommand.type == 'option') {
                        if(Array.isArray(previousCommand.argument.defaultValue)) {
                            commandOptionsQueue[commandOptionsQueue.length - 1] = {
                                ...previousCommand,
                                argValues: previousCommand.argValues ? {
                                    [previousCommand.argument.name]: [
                                        ...previousCommand.argValues[previousCommand.argument.name], 
                                        arg
                                    ]
                                } : {
                                    [previousCommand.argument.name]: [arg]
                                }
                            }
                        } else {
                            commandOptionsQueue[commandOptionsQueue.length - 1] = {
                                ...previousCommand,
                                argValues: {
                                    [previousCommand.argument.name]: arg
                                }
                            }
                        }
                        
                    }
                }
                // throw Error("Given command doesn't have any relevant option. Use -h or --help to know about options.");
            }
        }

        // console.log(commandOptionsQueue);

        if(showCommandHelp) {
            this.displayCommandHelp();
            return {
                argValues: [],
                optionValues: {}
            };
        }

        const isValidCommand = commandOptionsQueue.some(doc => doc.type == 'command');
        if(isValidCommand) {
            const commandData = commandOptionsQueue.find(doc => doc.type == 'command'),
                optionsData = commandOptionsQueue.filter(doc => doc.type == 'option');

            let argValues = [], argValuesOfCommand = commandData.argValues;
            if(argValuesOfCommand) {
                for(let argument of this.arguments) {
                    if(argument.required && !argValuesOfCommand[argument.name]) 
                        throw Error(`${argument.name} is required and not provided`);

                    argValues.push(argValuesOfCommand[argument.name])
                }
            } else {
                const requiredArgs = this.arguments.filter(doc => doc.required);
                if(requiredArgs.length)
                    throw Error(`${this.name} require${requiredArgs.reduce((acc, cur) => acc + ' ' + cur.name), ''} arguments!`);
                
                argValues = this.arguments.map(doc => doc.defaultValue); 
            }

            let optionValues = {};
            for(let option of this.options) {
                const optionData = optionsData.find(doc => doc.name == option.name);

                if(option.argument) {
                    const argument = option.argument;
                    if(optionData && optionData.argValues && optionData.argValues[argument.name]) {
                        optionValues[option.name] = optionData.argValues[argument.name];
                    } else if(!argument.required) {
                        optionValues[option.name] = argument.defaultValue;
                    } else {
                        throw Error(`${argument.name} is required for option ${option.name}`);
                    }
                } else {
                    optionValues[option.name] = optionData ? true  : option.defaultValue;
                }
            }

            return { argValues, optionValues };
        } else {
            throw Error("Enter a valid command name.Use -h or --help to know more about command.");
        }
    }

    parse() {
        try {
            const args = process.argv.slice(2);
            const { argValues, optionValues } = this.parseCommand(args);
            if(argValues.length && Object.keys(optionValues).length) {
                this.commandAction(...argValues, optionValues);
            }
        } catch(error) {
            throw error;
        }
    }

    async parseAsync() {
        try {
            const args = process.argv.slice(2);
            const { argValues, optionValues } = this.parseCommand(args);
            if(argValues.length && Object.keys(optionValues).length) {
                await this.commandAction(...argValues, optionValues);
            }
            

        } catch(error) {
            throw error;
        }
    }
}