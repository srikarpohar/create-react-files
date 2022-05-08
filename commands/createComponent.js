import chalk from 'chalk';
import path from "path";
import { rmdir, mkdir, writeFile } from "fs/promises";
import { access } from "fs";

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function createFunctionLines(functionLines, insideClass) {
    let func = insideClass ? '\t' : '';
    for(let lineIndex in functionLines) {
        const line = functionLines[lineIndex];
        if(lineIndex == 0) {
            func += `${line}\n`;
        } else if(lineIndex == functionLines.length - 1) {
            func += `${insideClass ? '\t' : ''}${line}\n`;
        } else {
            func += `\t${insideClass ? '\t' : ''}${line}\n`;
        }
    }

    return func;
}

function createJSComponent(options, componentName) {
    let importLines = [], fileContents = '';

    if(options.functional) {
        const functionLines = ['const [state, setState] = useState({});', 
            'return (<div></div>);'];
        importLines.push('import { useState } from "react";');

        fileContents = `${importLines.join('\n')}\n\nexport const ${componentName} = (props) => {\n\t${functionLines.join('\n\n\t')}\n}`;
    } else {
        importLines.push('import { Component } from "react";');
        let reduxLines = ['const mapStateToProps = (state, ownProps) => {', 'return {};', '}', 
            'const mapDispatchToProps = (dispatch) => {', 'return {};', '}'],
            componentDidUpdateLines = ['componentDidMount(props){', 'super(props);', 'this.state = {};', '}'],
            renderMethodLines = ['render(){', 'return (<div></div>);', '}'],
            reduxFileData = '';

        if(options.reduxConnect) {
            importLines.push('import { connect } from "react-redux";');
            reduxFileData = `\n${createFunctionLines(reduxLines.slice(0,3), false)}\n${createFunctionLines(reduxLines.slice(3, 6), false)}\nexport default connect(mapStateToProps, mapDispatchToProps)(${componentName});`
        }

        fileContents = `${importLines.join('\n')}\n\n${options.reduxConnect ? 'class' : 'export class'} ${componentName} extends Component{\n${createFunctionLines(componentDidUpdateLines, true)}\n${createFunctionLines(renderMethodLines, true)}}\n${reduxFileData}`;
    }

    return fileContents;
}

function createTSComponent(options, componentName) {
    let importLines = [], fileContents = '';

    if(options.functional) {
        const functionLines = ['const [state, setState] = useState<IState>({});', 
            'return (<div></div>);'];
        importLines.push('import { useState } from "react";');

        fileContents = `${importLines.join('\n')}\ninterface IProps{\n\n}\ninterface IState{\n\n}\nexport const ${componentName} = (props: IProps) => {\n\t${functionLines.join('\n\n\t')}\n}`;
    } else {
        importLines.push('import { Component } from "react";');
        let reduxLines = ['const mapStateToProps = (state: any, ownProps: any) => {', 'return {};', '}', 
            'const mapDispatchToProps = (dispatch: any) => {', 'return {};', '}'],
            componentDidUpdateLines = ['componentDidMount(props: IProps){', 'super(props);', 'this.state = {};', '}'],
            renderMethodLines = ['render(){', 'return (<div></div>);', '}'],
            reduxFileData = '';

        if(options.reduxConnect) {
            importLines.push('import { connect } from "react-redux";');
            reduxFileData = `\n${createFunctionLines(reduxLines.slice(0,3), false)}\n${createFunctionLines(reduxLines.slice(3, 6), false)}\nexport default connect(mapStateToProps, mapDispatchToProps)(${componentName});`
        }

        fileContents = `${importLines.join('\n')}\n\n${options.reduxConnect ? 'class' : 'export class'} ${componentName} extends Component{\n\n${createFunctionLines(componentDidUpdateLines, true)}\n${createFunctionLines(renderMethodLines, true)}}\n${reduxFileData}}`
    }

    return fileContents;
}

export async function createComponent(component_name, options) {
    try {
        if(!options.functional && !options.class) {
            console.log(chalk.red.bold("Provide -f or -c for component to be functional or class"));
        } else {
            let currentWorkingDirectory = path.normalize(process.cwd());
            const componentNameArr = component_name.split("-"),
                finalComponentName = componentNameArr.map(doc => capitalizeFirstLetter(doc)).join(""),
                finalComponentPath = `${currentWorkingDirectory}/${component_name}`;
            
            access(finalComponentPath, async (err) => {
                if(!err) {
                    if(options.force) {
                        await rmdir(finalComponentPath, { recursive: true });
                    } else {
                        console.log(chalk.red.bold("Component already exists. Use --force to replace the component"));
                        return;
                    }
                }

                await mkdir(finalComponentPath)
                currentWorkingDirectory = `${currentWorkingDirectory}/${component_name}`;

                let fileContents = '';
                if(options.type == 'typescript') {
                    fileContents = createTSComponent(options, finalComponentName);
                    await writeFile(`${currentWorkingDirectory}/${component_name}.tsx`, fileContents);
                } else {
                    fileContents = createJSComponent(options, finalComponentName);
                    await writeFile(`${currentWorkingDirectory}/${component_name}.jsx`, fileContents);
                }

                await writeFile(`${currentWorkingDirectory}/${component_name}.${options.cssext}`, '');
            });
        }
    } catch(error) {
        throw error;
    }
    
}