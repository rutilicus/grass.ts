class Parser {
  public static parse(program: string): Instruction[] {
    let code: Instruction[] = [];
    
    const programStr = 
      program.replace(/[^wWvｗＷｖ]/g, "")
             .replace(/^[^wｗ]*/,"")
             .replace(/[ｗＷｖ]/g, function(s) {
      return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
    programStr.split('v').forEach((instructionStr) => {
      let tokens = instructionStr.match(/(w+)|(W+)/g);
      if (tokens == null) {
        throw new Error('parse error. (empty string token)');
      } else {
        let arity = 0;

        if (/w+/.test(tokens[0])) {
          arity = tokens[0].length;
          tokens.splice(0, 1);
        }
        if (tokens.length % 2 != 0) {
          throw new Error('parse error. (instruction not terminated by "w")');
        }

        let apps: Application[] = [];

        for (let i = 0; i < tokens.length; i += 2) {
          apps.push(new Application(tokens[i].length, tokens[i + 1].length));
        }
        if (arity == 0) {
          code.push(...apps);
        } else {
          code.push(new Abstraction(arity, apps));
        }
      }
    });

    return code;
  }
}
