// [looknbook] Customer aggregation orchestration. Business logic lives here (and the pure libs);
// no Prisma/tRPC knowledge. Computed fresh per request (no caching) for accuracy.
import { computeLoyalty } from "../lib/computeLoyalty";
import type { CustomerIdentity } from "../lib/detectDuplicates";
import { detectDuplicates } from "../lib/detectDuplicates";
import { getCustomerKey, normalizePhone, realEmail } from "../lib/normalizeCustomerKey";
import type { ICustomerRepository } from "../repository/CustomerRepository";
import type {
  CustomerDto,
  CustomerListFilter,
  CustomerSortBy,
  ListCustomersResult,
} from "../types";

const DAY_MS = 1000 * 60 * 60 * 24;
const NEW_THIS_MONTH_DAYS = 30; // rolling 30 days
const RECENT_FILTER_DAYS = 30; // "Recent" pill = active within last 30 days

type Accumulator = {
  key: string;
  keyType: "phone" | "email";
  lowQualityPhone: boolean;
  displayName: string;
  latestStartTime: number;
  emails: Set<string>;
  phones: Set<string>;
  visitDates: Date[];
  eventTypes: Map<number, { id: number; title: string; slug: string }>;
};

export type ListCustomersParams = {
  userId: number;
  hostEmail: string | null;
  filter?: CustomerListFilter;
  sortBy?: CustomerSortBy;
  search?: string;
  limit?: number;
  offset?: number;
};

export class CustomerAggregationService {
  constructor(private readonly customerRepository: ICustomerRepository) {}

  async list(params: ListCustomersParams): Promise<ListCustomersResult> {
    const {
      userId,
      hostEmail,
      filter = "all",
      sortBy = "visits",
      search,
      limit = 50,
      offset = 0,
    } = params;
    const now = new Date();
    const hostEmailLower = hostEmail ? hostEmail.toLowerCase() : null;

    const records = await this.customerRepository.findAttendeeVisitsByUserId(userId);

    // 1. Group records into customers (O(n)).
    const accumulators = new Map<string, Accumulator>();
    for (const record of records) {
      if (record.attendeeNoShow) continue; // no-shows are not visits

      const email = realEmail(record.attendeeEmail);
      // Exclude the host from their own customer list.
      if (hostEmailLower && email === hostEmailLower) continue;

      const resolved = getCustomerKey({ phone: record.attendeePhone, email: record.attendeeEmail });
      if (!resolved) continue; // unidentifiable attendee (no phone + only synthetic email)

      let acc = accumulators.get(resolved.key);
      if (!acc) {
        acc = {
          key: resolved.key,
          keyType: resolved.keyType,
          lowQualityPhone: resolved.lowQualityPhone,
          displayName: record.attendeeName || email || resolved.key,
          latestStartTime: 0,
          emails: new Set(),
          phones: new Set(),
          visitDates: [],
          eventTypes: new Map(),
        };
        accumulators.set(resolved.key, acc);
      }

      acc.visitDates.push(record.startTime);
      const phone = normalizePhone(record.attendeePhone);
      if (phone) acc.phones.add(phone);
      if (email) acc.emails.add(email);
      if (record.eventType) acc.eventTypes.set(record.eventType.id, record.eventType);
      // Use the most recent booking's name as the display name.
      const startMs = record.startTime.getTime();
      if (startMs >= acc.latestStartTime && record.attendeeName) {
        acc.latestStartTime = startMs;
        acc.displayName = record.attendeeName;
      }
    }

    // 2. Duplicate / identity-bridge detection across all customers.
    const identities: CustomerIdentity[] = Array.from(accumulators.values()).map((acc) => ({
      key: acc.key,
      keyType: acc.keyType,
      emails: Array.from(acc.emails),
      phones: Array.from(acc.phones),
      lowQualityPhone: acc.lowQualityPhone,
    }));
    const annotations = detectDuplicates(identities);

    // 3. Build DTOs with loyalty.
    const allCustomers: CustomerDto[] = Array.from(accumulators.values()).map((acc) => {
      const loyalty = computeLoyalty(acc.visitDates, now);
      const annotation = annotations.get(acc.key) ?? { flags: [], possibleDuplicateKeys: [] };
      const phoneNumber =
        acc.keyType === "phone" && !acc.lowQualityPhone
          ? acc.key
          : (Array.from(acc.phones)[0] ?? null);

      return {
        id: acc.key,
        keyType: acc.keyType,
        displayName: acc.displayName,
        phoneNumber,
        email: Array.from(acc.emails)[0] ?? null,
        visitCount: loyalty.visitCount,
        firstVisitAt: loyalty.firstVisitAt.toISOString(),
        lastVisitAt: loyalty.lastVisitAt.toISOString(),
        daysSinceLastVisit: Math.round(loyalty.daysSinceLastVisit),
        avgDaysBetweenVisits:
          loyalty.avgDaysBetweenVisits === null ? null : Math.round(loyalty.avgDaysBetweenVisits),
        eventTypes: Array.from(acc.eventTypes.values()),
        loyaltyStatus: loyalty.loyaltyStatus,
        dataQualityFlags: annotation.flags,
        possibleDuplicateKeys: annotation.possibleDuplicateKeys,
      };
    });

    // 4. Stats over the FULL customer set (independent of filter/search/pagination).
    const stats = {
      totalCustomers: allCustomers.length,
      returning: allCustomers.filter((c) => c.visitCount >= 2).length,
      newThisMonth: allCustomers.filter(
        (c) => (now.getTime() - new Date(c.firstVisitAt).getTime()) / DAY_MS <= NEW_THIS_MONTH_DAYS
      ).length,
      atRisk: allCustomers.filter((c) => c.loyaltyStatus === "at_risk").length,
    };

    // 5. Filter (pills) + search.
    let filtered = allCustomers;
    if (filter === "loyal") filtered = filtered.filter((c) => c.loyaltyStatus === "loyal");
    else if (filter === "at_risk") filtered = filtered.filter((c) => c.loyaltyStatus === "at_risk");
    else if (filter === "recent")
      filtered = filtered.filter((c) => c.daysSinceLastVisit <= RECENT_FILTER_DAYS);

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.displayName.toLowerCase().includes(q) ||
          (c.email?.toLowerCase().includes(q) ?? false) ||
          (c.phoneNumber?.toLowerCase().includes(q) ?? false)
      );
    }

    // 6. Sort.
    filtered = sortCustomers(filtered, sortBy);

    // 7. Paginate the result list.
    const total = filtered.length;
    const page = filtered.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return { customers: page, stats, total, hasMore };
  }
}

function sortCustomers(customers: CustomerDto[], sortBy: CustomerSortBy): CustomerDto[] {
  const sorted = [...customers];
  if (sortBy === "name") {
    sorted.sort((a, b) => a.displayName.localeCompare(b.displayName));
  } else if (sortBy === "lastVisit") {
    sorted.sort((a, b) => new Date(b.lastVisitAt).getTime() - new Date(a.lastVisitAt).getTime());
  } else {
    // "visits" (default): most bookings first, tiebreak by most recent visit.
    sorted.sort(
      (a, b) =>
        b.visitCount - a.visitCount ||
        new Date(b.lastVisitAt).getTime() - new Date(a.lastVisitAt).getTime()
    );
  }
  return sorted;
}
