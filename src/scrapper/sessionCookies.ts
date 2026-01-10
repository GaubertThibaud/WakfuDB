export type CookieMap = Map<string, string>

export class SessionCookies {
  private cookies: CookieMap

  constructor(initial?: CookieMap | Record<string, string>) {
    if (initial instanceof Map) {
      this.cookies = new Map(initial)
    } else if (initial) {
      this.cookies = new Map(Object.entries(initial))
    } else {
      this.cookies = new Map()
    }
  }

  /** Ajoute ou remplace un cookie */
  set(name: string, value: string): void {
    this.cookies.set(name, value)
  }

  /** Récupère un cookie */
  get(name: string): string | undefined {
    return this.cookies.get(name)
  }

  /** Supprime un cookie */
  delete(name: string): void {
    this.cookies.delete(name)
  }

  /** Vide complètement la session */
  clear(): void {
    this.cookies.clear()
  }

  /** Génère le header Cookie */
  toHeader(): string {
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join("; ")
  }

  /** Parse un Set-Cookie depuis une réponse HTTP */
  ingestSetCookie(setCookieHeaders: string[] | null | undefined): void {
    if (!setCookieHeaders) return

    for (const header of setCookieHeaders) {
      const [pair] = header.split(";")
      const eqIndex = pair.indexOf("=")
      if (eqIndex === -1) continue

      const name = pair.slice(0, eqIndex).trim()
      const value = pair.slice(eqIndex + 1).trim()

      if (name && value) {
        this.cookies.set(name, value)
      }
    }
  }

  /** Clone profond (utile si Cloudflare te nuke une session) */
  clone(): SessionCookies {
    return new SessionCookies(new Map(this.cookies))
  }

  /** Debug */
  dump(): Record<string, string> {
    return Object.fromEntries(this.cookies.entries())
  }
}