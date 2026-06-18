import { getDate } from "./bookingScenario";
import type { SchedulingType } from "@calcom/prisma/client";
import type { CreationSource } from "@calcom/prisma/enums";
import type { Tracking } from "../types";

export const DEFAULT_TIMEZONE_BOOKER = "Asia/Kolkata";
// [looknbook] attendeePhoneNumber is now required by default (WhatsApp-first policy), so booking
// scenarios that don't specify a phone get this valid E.164 Costa Rica number injected automatically.
export const DEFAULT_TEST_PHONE_NUMBER = "+50688887777";
export function getBasicMockRequestDataForBooking() {
  return {
    start: `${getDate({ dateIncrement: 1 }).dateString}T04:00:00.000Z`,
    end: `${getDate({ dateIncrement: 1 }).dateString}T04:30:00.000Z`,
    eventTypeSlug: "no-confirmation",
    timeZone: DEFAULT_TIMEZONE_BOOKER,
    language: "en",
    user: "teampro",
    metadata: {},
    hasHashedBookingLink: false,
  };
}

type CommonPropsMockRequestData = {
  rescheduleUid?: string;
  bookingUid?: string;
  recurringEventId?: string;
  recurringCount?: number;
  rescheduledBy?: string;
  cancelledBy?: string;
  schedulingType?: SchedulingType;
  guests?: string[];
  responses: {
    email: string;
    name: string;
    location?: { optionValue: ""; value: string };
    attendeePhoneNumber?: string;
    smsReminderNumber?: string;
  };
  _isDryRun?: boolean;
  hashedLink?: string;
  hasHashedBookingLink?: boolean;
};

export function getMockRequestDataForBooking({
  data,
}: {
  data: Partial<ReturnType<typeof getBasicMockRequestDataForBooking>> & {
    eventTypeId: number;
    user?: string;
    creationSource?: CreationSource;
    tracking?: Tracking;
  } & CommonPropsMockRequestData;
}) {
  const merged = {
    ...getBasicMockRequestDataForBooking(),
    ...data,
  };
  // [looknbook] inject default phone when a test doesn't specify one (phone is now required)
  return {
    ...merged,
    responses: { attendeePhoneNumber: DEFAULT_TEST_PHONE_NUMBER, ...merged.responses },
  };
}

export function getMockRequestDataForDynamicGroupBooking({
  data,
}: {
  data: Partial<ReturnType<typeof getBasicMockRequestDataForBooking>> & {
    eventTypeId: 0;
    eventTypeSlug: string;
    user: string;
  } & CommonPropsMockRequestData;
}) {
  const merged = {
    ...getBasicMockRequestDataForBooking(),
    ...data,
  };
  // [looknbook] inject default phone when a test doesn't specify one (phone is now required)
  return {
    ...merged,
    responses: { attendeePhoneNumber: DEFAULT_TEST_PHONE_NUMBER, ...merged.responses },
  };
}
