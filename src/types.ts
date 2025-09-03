export type ProviderName = 'ngrok' | 'localhost.run';

export interface NgrokTunnelConfig {
  command?: string;
  region?: 'us' | 'eu' | 'ap' | 'au' | 'sa' | 'jp' | 'in';
  subdomain?: string;
  auth?: string;
}

export interface TunnelConfig {
  name: string; // A unique name for the tunnel
  provider: ProviderName;
  port?: number;
  ngrok?: NgrokTunnelConfig;
}

export interface AutoWebhookConfig {
  tunnels: TunnelConfig[];
  port?: number; // Default port for all tunnels if not specified individually
  expanded?: boolean;
  healthCheck?: {
    enabled: boolean;
    interval: number;
    timeout: number;
    maxFailures: number;
  };
  onError?: (error: Error) => void; // For global errors
}

export interface TunnelInfo {
  name: string;
  uri: string;
  public_url: string;
  proto: string;
  config: {
    addr: string;
    inspect: boolean;
  };
  metrics: {
    conns: {
      count: number;
      gauge: number;
      rate1: number;
      rate5: number;
      rate15: number;
      p50: number;
      p90: number;
      p95: number;
      p99: number;
    };
    http: {
      count: number;
      rate1: number;
      rate5: number;
      rate15: number;
      p50: number;
      p90: number;
      p95: number;
      p99: number;
    };
  };
}

export interface NgrokApiResponse {
  tunnels: TunnelInfo[];
  uri: string;
}

export interface HealthStatus {
  isHealthy: boolean;
  failureCount: number;
  lastSuccessfulCheck: number;
  timeSinceLastSuccess: number;
}
