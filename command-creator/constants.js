const parserRegexes = {
    argRequiredRegex : new RegExp(/<[a-zA-Z_.]+>/, 'g'),
    argNotReqRegex : new RegExp(/\[[a-zA-Z_.]+\]/, 'g'),
    argRegex : new RegExp(/[<|[][a-zA-Z.]+[>\]]/, 'g'),
    shortFormRegex : new RegExp(/^-[a-zA-Z]+/, 'g'),
    optionRegex : new RegExp(/--[a-zA-Z]+-?[a-zA-Z]+/, 'g')
}

export default parserRegexes;