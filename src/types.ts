export interface SystemAsset {
  id: string;
  name: string;
  type: 'Frontend' | 'Backend API' | 'Database Table' | 'Worker' | 'Microservice' | 'Third-Party API';
  status: 'Audited' | 'Vulnerable' | 'Remediated' | 'Unverified';
  path: string;
  loc: number;
  coverage: number;
  dependencies: string[];
}

export interface SecurityFinding {
  id: string;
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  category: 'OWASP' | 'OWASP API' | 'ASVS' | 'NIST' | 'ISO27001' | 'SOC2';
  description: string;
  remediation: string;
  status: 'Open' | 'Mitigated' | 'Resolved';
  impactCode: string;
}

export interface DatabaseMetadata {
  tableName: string;
  rowCount: number;
  hasRLS: boolean;
  indexesCount: number;
  orphaned: boolean;
  foreignKeys: { column: string; referencesTable: string; referencesColumn: string; cascade: boolean }[];
  columns: { name: string; type: string; nullable: boolean; sensitive: boolean }[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  component: string;
  action: string;
  user: string;
  severity: 'Info' | 'Warning' | 'Critical';
  hash: string;
}

export interface BlockchainBlock {
  index: number;
  timestamp: string;
  transactions: {
    type: 'Identity' | 'Credential' | 'Audit' | 'Evidence';
    detail: string;
    actor: string;
  }[];
  previousHash: string;
  hash: string;
  nonce: number;
}
