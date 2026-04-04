interface ToolInfo {
  displayName: string;
  verb: string;
}

const TOOL_MAP: Record<string, ToolInfo> = {
  'github.list_organization_members': { displayName: 'Organization Members', verb: 'Listing members' },
  'github.list_repositories': { displayName: 'Repositories', verb: 'Listing repositories' },
  'github.get_branch_protection': { displayName: 'Branch Protection', verb: 'Checking branch protection' },
  'github.list_pull_requests': { displayName: 'Pull Requests', verb: 'Listing pull requests' },
  'github.list_repository_collaborators': { displayName: 'Collaborators', verb: 'Listing collaborators' },
  'aws.iam_list_users': { displayName: 'IAM Users', verb: 'Listing IAM users' },
  'aws.iam_list_roles': { displayName: 'IAM Roles', verb: 'Listing IAM roles' },
  'aws.iam_get_account_summary': { displayName: 'Account Summary', verb: 'Getting account summary' },
  'aws.cloudtrail_lookup_events': { displayName: 'CloudTrail Events', verb: 'Searching events' },
  'aws.s3_list_buckets': { displayName: 'S3 Buckets', verb: 'Listing buckets' },
  'aws.s3_get_bucket_security': { displayName: 'Bucket Security', verb: 'Checking bucket security' },
  'aws.ec2_describe_security_groups': { displayName: 'Security Groups', verb: 'Describing security groups' },
  'google_workspace.list_users': { displayName: 'Workspace Users', verb: 'Listing users' },
  'google_workspace.get_user_mfa_status': { displayName: 'MFA Status', verb: 'Checking MFA status' },
  'google_workspace.list_user_tokens': { displayName: 'OAuth Tokens', verb: 'Listing tokens' },
  'google_workspace.list_login_events': { displayName: 'Login Events', verb: 'Searching login events' },
};

export function getToolDisplayName(toolName: string): string {
  const info = TOOL_MAP[toolName];
  if (info) return info.displayName;

  // Fallback: split on '.', take after dot, replace underscores, title-case
  const parts = toolName.split('.');
  const name = parts.length > 1 ? parts[1] : parts[0];
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function getToolVerb(toolName: string): string {
  return TOOL_MAP[toolName]?.verb ?? getToolDisplayName(toolName);
}

export function getIntegrationTypeFromToolName(toolName: string): string | null {
  const prefix = toolName.split('.')[0];
  if (prefix === 'github') return 'github';
  if (prefix === 'aws') return 'aws';
  if (prefix === 'google_workspace') return 'google_workspace';
  return null;
}
