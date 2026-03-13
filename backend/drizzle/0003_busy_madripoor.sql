ALTER TABLE "components" ADD COLUMN "cpe" varchar(500);--> statement-breakpoint
ALTER TABLE "components" ADD COLUMN "swid" text;--> statement-breakpoint
ALTER TABLE "components" ADD COLUMN "dependency_relationship" text;