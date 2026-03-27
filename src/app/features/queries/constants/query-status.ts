import { QueryStatus } from '../models';

export const QUERY_STATUS = {
  INTERPRETING: 'interpreting',
  AWAITING_APPROVAL: 'awaiting_approval',
  APPROVED: 'approved',
  EXECUTING: 'executing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REJECTED: 'rejected',
} as const;

export interface StatusConfig {
  label: string;
  colorClass: string;
  bgClass: string;
}

export const QUERY_STATUS_CONFIG: Record<QueryStatus, StatusConfig> = {
  interpreting:      { label: 'Interpreting',      colorClass: 'text-blue-700',    bgClass: 'bg-blue-50' },
  awaiting_approval: { label: 'Awaiting Approval', colorClass: 'text-amber-700',   bgClass: 'bg-amber-50' },
  approved:          { label: 'Approved',           colorClass: 'text-indigo-700',  bgClass: 'bg-indigo-50' },
  executing:         { label: 'Executing',          colorClass: 'text-blue-700',    bgClass: 'bg-blue-50' },
  completed:         { label: 'Completed',          colorClass: 'text-emerald-700', bgClass: 'bg-emerald-50' },
  failed:            { label: 'Failed',             colorClass: 'text-red-700',     bgClass: 'bg-red-50' },
  rejected:          { label: 'Rejected',           colorClass: 'text-slate-600',   bgClass: 'bg-slate-100' },
};

export const QUERY_STATUS_OPTIONS: { value: QueryStatus; label: string }[] = [
  { value: 'interpreting', label: 'Interpreting' },
  { value: 'awaiting_approval', label: 'Awaiting Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'executing', label: 'Executing' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'rejected', label: 'Rejected' },
];
