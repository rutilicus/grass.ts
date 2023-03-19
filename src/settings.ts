class Settings {
  private static instance: Settings;
  public stdInStr: string;
  public stdOut: (outstr: string) => any
  private constructor() {
    this.stdInStr = "";
    this.stdOut = () => {};
  }
  static getInstance(): Settings {
    if (!Settings.instance) {
      Settings.instance = new Settings();
    }
    return Settings.instance;
  }
}
