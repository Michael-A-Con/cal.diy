// [looknbook] Feature flag for the multi-team-member / multiple-instructors feature set (Phase 1+).
// Default OFF. Phase 1 ships dormant: when disabled, resolvers fall back to single-user
// ("virtual team of one") behavior, so nothing in the app changes until we explicitly opt in.
export const LOOKNBOOK_TEAMS_ENABLED = process.env.LOOKNBOOK_TEAMS_ENABLED === "true";
