class Grass {
  private static eval(machine: Machine): void {
    /* 末尾再帰が環境依存のようなのでループで書く */
    let currentState = machine;
    while (true) {
      if (currentState.code.length) {
        const code = currentState.code[0];
        currentState = 
          code.eval(new Machine(currentState.code.slice(1),
                    currentState.environment,
                    currentState.dump));
      } else {
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
        } else {
          /* Dがemptyのため評価終了 */
          break;
        }
      }
    }
    if (currentState.environment.length != 1) {
      throw Error('Invalid final machine state');
    }
  }

  public static main(programStr: string,
                     stdInStr: string,
                     stdOut: (outstr: string) => any,
                     stdErr: (outstr: string) => any) {
    try {
      const settings = Settings.getInstance();
      settings.stdInStr = stdInStr;
      settings.stdOut = stdOut;

      const code = Parser.parse(programStr);
      const env = [new In(), new Char("w".charCodeAt(0)), new Succ(), new Out];
      const dump = [new Dump([], []), new Dump([new Application(1, 1)], [])];
      Grass.eval(new Machine(code, env, dump));
    } catch (e) {
      if (e instanceof Error) {
        stdErr(e.message);
        return;
      }
    }
  }
}
