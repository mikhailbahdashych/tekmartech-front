import { IntegrationType } from '@features/integrations/models';

export interface IntegrationTypeConfig {
  label: string;
  description: string;
  accentClass: string;
  accentBgClass: string;
  tools: string[];
}

export const INTEGRATION_TYPE_CONFIG: Record<IntegrationType, IntegrationTypeConfig> = {
  aws: {
    label: 'AWS',
    description: 'Amazon Web Services — IAM users, roles, CloudTrail events, S3 buckets, EC2 security groups.',
    accentClass: 'text-amber-700',
    accentBgClass: 'bg-amber-50',
    tools: [
      'IAM Users & Roles',
      'Account Summary',
      'CloudTrail Events',
      'S3 Buckets & Security',
      'EC2 Security Groups',
    ],
  },
  github: {
    label: 'GitHub',
    description: 'GitHub Organization — members, repositories, branch protection, pull requests, collaborators.',
    accentClass: 'text-slate-800',
    accentBgClass: 'bg-slate-100',
    tools: [
      'Organization Members',
      'Repositories',
      'Branch Protection Rules',
      'Pull Requests',
      'Repository Collaborators',
    ],
  },
  google_workspace: {
    label: 'Google Workspace',
    description: 'Google Workspace — directory users, MFA status, OAuth tokens, login activity events.',
    accentClass: 'text-blue-700',
    accentBgClass: 'bg-blue-50',
    tools: [
      'Directory Users',
      'MFA Status',
      'OAuth Tokens',
      'Login Events',
    ],
  },
};

export const AWS_REGIONS = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-east-2', label: 'US East (Ohio)' },
  { value: 'us-west-1', label: 'US West (N. California)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'EU (Ireland)' },
  { value: 'eu-west-2', label: 'EU (London)' },
  { value: 'eu-central-1', label: 'EU (Frankfurt)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
  { value: 'ca-central-1', label: 'Canada (Central)' },
  { value: 'sa-east-1', label: 'South America (São Paulo)' },
];
