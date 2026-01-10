export interface RequestResult {
    status: number
    latencyMs: number
    contentType?: string
    headers: Record<string, string>
}

export type CFDecision =
  | 'OK'
  | 'SLOW_DOWN'
  | 'BACKOFF'
  | 'BLOCKED'

export class MetricsAnalyse { 
  latencies: number[] = []
  private rate = 1;           // req/s initial
  private readonly min = 0.3;
  private readonly max = 3;

  record(latency: number) {
    this.latencies.push(latency)
    if (this.latencies.length > 50) {
      this.latencies.shift()
    }
  }

  avgLatency(): number {
    return this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length
  }

  analyze(res: RequestResult): CFDecision {
    if (res.status === 429) return 'BACKOFF'
    if (res.status === 403) return 'BLOCKED'

    if (
      res.contentType?.includes('text/html') &&
      res.headers['cf-ray']
    ) {
      return 'BACKOFF'
    }

    if (res.latencyMs > 3000) {
      return 'SLOW_DOWN'
    }

    return 'OK'
  }

  getDelayMs(): number {
    const base = 1000 / this.rate;
    const jitter = base * (0.2 + Math.random() * 0.4);
    return base + jitter;
  }

  speedUp() {
    this.rate = Math.min(this.max, this.rate * 1.1);
  }

  slowDown() {
    this.rate = Math.max(this.min, this.rate * 0.5);
  }

  reset() {
    this.rate = 1;
  }
}
