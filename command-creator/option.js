export class Option {

    constructor(shortForm, option, description, defaultValue, arg = null, longForm) {
        this.shortForm = shortForm;
        this.description = description;
        this.defaultValue = defaultValue;
        this.argument = arg;
        this.name = option;
        this.longForm = longForm;
    }
}