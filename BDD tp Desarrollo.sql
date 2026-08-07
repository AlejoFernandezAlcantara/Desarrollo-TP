-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: desarrollobd
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `administrador`
--

DROP TABLE IF EXISTS `administrador`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `administrador` (
  `id` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_administrador_usuario` FOREIGN KEY (`id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cara`
--

DROP TABLE IF EXISTS `cara`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cara` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(30) NOT NULL,
  `detalle` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `detalle`
--

DROP TABLE IF EXISTS `detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `fecha_realizacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `observaciones` text,
  `odontograma_id` int unsigned NOT NULL,
  `practica_id` int unsigned NOT NULL,
  `diente_id` int unsigned DEFAULT NULL,
  `reserva_id` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_detalle_odontograma` (`odontograma_id`),
  KEY `fk_detalle_practica` (`practica_id`),
  KEY `fk_detalle_diente` (`diente_id`),
  KEY `fk_detalle_reserva` (`reserva_id`),
  CONSTRAINT `fk_detalle_diente` FOREIGN KEY (`diente_id`) REFERENCES `diente` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_detalle_odontograma` FOREIGN KEY (`odontograma_id`) REFERENCES `odontograma` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_detalle_practica` FOREIGN KEY (`practica_id`) REFERENCES `practica` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_detalle_reserva` FOREIGN KEY (`reserva_id`) REFERENCES `reserva` (`id_reserva`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `diente`
--

DROP TABLE IF EXISTS `diente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `diente` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `numero` tinyint unsigned NOT NULL,
  `nombre` varchar(50) DEFAULT NULL,
  `tipo` varchar(30) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_diente_numero` (`numero`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `diente_cara`
--

DROP TABLE IF EXISTS `diente_cara`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `diente_cara` (
  `diente_id` int unsigned NOT NULL,
  `cara_id` int unsigned NOT NULL,
  PRIMARY KEY (`diente_id`,`cara_id`),
  KEY `fk_dc_cara` (`cara_id`),
  CONSTRAINT `fk_dc_cara` FOREIGN KEY (`cara_id`) REFERENCES `cara` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dc_diente` FOREIGN KEY (`diente_id`) REFERENCES `diente` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mutual`
--

DROP TABLE IF EXISTS `mutual`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mutual` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `cuit` char(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_mutual_cuit` (`cuit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `odontograma`
--

DROP TABLE IF EXISTS `odontograma`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `odontograma` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` varchar(30) NOT NULL DEFAULT 'Activo',
  `paciente_id` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_odontograma_paciente` (`paciente_id`),
  CONSTRAINT `fk_odontograma_paciente` FOREIGN KEY (`paciente_id`) REFERENCES `paciente` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `odontologo`
--

DROP TABLE IF EXISTS `odontologo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `odontologo` (
  `id` int unsigned NOT NULL,
  `nro_Matricula` int unsigned NOT NULL,
  `especialidad` varchar(50) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `nroDocumento` varchar(20) NOT NULL,
  `tipoDoc` enum('DNI','Pasaporte') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_odontologo_matricula` (`nro_Matricula`),
  CONSTRAINT `fk_odontologo_usuario` FOREIGN KEY (`id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `odontologo_mutual`
--

DROP TABLE IF EXISTS `odontologo_mutual`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `odontologo_mutual` (
  `odontologo_id` int unsigned NOT NULL,
  `mutual_id` int unsigned NOT NULL,
  `nroAfiliado` varchar(30) NOT NULL,
  PRIMARY KEY (`odontologo_id`,`mutual_id`),
  KEY `fk_om_mutual` (`mutual_id`),
  CONSTRAINT `fk_om_mutual` FOREIGN KEY (`mutual_id`) REFERENCES `mutual` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_om_odontologo` FOREIGN KEY (`odontologo_id`) REFERENCES `odontologo` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `paciente`
--

DROP TABLE IF EXISTS `paciente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `paciente` (
  `id` int unsigned NOT NULL,
  `nro_paciente` int unsigned NOT NULL,
  `direccion` varchar(100) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `nroDocumento` varchar(20) NOT NULL,
  `tipoDoc` enum('DNI','Pasaporte') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_paciente_nro` (`nro_paciente`),
  CONSTRAINT `fk_paciente_usuario` FOREIGN KEY (`id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `paciente_mutual`
--

DROP TABLE IF EXISTS `paciente_mutual`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `paciente_mutual` (
  `paciente_id` int unsigned NOT NULL,
  `mutual_id` int unsigned NOT NULL,
  `nroAfiliado` varchar(30) NOT NULL,
  `cubre` tinyint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`paciente_id`,`mutual_id`),
  KEY `fk_pm_mutual` (`mutual_id`),
  CONSTRAINT `fk_pm_mutual` FOREIGN KEY (`mutual_id`) REFERENCES `mutual` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pm_paciente` FOREIGN KEY (`paciente_id`) REFERENCES `paciente` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_cubre` CHECK ((`cubre` between 0 and 100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `practica`
--

DROP TABLE IF EXISTS `practica`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `practica` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `codigo` varchar(20) NOT NULL,
  `detalle` varchar(100) NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_practica_codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `reserva`
--

DROP TABLE IF EXISTS `reserva`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reserva` (
  `id_reserva` int unsigned NOT NULL AUTO_INCREMENT,
  `paciente_id` int unsigned NOT NULL,
  `odontologo_id` int unsigned NOT NULL,
  `mutual_id` int unsigned DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` enum('pendiente','confirmada','cancelada','realizada') NOT NULL DEFAULT 'pendiente',
  `observaciones` varchar(255) DEFAULT NULL,
  `coseguro` decimal(10,2) DEFAULT NULL,
  `fechaRealizacion` datetime DEFAULT NULL,
  `resultado` enum('exitoso','requiere seguimiento','no asistió') DEFAULT NULL,
  PRIMARY KEY (`id_reserva`),
  KEY `fk_reserva_paciente` (`paciente_id`),
  KEY `fk_reserva_odontologo` (`odontologo_id`),
  KEY `fk_reserva_mutual` (`mutual_id`),
  CONSTRAINT `fk_reserva_mutual` FOREIGN KEY (`mutual_id`) REFERENCES `mutual` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_reserva_odontologo` FOREIGN KEY (`odontologo_id`) REFERENCES `odontologo` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_reserva_paciente` FOREIGN KEY (`paciente_id`) REFERENCES `paciente` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `turno`
--

DROP TABLE IF EXISTS `turno`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `turno` (
  `codigo` int unsigned NOT NULL AUTO_INCREMENT,
  `fecha_hora_inicio` datetime NOT NULL,
  `duracion` int unsigned NOT NULL,
  `estado` varchar(50) NOT NULL DEFAULT 'libre',
  `odontologo_id` int unsigned NOT NULL,
  `reserva_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`codigo`),
  KEY `fk_turno_odontologo` (`odontologo_id`),
  KEY `fk_turno_reserva` (`reserva_id`),
  CONSTRAINT `fk_turno_odontologo` FOREIGN KEY (`odontologo_id`) REFERENCES `odontologo` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_turno_reserva` FOREIGN KEY (`reserva_id`) REFERENCES `reserva` (`id_reserva`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `apellido` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_usuario_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-07 13:12:39
