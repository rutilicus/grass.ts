abstract class Instruction {
  abstract eval(machine: Machine): Machine;
}

class Application extends Instruction {
  private functionIndex: number;
  private argumentIndex: number;
  constructor(functionIndex: number, argumentIndex: number) {
    super();
    this.functionIndex = functionIndex;
    this.argumentIndex = argumentIndex;
  }

  eval(machine: Machine): Machine {
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
  private arity: number;
  private applications: Application[];
  constructor(arity: number, applications: Application[]) {
    super();
    this.arity = arity;
    this.applications = applications;
  }

  eval(machine: Machine): Machine {
    const newDump = machine.dump.slice();
    const newEnv = machine.environment.slice();
    const newCode = machine.code.slice();
    if (this.arity == 1) {
      newEnv.push(new Fn(this.applications.slice(),
                  machine.environment.slice()));
    } else {
      newEnv.push(
        new Fn([new Abstraction(this.arity - 1, this.applications.slice())],
               machine.environment.slice()));
    }
    return new Machine(newCode, newEnv, newDump);
  }
}
