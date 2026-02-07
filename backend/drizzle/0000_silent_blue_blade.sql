DO $$ BEGIN
 CREATE TYPE "sbom_format" AS ENUM('spdx', 'cyclonedx');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "severity" AS ENUM('critical', 'high', 'medium', 'low', 'none');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "vulnerability_status" AS ENUM('open', 'mitigated', 'false_positive');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "component_vulnerabilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"component_id" uuid NOT NULL,
	"vulnerability_id" uuid NOT NULL,
	"status" "vulnerability_status" DEFAULT 'open' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sbom_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"version" varchar(100) NOT NULL,
	"supplier" varchar(255),
	"license" varchar(255),
	"purl" varchar(500),
	"checksum_sha256" varchar(64),
	"dependencies" jsonb,
	"metadata" jsonb,
	"release_date" timestamp,
	"eol_date" timestamp,
	"description" text,
	"origin" varchar(255),
	"criticality" varchar(50),
	"usage_restrictions" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sboms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"version" varchar(50) NOT NULL,
	"format" "sbom_format" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"author" varchar(255),
	"raw_content" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vulnerabilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cve_id" varchar(50) NOT NULL,
	"severity" "severity" NOT NULL,
	"cvss_score" numeric(3, 1),
	"description" text,
	"affected_versions" text,
	"fixed_version" varchar(100),
	"references" jsonb,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"published_date" timestamp,
	CONSTRAINT "vulnerabilities_cve_id_unique" UNIQUE("cve_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "component_vulnerabilities" ADD CONSTRAINT "component_vulnerabilities_component_id_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "components"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "component_vulnerabilities" ADD CONSTRAINT "component_vulnerabilities_vulnerability_id_vulnerabilities_id_fk" FOREIGN KEY ("vulnerability_id") REFERENCES "vulnerabilities"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "components" ADD CONSTRAINT "components_sbom_id_sboms_id_fk" FOREIGN KEY ("sbom_id") REFERENCES "sboms"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sboms" ADD CONSTRAINT "sboms_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
