-- Optimize paginated skill browsing and array-based filters.
CREATE INDEX IF NOT EXISTS "Skill_createdAt_idx" ON "Skill" ("createdAt");
CREATE INDEX IF NOT EXISTS "Skill_agents_idx" ON "Skill" USING GIN ("agents");
CREATE INDEX IF NOT EXISTS "Skill_tags_idx" ON "Skill" USING GIN ("tags");