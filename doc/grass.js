"use strict";
class Dump {
    constructor(code, environment) {
        this.code = code;
        this.environment = environment;
    }
}
class Grass {
    static eval(machine) {
        /* 末尾再帰が環境依存のようなのでループで書く */
        let currentState = machine;
        while (true) {
            if (currentState.code.length) {
                const code = currentState.code[0];
                currentState =
                    code.eval(new Machine(currentState.code.slice(1), currentState.environment, currentState.dump));
            }
            else {
                /* Cがempty */
                if (currentState.dump.length) {
                    if (currentState.environment.length == 0) {
                        throw Error('no return value');
                    }
                    const dumpTop = currentState.dump[currentState.dump.length - 1];
                    const ret = currentState.environment[currentState.environment.length - 1];
                    const newCode = dumpTop.code.slice();
                    const newEnv = dumpTop.environment.slice();
                    newEnv.push(ret);
                    const newDump = currentState.dump.slice(0, -1);
                    currentState = new Machine(newCode, newEnv, newDump);
                }
                else {
                    /* Dがemptyのため評価終了 */
                    break;
                }
            }
        }
        if (currentState.environment.length != 1) {
            throw Error('Invalid final machine state');
        }
    }
    static main(programStr, stdInStr, stdOut, stdErr) {
        try {
            const settings = Settings.getInstance();
            settings.stdInStr = stdInStr;
            settings.stdOut = stdOut;
            const code = Parser.parse(programStr);
            const env = [new In(), new Char("w".charCodeAt(0)), new Succ(), new Out];
            const dump = [new Dump([], []), new Dump([new Application(1, 1)], [])];
            Grass.eval(new Machine(code, env, dump));
        }
        catch (e) {
            if (e instanceof Error) {
                stdErr(e.message);
                return;
            }
        }
    }
}
class Instruction {
}
class Application extends Instruction {
    constructor(functionIndex, argumentIndex) {
        super();
        this.functionIndex = functionIndex;
        this.argumentIndex = argumentIndex;
    }
    eval(machine) {
        if (machine.environment.length < this.functionIndex
            || machine.environment.length < this.argumentIndex) {
            throw Error('application out of bound');
        }
        const f = machine.environment[machine.environment.length - this.functionIndex];
        const v = machine.environment[machine.environment.length - this.argumentIndex];
        return f.app(machine, v);
    }
}
class Abstraction extends Instruction {
    constructor(arity, applications) {
        super();
        this.arity = arity;
        this.applications = applications;
    }
    eval(machine) {
        const newDump = machine.dump.slice();
        const newEnv = machine.environment.slice();
        const newCode = machine.code.slice();
        if (this.arity == 1) {
            newEnv.push(new Fn(this.applications.slice(), machine.environment.slice()));
        }
        else {
            newEnv.push(new Fn([new Abstraction(this.arity - 1, this.applications.slice())], machine.environment.slice()));
        }
        return new Machine(newCode, newEnv, newDump);
    }
}
class Machine {
    constructor(code, environment, dump) {
        this.code = code;
        this.environment = environment;
        this.dump = dump;
    }
}
class Parser {
    static parse(program) {
        let code = [];
        const programStr = program.replace(/[^wWvｗＷｖ]/g, "")
            .replace(/^[^wｗ]*/, "")
            .replace(/[ｗＷｖ]/g, function (s) {
            return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
        });
        programStr.split('v').forEach((instructionStr) => {
            let tokens = instructionStr.match(/(w+)|(W+)/g);
            if (tokens == null) {
                throw new Error('parse error. (empty string token)');
            }
            else {
                let arity = 0;
                if (/w+/.test(tokens[0])) {
                    arity = tokens[0].length;
                    tokens.splice(0, 1);
                }
                if (tokens.length % 2 != 0) {
                    throw new Error('parse error. (instruction not terminated by "w")');
                }
                let apps = [];
                for (let i = 0; i < tokens.length; i += 2) {
                    apps.push(new Application(tokens[i].length, tokens[i + 1].length));
                }
                if (arity == 0) {
                    code.push(...apps);
                }
                else {
                    code.push(new Abstraction(arity, apps));
                }
            }
        });
        return code;
    }
}
class Settings {
    constructor() {
        this.stdInStr = "";
        this.stdOut = () => { };
    }
    static getInstance() {
        if (!Settings.instance) {
            Settings.instance = new Settings();
        }
        return Settings.instance;
    }
}
class Value {
    charCode() {
        throw new Error('not character value');
    }
}
class Fn extends Value {
    constructor(code, env) {
        super();
        this.code = code;
        this.env = env;
    }
    app(machine, arg) {
        const newCode = this.code;
        const newEnv = this.env;
        newEnv.push(arg);
        const newDump = machine.dump.slice();
        newDump.push(new Dump(machine.code.slice(), machine.environment.slice()));
        return new Machine(newCode, newEnv, newDump);
    }
}
class Char extends Value {
    constructor(code) {
        super();
        this.code = code;
    }
    charCode() {
        return this.code;
    }
    app(machine, arg) {
        const compRes = (arg instanceof Char && this.code == arg.charCode())
            ? Char.churchTrue : Char.churchFalse;
        const newCode = machine.code.slice();
        const newEnv = machine.environment.slice();
        newEnv.push(compRes);
        const newDump = machine.dump.slice();
        return new Machine(newCode, newEnv, newDump);
    }
}
Char.churchTrue = new Fn([new Abstraction(1, [new Application(3, 2)])], [new Fn([], [])]);
Char.churchFalse = new Fn([new Abstraction(1, [])], []);
class Out extends Value {
    app(machine, arg) {
        Settings.getInstance().stdOut(String.fromCharCode(arg.charCode()));
        const newCode = machine.code.slice();
        const newEnv = machine.environment.slice();
        newEnv.push(arg);
        const newDump = machine.dump.slice();
        return new Machine(newCode, newEnv, newDump);
    }
}
class In extends Value {
    app(machine, arg) {
        const settings = Settings.getInstance();
        const newCode = machine.code.slice();
        const newEnv = machine.environment.slice();
        const newDump = machine.dump.slice();
        if (settings.stdInStr.length == 0) {
            newEnv.push(arg);
        }
        else {
            newEnv.push(new Char(settings.stdInStr.charCodeAt(0)));
            settings.stdInStr = settings.stdInStr.substring(1);
        }
        return new Machine(newCode, newEnv, newDump);
    }
}
class Succ extends Value {
    app(machine, arg) {
        const newCode = machine.code.slice();
        const newEnv = machine.environment.slice();
        newEnv.push(new Char((arg.charCode() + 1) % 256));
        const newDump = machine.dump.slice();
        return new Machine(newCode, newEnv, newDump);
    }
}
