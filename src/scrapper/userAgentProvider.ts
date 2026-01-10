export class UserAgentProvider {
  private userAgents: string[]
  private index: number

  constructor(initial?: string[]) {
    // Pool par défaut réaliste pour desktop / Chrome / Opera
    this.userAgents = initial ?? [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.5845.96 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.92 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:119.0) Gecko/20100101 Firefox/119.0",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.5845.188 Safari/537.36"
    ]
    this.index = 0
  }

  /** Retourne un UA fixe (le suivant dans la liste) */
  next(): string {
    const ua = this.userAgents[this.index]
    this.index = (this.index + 1) % this.userAgents.length
    return ua
  }

  /** Retourne un UA aléatoire dans le pool */
  random(): string {
    const i = Math.floor(Math.random() * this.userAgents.length)
    return this.userAgents[i]
  }

  /** Ajoute un UA au pool */
  add(userAgent: string): void {
    if (!this.userAgents.includes(userAgent)) {
      this.userAgents.push(userAgent)
    }
  }

  /** Remplace complètement le pool */
  setAll(userAgents: string[]): void {
    this.userAgents = [...userAgents]
    this.index = 0
  }
}
