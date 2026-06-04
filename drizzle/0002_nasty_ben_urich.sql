CREATE TABLE `asistencias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`estudiante_id` int NOT NULL,
	`fecha` date NOT NULL,
	`estado` enum('presente','ausente','atraso','justificado') NOT NULL,
	`materia_id` int,
	`observacion` varchar(255),
	`creado_en` timestamp DEFAULT (now()),
	CONSTRAINT `asistencias_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `asistencias` ADD CONSTRAINT `asistencias_estudiante_id_estudiantes_id_fk` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asistencias` ADD CONSTRAINT `asistencias_materia_id_materias_id_fk` FOREIGN KEY (`materia_id`) REFERENCES `materias`(`id`) ON DELETE no action ON UPDATE no action;