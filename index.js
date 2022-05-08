#!/usr/bin/env node

import { program } from 'commander';
import {createComponent} from "./commands/createComponent.js";

async function main() {
    program.command('component <component_name>')
    .option('-f --functional', 'Functional Component', false)
    .option('-c --class', 'Class Component', false)
    .option('-t --type [type]', `Component is 'typescript' one or 'javascript' one`, 'typescript')
    .option('-r, --redux-connect', 'Add redux connect option', false)
    .option('--cssext [cssExt]', `CSS Extension of the component's css file`, 'css')
    .option('--force', 'Force remove and replace the component file if it exists already', false)
    .description("Creates a react component with given name and options.")
    .action(createComponent);


    await program.parseAsync();
}

await main();