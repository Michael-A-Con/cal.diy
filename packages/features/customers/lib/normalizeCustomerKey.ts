// [looknbook] Customer identity resolution — pure helpers for normalizing phone/email into a grouping key.
import { parsePhoneNumberWithError } from "libphonenumber-js/max";

import isSmsCalEmail from "@calcom/lib/isSmsCalEmail";

import type { CustomerKeyType } from "../types";

/**
 * Normalizes a raw phone string to E.164 (e.g. "+50688887777").
 * Returns null when the value is empty or cannot be parsed.
 * New bookings already store E.164 (Phase X), so this is mostly a pass-through;
 * the parsing matters for legacy/messy phone data.
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw || !raw.trim()) return null;
  try {
    const parsed = parsePhoneNumberWithError(raw.trim());
    return parsed.isValid() ? parsed.number : null;
  } catch {
    return null;
  }
}

/**
 * Returns a usable, lowercased email, or null when the email is absent or synthetic.
 * Phone-only bookings (Phase X) store `<digits>@sms.cal.com` — that is NOT a real email
 * and must never be displayed or used as a grouping/duplicate key.
 */
export function realEmail(raw: string | null | undefined): string | null {
  if (!raw || !raw.trim()) return null;
  const email = raw.trim().toLowerCase();
  if (isSmsCalEmail(email)) return null;
  return email;
}

export type CustomerKey = {
  key: string;
  keyType: CustomerKeyType;
  /** True when a phone was present but could not be parsed to E.164 (legacy/dirty data). */
  lowQualityPhone: boolean;
};

/**
 * Determines the grouping key for an attendee.
 * Primary: normalized E.164 phone. Fallback: real email. Last resort: raw-trimmed phone (flagged low quality).
 */
export function getCustomerKey(input: {
  phone: string | null | undefined;
  email: string | null | undefined;
}): CustomerKey | null {
  const phone = normalizePhone(input.phone);
  if (phone) {
    return { key: phone, keyType: "phone", lowQualityPhone: false };
  }

  const email = realEmail(input.email);
  if (email) {
    return { key: email, keyType: "email", lowQualityPhone: false };
  }

  // A phone was provided but unparseable, and there's no real email — keep the person as a
  // (low-quality) phone-keyed customer rather than dropping them.
  const rawPhone = input.phone?.trim();
  if (rawPhone) {
    return { key: `raw:${rawPhone}`, keyType: "phone", lowQualityPhone: true };
  }

  // No phone and no real email (e.g. synthetic email only with no phone) — cannot key this attendee.
  return null;
}
