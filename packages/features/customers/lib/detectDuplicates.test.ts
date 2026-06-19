// [looknbook] Unit tests for duplicate / identity-bridge detection.
import { describe, expect, it } from "vitest";

import type { CustomerIdentity } from "./detectDuplicates";
import { detectDuplicates } from "./detectDuplicates";

const base = (over: Partial<CustomerIdentity> & Pick<CustomerIdentity, "key" | "keyType">): CustomerIdentity => ({
  emails: [],
  phones: [],
  lowQualityPhone: false,
  ...over,
});

describe("detectDuplicates", () => {
  it("flags no duplicates for distinct customers", () => {
    const result = detectDuplicates([
      base({ key: "+50611111111", keyType: "phone", phones: ["+50611111111"], emails: ["a@x.com"] }),
      base({ key: "+50622222222", keyType: "phone", phones: ["+50622222222"], emails: ["b@x.com"] }),
    ]);
    expect(result.get("+50611111111")!.flags).toEqual([]);
    expect(result.get("+50611111111")!.possibleDuplicateKeys).toEqual([]);
  });

  it("flags SPLIT_IDENTITY when the same email is phone-keyed and email-keyed (pre/post Phase X)", () => {
    // Post-Phase-X booking: phone-keyed, also captured the email.
    const phoneKeyed = base({
      key: "+50688887777",
      keyType: "phone",
      phones: ["+50688887777"],
      emails: ["maria@x.com"],
    });
    // Pre-Phase-X booking: email-keyed, no phone.
    const emailKeyed = base({ key: "maria@x.com", keyType: "email", emails: ["maria@x.com"] });

    const result = detectDuplicates([phoneKeyed, emailKeyed]);

    expect(result.get("+50688887777")!.flags).toContain("SPLIT_IDENTITY");
    expect(result.get("maria@x.com")!.flags).toContain("SPLIT_IDENTITY");
    expect(result.get("+50688887777")!.possibleDuplicateKeys).toContain("maria@x.com");
    expect(result.get("maria@x.com")!.possibleDuplicateKeys).toContain("+50688887777");
  });

  it("flags MULTIPLE_EMAILS_SAME_PHONE", () => {
    const a = base({ key: "+50699999999", keyType: "phone", phones: ["+50699999999"], emails: ["one@x.com"] });
    const b = base({ key: "k2", keyType: "phone", phones: ["+50699999999"], emails: ["two@x.com"] });
    const result = detectDuplicates([a, b]);
    expect(result.get("+50699999999")!.flags).toContain("MULTIPLE_EMAILS_SAME_PHONE");
  });

  it("flags MULTIPLE_PHONES_SAME_EMAIL", () => {
    const a = base({ key: "k1", keyType: "phone", phones: ["+50611112222"], emails: ["dup@x.com"] });
    const b = base({ key: "k2", keyType: "phone", phones: ["+50633334444"], emails: ["dup@x.com"] });
    const result = detectDuplicates([a, b]);
    expect(result.get("k1")!.flags).toContain("MULTIPLE_PHONES_SAME_EMAIL");
  });

  it("flags LOW_QUALITY_PHONE from the identity", () => {
    const result = detectDuplicates([base({ key: "raw:123", keyType: "phone", lowQualityPhone: true })]);
    expect(result.get("raw:123")!.flags).toContain("LOW_QUALITY_PHONE");
  });

  it("does not flag SPLIT_IDENTITY when two email-keyed customers happen to share nothing", () => {
    const result = detectDuplicates([
      base({ key: "a@x.com", keyType: "email", emails: ["a@x.com"] }),
      base({ key: "b@x.com", keyType: "email", emails: ["b@x.com"] }),
    ]);
    expect(result.get("a@x.com")!.flags).toEqual([]);
  });
});
