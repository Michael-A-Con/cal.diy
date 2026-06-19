// [looknbook] Duplicate / identity-bridge detection — pure, O(n) via hash maps (no nested scans).
// Surfaces likely-duplicate customers (e.g. someone who booked by email before Phase X and by
// phone after) without auto-merging them.
import type { CustomerKeyType, DataQualityFlag } from "../types";

export type CustomerIdentity = {
  key: string;
  keyType: CustomerKeyType;
  /** Distinct real emails seen for this customer (lowercased, no synthetic @sms.cal.com). */
  emails: string[];
  /** Distinct normalized E.164 phones seen for this customer. */
  phones: string[];
  lowQualityPhone: boolean;
};

export type DuplicateAnnotation = {
  flags: DataQualityFlag[];
  possibleDuplicateKeys: string[];
};

export function detectDuplicates(customers: CustomerIdentity[]): Map<string, DuplicateAnnotation> {
  const emailToKeys = new Map<string, Set<string>>();
  const phoneToKeys = new Map<string, Set<string>>();
  const keyToMeta = new Map<string, CustomerIdentity>();

  // Pass 1 — build inverted indexes.
  for (const c of customers) {
    keyToMeta.set(c.key, c);
    for (const email of c.emails) {
      if (!emailToKeys.has(email)) emailToKeys.set(email, new Set());
      emailToKeys.get(email)!.add(c.key);
    }
    for (const phone of c.phones) {
      if (!phoneToKeys.has(phone)) phoneToKeys.set(phone, new Set());
      phoneToKeys.get(phone)!.add(c.key);
    }
  }

  // Pass 2 — annotate each customer.
  const result = new Map<string, DuplicateAnnotation>();
  for (const c of customers) {
    const flags = new Set<DataQualityFlag>();
    const possible = new Set<string>();

    if (c.lowQualityPhone) flags.add("LOW_QUALITY_PHONE");

    for (const email of c.emails) {
      const keys = emailToKeys.get(email);
      if (!keys || keys.size <= 1) continue;

      const keyTypes = new Set<CustomerKeyType>();
      const phonesUnion = new Set<string>();
      for (const k of Array.from(keys)) {
        if (k !== c.key) possible.add(k);
        const meta = keyToMeta.get(k);
        if (!meta) continue;
        keyTypes.add(meta.keyType);
        for (const p of meta.phones) phonesUnion.add(p);
      }
      // Same email used by both a phone-keyed and an email-keyed customer = booked before & after Phase X.
      if (keyTypes.has("phone") && keyTypes.has("email")) flags.add("SPLIT_IDENTITY");
      // Same email associated with more than one distinct phone.
      if (phonesUnion.size > 1) flags.add("MULTIPLE_PHONES_SAME_EMAIL");
    }

    for (const phone of c.phones) {
      const keys = phoneToKeys.get(phone);
      if (!keys || keys.size <= 1) continue;

      const emailsUnion = new Set<string>();
      for (const k of Array.from(keys)) {
        if (k !== c.key) possible.add(k);
        const meta = keyToMeta.get(k);
        if (!meta) continue;
        for (const e of meta.emails) emailsUnion.add(e);
      }
      // Same phone associated with more than one distinct real email.
      if (emailsUnion.size > 1) flags.add("MULTIPLE_EMAILS_SAME_PHONE");
    }

    result.set(c.key, {
      flags: Array.from(flags),
      possibleDuplicateKeys: Array.from(possible),
    });
  }

  return result;
}
