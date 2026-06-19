// [looknbook] Customer history & loyalty — shared types for the customers feature.

/**
 * One flattened (booking × attendee) record returned by the repository.
 * Dates are kept as `Date` internally; they are serialized to ISO strings at the DTO boundary.
 */
export type CustomerBookingRecordDto = {
  bookingId: number;
  startTime: Date;
  attendeeName: string;
  /** Raw attendee email; may be a synthetic `<phone>@sms.cal.com` address for phone-only bookings. */
  attendeeEmail: string;
  attendeePhone: string | null;
  attendeeNoShow: boolean;
  eventType: { id: number; title: string; slug: string } | null;
};

export type LoyaltyStatus = "new" | "regular" | "loyal" | "at_risk" | "occasional";

export type DataQualityFlag =
  | "SPLIT_IDENTITY"
  | "MULTIPLE_PHONES_SAME_EMAIL"
  | "MULTIPLE_EMAILS_SAME_PHONE"
  | "LOW_QUALITY_PHONE";

export type CustomerKeyType = "phone" | "email";

export type CustomerDto = {
  /** Stable grouping key (normalized E.164 phone, or lowercased email). */
  id: string;
  keyType: CustomerKeyType;
  displayName: string;
  /** E.164 phone, or null. */
  phoneNumber: string | null;
  /** Real email, or null when the only email was synthetic (`@sms.cal.com`). */
  email: string | null;
  visitCount: number;
  firstVisitAt: string; // ISO
  lastVisitAt: string; // ISO
  daysSinceLastVisit: number;
  avgDaysBetweenVisits: number | null;
  eventTypes: { id: number; title: string; slug: string }[];
  loyaltyStatus: LoyaltyStatus;
  dataQualityFlags: DataQualityFlag[];
  possibleDuplicateKeys: string[];
};

export type CustomerStats = {
  totalCustomers: number;
  returning: number;
  newThisMonth: number;
  atRisk: number;
};

export type ListCustomersResult = {
  customers: CustomerDto[];
  stats: CustomerStats;
  total: number;
  hasMore: boolean;
};

export type CustomerListFilter = "all" | "loyal" | "recent" | "at_risk";
export type CustomerSortBy = "visits" | "lastVisit" | "name";
