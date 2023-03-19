class Machine {
  constructor(readonly code: Instruction[],
              readonly environment: Value[],
              readonly dump: Dump[]) {}
}
