abstract class Value {
  charCode(): number {
    throw new Error('not character value');
  }

  abstract app(machine: Machine, arg: Value): Machine;
}

class Fn extends Value {
  private code: Instruction[];
  private env: Value[];
  constructor(code: Instruction[], env: Value[]) {
    super();
    this.code = code;
    this.env = env;
  }

  app(machine: Machine, arg: Value): Machine {
    const newCode = this.code;
    const newEnv = this.env;
    newEnv.push(arg);
    const newDump = machine.dump.slice();
    newDump.push(new Dump(machine.code.slice(), machine.environment.slice()));
    return new Machine(newCode, newEnv, newDump);
  }
}

class Char extends Value {
  private static churchTrue = 
    new Fn([new Abstraction(1, [new Application(3, 2)])], [new Fn([], [])]);
  private static churchFalse = new Fn([new Abstraction(1, [])], []);
  private code: number;
  constructor(code: number) {
    super();
    this.code = code;
  }

  charCode(): number {
    return this.code;
  }

  app(machine: Machine, arg: Value): Machine {
    const compRes =
      (arg instanceof Char && this.code == arg.charCode())
      ? Char.churchTrue : Char.churchFalse;
    const newCode = machine.code.slice();
    const newEnv = machine.environment.slice();
    newEnv.push(compRes);
    const newDump = machine.dump.slice();
    return new Machine(newCode, newEnv, newDump);
  }
}

class Out extends Value {
  app(machine: Machine, arg: Value): Machine {
    Settings.getInstance().stdOut(String.fromCharCode(arg.charCode()));
    const newCode = machine.code.slice();
    const newEnv = machine.environment.slice();
    newEnv.push(arg);
    const newDump = machine.dump.slice();
    return new Machine(newCode, newEnv, newDump);
  }
}

class In extends Value {
  app(machine: Machine, arg: Value): Machine {
    const settings = Settings.getInstance();
    const newCode = machine.code.slice();
    const newEnv = machine.environment.slice();
    const newDump = machine.dump.slice();
    if (settings.stdInStr.length == 0) {
      newEnv.push(arg);
    } else {
      newEnv.push(new Char(settings.stdInStr.charCodeAt(0)));
      settings.stdInStr = settings.stdInStr.substring(1);
    }
    return new Machine(newCode, newEnv, newDump);
  }
}

class Succ extends Value {
  app(machine: Machine, arg: Value): Machine {
    const newCode = machine.code.slice();
    const newEnv = machine.environment.slice();
    newEnv.push(new Char((arg.charCode() + 1) % 256));
    const newDump = machine.dump.slice();
    return new Machine(newCode, newEnv, newDump);
  }
}
