ALTER TABLE `estudiantes` ADD `cedula` varchar(10);--> statement-breakpoint
ALTER TABLE `estudiantes` ADD `genero` enum('masculino','femenino','otro');--> statement-breakpoint
ALTER TABLE `estudiantes` ADD `fecha_nacimiento` date;--> statement-breakpoint
ALTER TABLE `estudiantes` ADD `creado_en` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `estudiantes` ADD CONSTRAINT `estudiantes_cedula_unique` UNIQUE(`cedula`);