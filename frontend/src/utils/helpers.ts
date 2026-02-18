import type { LeadStatus } from '../types/lead';
import type { BugStatus, BugPriority } from '../types/bug';

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(dateStr));
}

export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  New:         'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Contacted:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  Interested:  'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  Negotiation: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  Won:         'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  Lost:        'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

export const BUG_STATUS_COLORS: Record<BugStatus, string> = {
  open:        'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  resolved:    'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  closed:      'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
};

export const BUG_PRIORITY_COLORS: Record<BugPriority, string> = {
  low:      'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  medium:   'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  high:     'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};
