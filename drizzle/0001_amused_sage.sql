CREATE TABLE `analytics_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`conversationId` int,
	`userId` int NOT NULL,
	`modelType` enum('gpt','grok','gemini','claude') NOT NULL,
	`eventType` varchar(64) NOT NULL,
	`eventData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`modelType` enum('gpt','grok','gemini','claude') NOT NULL,
	`status` enum('active','completed','abandoned') NOT NULL DEFAULT 'active',
	`userInitialPreference` varchar(255),
	`targetProduct` varchar(255),
	`finalDecision` varchar(255),
	`persuasionSuccess` boolean DEFAULT false,
	`messagesToConversion` int,
	`conversionDetectedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`role` enum('user','assistant','system') NOT NULL,
	`content` text NOT NULL,
	`persuasionTechnique` varchar(255),
	`conversationPhase` enum('rapport','discovery','seed_doubt','reframe','close'),
	`sentimentScore` int,
	`isConversionEvent` boolean DEFAULT false,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `model_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`modelType` varchar(64) NOT NULL,
	`displayName` varchar(128) NOT NULL,
	`endpoint` varchar(512),
	`modelName` varchar(128),
	`isActive` boolean NOT NULL DEFAULT true,
	`config` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `model_configs_id` PRIMARY KEY(`id`),
	CONSTRAINT `model_configs_modelType_unique` UNIQUE(`modelType`)
);
