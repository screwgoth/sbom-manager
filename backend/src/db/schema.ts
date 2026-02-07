import { pgTable, uuid, varchar, text, timestamp, jsonb, decimal, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const sbomFormatEnum = pgEnum('sbom_format', ['spdx', 'cyclonedx']);
export const severityEnum = pgEnum('severity', ['critical', 'high', 'medium', 'low', 'none']);
export const vulnerabilityStatusEnum = pgEnum('vulnerability_status', ['open', 'mitigated', 'false_positive']);

// Projects table
export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// SBOMs table
export const sboms = pgTable('sboms', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  version: varchar('version', { length: 50 }).notNull(),
  format: sbomFormatEnum('format').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  author: varchar('author', { length: 255 }),
  rawContent: jsonb('raw_content'),
});

// Components table
export const components = pgTable('components', {
  id: uuid('id').defaultRandom().primaryKey(),
  sbomId: uuid('sbom_id').notNull().references(() => sboms.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  version: varchar('version', { length: 100 }).notNull(),
  supplier: varchar('supplier', { length: 255 }),
  license: varchar('license', { length: 255 }),
  purl: varchar('purl', { length: 500 }),
  checksumSha256: varchar('checksum_sha256', { length: 64 }),
  dependencies: jsonb('dependencies'),
  metadata: jsonb('metadata'),
  releaseDate: timestamp('release_date'),
  eolDate: timestamp('eol_date'),
  description: text('description'),
  origin: varchar('origin', { length: 255 }),
  criticality: varchar('criticality', { length: 50 }),
  usageRestrictions: text('usage_restrictions'),
});

// Vulnerabilities table
export const vulnerabilities = pgTable('vulnerabilities', {
  id: uuid('id').defaultRandom().primaryKey(),
  cveId: varchar('cve_id', { length: 50 }).notNull().unique(),
  severity: severityEnum('severity').notNull(),
  cvssScore: decimal('cvss_score', { precision: 3, scale: 1 }),
  description: text('description'),
  affectedVersions: text('affected_versions'),
  fixedVersion: varchar('fixed_version', { length: 100 }),
  references: jsonb('references'),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
  publishedDate: timestamp('published_date'),
});

// Component-Vulnerability junction table
export const componentVulnerabilities = pgTable('component_vulnerabilities', {
  id: uuid('id').defaultRandom().primaryKey(),
  componentId: uuid('component_id').notNull().references(() => components.id, { onDelete: 'cascade' }),
  vulnerabilityId: uuid('vulnerability_id').notNull().references(() => vulnerabilities.id, { onDelete: 'cascade' }),
  status: vulnerabilityStatusEnum('status').notNull().default('open'),
});

// Relations
export const projectsRelations = relations(projects, ({ many }) => ({
  sboms: many(sboms),
}));

export const sbomsRelations = relations(sboms, ({ one, many }) => ({
  project: one(projects, {
    fields: [sboms.projectId],
    references: [projects.id],
  }),
  components: many(components),
}));

export const componentsRelations = relations(components, ({ one, many }) => ({
  sbom: one(sboms, {
    fields: [components.sbomId],
    references: [sboms.id],
  }),
  componentVulnerabilities: many(componentVulnerabilities),
}));

export const vulnerabilitiesRelations = relations(vulnerabilities, ({ many }) => ({
  componentVulnerabilities: many(componentVulnerabilities),
}));

export const componentVulnerabilitiesRelations = relations(componentVulnerabilities, ({ one }) => ({
  component: one(components, {
    fields: [componentVulnerabilities.componentId],
    references: [components.id],
  }),
  vulnerability: one(vulnerabilities, {
    fields: [componentVulnerabilities.vulnerabilityId],
    references: [vulnerabilities.id],
  }),
}));
