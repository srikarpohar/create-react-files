#!/usr/bin/env node

import {createComponent} from "./commands/createComponent.js";
import { Command } from './command-creator/command.js';

async function main() {

    const command = new Command();
    command.createCommand('component <component_name>', "Creates a react component with given name and options.");
    command.createOption('-f --functional', 'Functional Component', false);
    command.createOption('-c --class', 'Class Component', false);
    command.createOption('-t --type [type]', `Component is 'typescript' one or 'javascript' one`, 'typescript');
    command.createOption('-r, --redux-connect', 'Add redux connect option', false);
    command.createOption('--cssext [cssExt]', `CSS Extension of the component's css file`, 'css');
    command.createOption('--force', 'Force remove and replace the component file if it exists already', false);

    command.createAction(createComponent);
    await command.parseAsync();
}

main();