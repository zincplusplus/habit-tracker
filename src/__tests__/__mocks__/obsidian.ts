export class Modal {
  constructor(_app: unknown) {}
  onOpen() {}
  onClose() {}
  close() {}
}

export class Plugin {}

export class TFile {
  constructor(public path: string, public basename: string = path) {}
}

export class TFolder {
  constructor(public path: string, public children: TFile[] = []) {}
}

export class Notice {
  constructor(_message: string) {}
}

export function parseYaml(_yaml: string): unknown {
  return {}
}
