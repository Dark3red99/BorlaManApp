import type { RequestStatus } from '../types/models';

// Shared status chip styling + copy for request lists and tracking.

export type StatusMeta = {
  label: string;
  color: string;
  colorSoft: string;
};

export const REQUEST_STATUS_META: Record<RequestStatus, StatusMeta> = {
  pending: { label: 'Finding collector', color: '#D97706', colorSoft: '#FEF3C7' },
  matched: { label: 'Collector assigned', color: '#2563EB', colorSoft: '#DBEAFE' },
  'en-route': { label: 'On the way', color: '#2563EB', colorSoft: '#DBEAFE' },
  arrived: { label: 'Arrived', color: '#059669', colorSoft: '#D1FAE5' },
  collecting: { label: 'Collecting', color: '#059669', colorSoft: '#D1FAE5' },
  completed: { label: 'Completed', color: '#16A34A', colorSoft: '#DCFCE7' },
  cancelled: { label: 'Cancelled', color: '#DC2626', colorSoft: '#FEE2E2' },
};
