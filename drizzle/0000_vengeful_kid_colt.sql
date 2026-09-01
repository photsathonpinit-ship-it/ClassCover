CREATE TABLE `leave_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`teacher_id` integer NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`leave_type` text NOT NULL,
	`reason` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`note` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `leave_teacher` ON `leave_requests` (`teacher_id`);--> statement-breakpoint
CREATE INDEX `leave_dates` ON `leave_requests` (`start_date`,`end_date`);--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`teacher_id` integer NOT NULL,
	`day` text NOT NULL,
	`period` integer NOT NULL,
	`subject` text NOT NULL,
	`room` text,
	`class_level` text,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `schedule_teacher_day` ON `schedules` (`teacher_id`,`day`);--> statement-breakpoint
CREATE INDEX `schedule_day_period` ON `schedules` (`day`,`period`);--> statement-breakpoint
CREATE TABLE `school_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_name` text DEFAULT 'โรงเรียนประถม' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sub_assignments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`leave_request_id` integer NOT NULL,
	`absent_teacher_id` integer NOT NULL,
	`substitute_teacher_id` integer,
	`date` text NOT NULL,
	`day` text NOT NULL,
	`period` integer NOT NULL,
	`subject` text NOT NULL,
	`room` text,
	`class_level` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`score` integer,
	`note` text,
	FOREIGN KEY (`leave_request_id`) REFERENCES `leave_requests`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`absent_teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`substitute_teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sub_absence` ON `sub_assignments` (`leave_request_id`);--> statement-breakpoint
CREATE INDEX `sub_date` ON `sub_assignments` (`date`);--> statement-breakpoint
CREATE INDEX `sub_substitute` ON `sub_assignments` (`substitute_teacher_id`);--> statement-breakpoint
CREATE TABLE `teachers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`title` text DEFAULT 'ครู' NOT NULL,
	`subject_groups` text DEFAULT '[]' NOT NULL,
	`phone` text,
	`email` text,
	`max_periods_per_day` integer DEFAULT 4 NOT NULL
);
