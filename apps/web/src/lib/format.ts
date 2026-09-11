import { BOARD_GROUPS, PIPELINE_STATUS } from '../constants.js';

export function statusColor(status: string): string {
  const group = PIPELINE_STATUS[status]?.group;
  return BOARD_GROUPS.find((g) => g.key === group)?.color ?? 'var(--st-new)';
}

export function statusLabel(status: string): string {
  return PIPELINE_STATUS[status]?.label ?? status;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ownerDisplayName(owner: { company: boolean; companyName: string; firstName: string; lastName: string } | null | undefined): string {
  if (!owner) return 'Unassigned';
  if (owner.company) return owner.companyName || 'Unnamed company';
  const name = `${owner.firstName} ${owner.lastName}`.trim();
  return name || 'Unnamed owner';
}
