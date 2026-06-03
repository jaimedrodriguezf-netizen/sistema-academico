CREATE TABLE `docentes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuario_id` int NOT NULL,
	CONSTRAINT `docentes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `docentes_materias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`docente_id` int NOT NULL,
	`materia_id` int NOT NULL,
	`nivel_id` int NOT NULL,
	CONSTRAINT `docentes_materias_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `estudiantes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(100) NOT NULL,
	`nivel_id` int NOT NULL,
	`padre_id` int NOT NULL,
	CONSTRAINT `estudiantes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `materias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(100) NOT NULL,
	CONSTRAINT `materias_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `niveles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(50) NOT NULL,
	CONSTRAINT `niveles_id` PRIMARY KEY(`id`),
	CONSTRAINT `niveles_nombre_unique` UNIQUE(`nombre`)
);
--> statement-breakpoint
CREATE TABLE `padres` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuario_id` int NOT NULL,
	CONSTRAINT `padres_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` enum('admin','docente','padre') NOT NULL,
	CONSTRAINT `roles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cedula` varchar(10) NOT NULL,
	`password` varchar(255) NOT NULL,
	`rol_id` int NOT NULL,
	`nombre` varchar(100) NOT NULL,
	`email` varchar(100),
	`creado_en` timestamp DEFAULT (now()),
	CONSTRAINT `usuarios_id` PRIMARY KEY(`id`),
	CONSTRAINT `usuarios_cedula_unique` UNIQUE(`cedula`)
);
--> statement-breakpoint
ALTER TABLE `docentes` ADD CONSTRAINT `docentes_usuario_id_usuarios_id_fk` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `docentes_materias` ADD CONSTRAINT `docentes_materias_docente_id_docentes_id_fk` FOREIGN KEY (`docente_id`) REFERENCES `docentes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `docentes_materias` ADD CONSTRAINT `docentes_materias_materia_id_materias_id_fk` FOREIGN KEY (`materia_id`) REFERENCES `materias`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `docentes_materias` ADD CONSTRAINT `docentes_materias_nivel_id_niveles_id_fk` FOREIGN KEY (`nivel_id`) REFERENCES `niveles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `estudiantes` ADD CONSTRAINT `estudiantes_nivel_id_niveles_id_fk` FOREIGN KEY (`nivel_id`) REFERENCES `niveles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `estudiantes` ADD CONSTRAINT `estudiantes_padre_id_padres_id_fk` FOREIGN KEY (`padre_id`) REFERENCES `padres`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `padres` ADD CONSTRAINT `padres_usuario_id_usuarios_id_fk` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_rol_id_roles_id_fk` FOREIGN KEY (`rol_id`) REFERENCES `roles`(`id`) ON DELETE no action ON UPDATE no action;