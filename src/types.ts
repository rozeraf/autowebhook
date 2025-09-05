export type ProviderName = 'ngrok' | 'localhost.run';

export interface NgrokTunnelConfig {
  /**
   * A raw command to execute for ngrok. Overrides other settings.
   * @example 'http --region=eu 8080'
   */
  command?: string;
  /**
   * The protocol to use for the tunnel. Can be 'http', 'tcp', or 'tls'.
   * @default 'http'
   */
  proto?: 'http' | 'tcp' | 'tls';
  /**
   * The region to use for the tunnel.
   */
  region?: 'us' | 'eu' | 'ap' | 'au' | 'sa' | 'jp' | 'in';
  /**
   * A custom subdomain for the tunnel (requires a paid ngrok plan).
   */
  subdomain?: string;
  /**
   * A custom hostname for the tunnel (requires a paid ngrok plan).
   */
  hostname?: string;
  /**
   * The authentication token for your ngrok account.
   */
  auth?: string;
  /**
   * Protect the tunnel with a username and password.
   * @example 'user:password'
   */
  basic_auth?: string;
  /**
   * A list of CIDR blocks to allow access to the tunnel.
   * @example ['23.20.3.17/32']
   */
  allow_cidr?: string | string[];
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
