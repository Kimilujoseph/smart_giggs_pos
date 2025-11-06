-- MySQL dump 10.13  Distrib 8.0.42, for Linux (x86_64)
--
-- Host: localhost    Database: smart_giggs
-- ------------------------------------------------------
-- Server version	8.0.42-0ubuntu0.20.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `CommissionPayment`
--

DROP TABLE IF EXISTS `CommissionPayment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CommissionPayment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sellerId` int NOT NULL,
  `amountPaid` decimal(10,2) NOT NULL,
  `status` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paymentDate` datetime(3) NOT NULL,
  `periodStartDate` datetime(3) NOT NULL,
  `periodEndDate` datetime(3) NOT NULL,
  `processedById` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `CommissionPayment_processedById_idx` (`processedById`),
  KEY `CommissionPayment_sellerId_idx` (`sellerId`),
  CONSTRAINT `CommissionPayment_processedById_fkey` FOREIGN KEY (`processedById`) REFERENCES `actors` (`_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `CommissionPayment_sellerId_fkey` FOREIGN KEY (`sellerId`) REFERENCES `actors` (`_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CommissionPayment`
--

LOCK TABLES `CommissionPayment` WRITE;
/*!40000 ALTER TABLE `CommissionPayment` DISABLE KEYS */;
INSERT INTO `CommissionPayment` VALUES (3,3,50.00,NULL,'2025-10-30 10:00:00.000','2025-07-01 00:00:00.000','2025-07-31 23:59:59.000',1),(4,3,10.00,NULL,'2025-10-30 10:00:00.000','2025-07-01 00:00:00.000','2025-07-31 23:59:59.000',1),(5,3,60.00,NULL,'2025-10-31 09:06:23.852','2025-10-31 09:06:23.852','2025-10-31 09:06:23.852',1),(6,5,400.00,NULL,'2025-10-31 18:19:33.186','2025-10-31 18:19:33.186','2025-10-31 18:19:33.186',1),(7,3,60.00,NULL,'2025-10-31 19:45:03.706','2025-10-31 19:45:03.706','2025-10-31 19:45:03.706',1),(8,5,100.00,NULL,'2025-10-31 19:46:16.630','2025-10-31 19:46:16.630','2025-10-31 19:46:16.630',1);
/*!40000 ALTER TABLE `CommissionPayment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `CommissionPaymentsOnAccessorySales`
--

DROP TABLE IF EXISTS `CommissionPaymentsOnAccessorySales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CommissionPaymentsOnAccessorySales` (
  `accessorySaleId` int NOT NULL,
  `commissionPaymentId` int NOT NULL,
  `assignedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `assignedBy` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`commissionPaymentId`,`accessorySaleId`),
  KEY `CommissionPaymentsOnAccessorySales_accessorySaleId_fkey` (`accessorySaleId`),
  CONSTRAINT `CommissionPaymentsOnAccessorySales_accessorySaleId_fkey` FOREIGN KEY (`accessorySaleId`) REFERENCES `accessorysales` (`_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `CommissionPaymentsOnAccessorySales_commissionPaymentId_fkey` FOREIGN KEY (`commissionPaymentId`) REFERENCES `CommissionPayment` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CommissionPaymentsOnAccessorySales`
--

LOCK TABLES `CommissionPaymentsOnAccessorySales` WRITE;
/*!40000 ALTER TABLE `CommissionPaymentsOnAccessorySales` DISABLE KEYS */;
INSERT INTO `CommissionPaymentsOnAccessorySales` VALUES (4,3,'2025-10-30 11:17:57.186','1'),(4,4,'2025-10-31 07:42:54.937','1'),(6,5,'2025-10-31 09:06:25.169','1'),(8,7,'2025-10-31 19:45:04.971','1');
/*!40000 ALTER TABLE `CommissionPaymentsOnAccessorySales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `CommissionPaymentsOnMobileSales`
--

DROP TABLE IF EXISTS `CommissionPaymentsOnMobileSales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CommissionPaymentsOnMobileSales` (
  `mobileSaleId` int NOT NULL,
  `commissionPaymentId` int NOT NULL,
  `assignedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `assignedBy` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`commissionPaymentId`,`mobileSaleId`),
  KEY `CommissionPaymentsOnMobileSales_mobileSaleId_fkey` (`mobileSaleId`),
  CONSTRAINT `CommissionPaymentsOnMobileSales_commissionPaymentId_fkey` FOREIGN KEY (`commissionPaymentId`) REFERENCES `CommissionPayment` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `CommissionPaymentsOnMobileSales_mobileSaleId_fkey` FOREIGN KEY (`mobileSaleId`) REFERENCES `mobilesales` (`_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CommissionPaymentsOnMobileSales`
--

LOCK TABLES `CommissionPaymentsOnMobileSales` WRITE;
/*!40000 ALTER TABLE `CommissionPaymentsOnMobileSales` DISABLE KEYS */;
INSERT INTO `CommissionPaymentsOnMobileSales` VALUES (2,6,'2025-10-31 18:19:33.277','1'),(2,8,'2025-10-31 19:46:16.728','1');
/*!40000 ALTER TABLE `CommissionPaymentsOnMobileSales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Customer`
--

DROP TABLE IF EXISTS `Customer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Customer` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phoneNumber` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Customer_phoneNumber_key` (`phoneNumber`),
  UNIQUE KEY `Customer_email_key` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Customer`
--

LOCK TABLES `Customer` WRITE;
/*!40000 ALTER TABLE `Customer` DISABLE KEYS */;
INSERT INTO `Customer` VALUES (1,'Antony Maithia','teddcruz@gmail.com','0745635342','2025-10-30 06:07:12.984'),(2,'','','','2025-10-30 06:47:51.457'),(3,'John Doe','johndoe@example.com','074325674','2025-10-30 07:13:59.485');
/*!40000 ALTER TABLE `Customer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `DailySalesAnalytics`
--

DROP TABLE IF EXISTS `DailySalesAnalytics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `DailySalesAnalytics` (
  `id` int NOT NULL AUTO_INCREMENT,
  `date` date DEFAULT NULL,
  `categoryId` int NOT NULL,
  `shopId` int NOT NULL,
  `sellerId` int NOT NULL,
  `financeId` int DEFAULT NULL,
  `financeStatus` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `totalUnitsSold` int DEFAULT NULL,
  `totalRevenue` decimal(18,2) DEFAULT NULL,
  `totalCostOfGoods` decimal(12,2) NOT NULL,
  `grossProfit` decimal(18,2) DEFAULT NULL,
  `totalCommission` decimal(18,2) DEFAULT NULL,
  `totalfinanceAmount` decimal(18,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_unique_daily_sale` (`date`,`categoryId`,`shopId`,`sellerId`,`financeId`,`financeStatus`),
  KEY `idx_categoryId` (`categoryId`),
  KEY `idx_date` (`date`),
  KEY `idx_sellerId` (`sellerId`),
  KEY `idx_shopId` (`shopId`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `DailySalesAnalytics`
--

LOCK TABLES `DailySalesAnalytics` WRITE;
/*!40000 ALTER TABLE `DailySalesAnalytics` DISABLE KEYS */;
INSERT INTO `DailySalesAnalytics` VALUES (1,'2025-10-30',1,2,3,1,'paid',17,8800.00,4800.00,4000.00,480.00,0.00),(2,'2025-10-30',1,2,3,1,'pending',2,1000.00,600.00,400.00,120.00,1000.00),(3,'2025-10-31',1,2,3,1,'paid',2,1300.00,600.00,700.00,120.00,0.00),(4,'2025-10-31',3,3,5,1,'paid',1,16000.00,13500.00,2500.00,300.00,0.00),(5,'2025-10-31',4,3,5,1,'pending',1,17000.00,15500.00,1500.00,500.00,17000.00);
/*!40000 ALTER TABLE `DailySalesAnalytics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Expense`
--

DROP TABLE IF EXISTS `Expense`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Expense` (
  `id` int NOT NULL AUTO_INCREMENT,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `category` enum('RENT','UTILITIES','SUPPLIES','MARKETING','OTHER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `expenseDate` datetime(3) NOT NULL,
  `shopId` int DEFAULT NULL,
  `processedById` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Expense_processedById_idx` (`processedById`),
  KEY `Expense_shopId_idx` (`shopId`),
  CONSTRAINT `Expense_processedById_fkey` FOREIGN KEY (`processedById`) REFERENCES `actors` (`_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Expense_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `shops` (`_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Expense`
--

LOCK TABLES `Expense` WRITE;
/*!40000 ALTER TABLE `Expense` DISABLE KEYS */;
/*!40000 ALTER TABLE `Expense` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Financer`
--

DROP TABLE IF EXISTS `Financer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Financer` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contactName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Financer_name_key` (`name`),
  UNIQUE KEY `Financer_email_key` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Financer`
--

LOCK TABLES `Financer` WRITE;
/*!40000 ALTER TABLE `Financer` DISABLE KEYS */;
INSERT INTO `Financer` VALUES (1,'Ancelloti Kinoti','kinoti@gmail','07452134438','ancellotti@gmail.com','Donholm,Nairobi','2025-10-30 06:05:10.504','2025-10-30 06:05:11');
/*!40000 ALTER TABLE `Financer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Notification`
--

DROP TABLE IF EXISTS `Notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Notification` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int DEFAULT NULL,
  `message` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Notification_userId_idx` (`userId`),
  CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `actors` (`_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Notification`
--

LOCK TABLES `Notification` WRITE;
/*!40000 ALTER TABLE `Notification` DISABLE KEYS */;
/*!40000 ALTER TABLE `Notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Payment`
--

DROP TABLE IF EXISTS `Payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Payment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `amount` decimal(10,2) NOT NULL,
  `paymentMethod` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'completed',
  `transactionId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Payment`
--

LOCK TABLES `Payment` WRITE;
/*!40000 ALTER TABLE `Payment` DISABLE KEYS */;
INSERT INTO `Payment` VALUES (1,600.00,'cash','completed','','2025-10-30 06:07:13.281','2025-10-30 06:07:13'),(2,600.00,'cash','completed','','2025-10-30 06:47:51.651','2025-10-30 06:47:52'),(6,1200.00,'cash','completed','23234323423','2025-10-30 07:14:01.028','2025-10-30 07:14:01'),(7,1000.00,'cash','completed','','2025-10-30 07:28:40.336','2025-10-30 07:28:40'),(8,1200.00,'cash','completed','','2025-10-30 07:45:40.211','2025-10-30 07:45:40'),(9,1000.00,'cash','completed','','2025-10-30 07:59:05.471','2025-10-30 07:59:05'),(10,500.00,'cash','completed','','2025-10-30 08:00:23.730','2025-10-30 08:00:24'),(11,1200.00,'cash','completed','','2025-10-30 08:04:08.606','2025-10-30 08:04:09'),(12,500.00,'cash','completed','','2025-10-30 08:08:44.012','2025-10-30 08:08:44'),(13,500.00,'cash','completed','','2025-10-30 08:16:46.788','2025-10-30 08:16:47'),(14,500.00,'cash','completed','','2025-10-30 09:13:35.600','2025-10-30 09:13:35'),(15,500.00,'cash','completed','','2025-10-30 11:36:17.685','2025-10-30 11:36:18'),(16,500.00,'cash','completed','','2025-10-30 12:20:34.085','2025-10-30 12:20:34'),(17,1300.00,'cash','completed','','2025-10-31 17:54:52.815','2025-10-31 17:54:53'),(18,16000.00,'cash','completed','','2025-10-31 18:16:47.642','2025-10-31 18:16:48'),(19,17000.00,'cash','completed','','2025-10-31 18:18:11.249','2025-10-31 18:18:11');
/*!40000 ALTER TABLE `Payment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Return`
--

DROP TABLE IF EXISTS `Return`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Return` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mobileSaleId` int DEFAULT NULL,
  `accessorySaleId` int DEFAULT NULL,
  `customerId` int NOT NULL,
  `restock` tinyint(1) DEFAULT '1',
  `refundAmount` decimal(10,0) DEFAULT NULL,
  `reason` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `returnedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `processedBy` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Return_accessorySaleId_fkey` (`accessorySaleId`),
  KEY `Return_customerId_idx` (`customerId`),
  KEY `Return_mobileSaleId_fkey` (`mobileSaleId`),
  KEY `Return_processedBy_idx` (`processedBy`),
  CONSTRAINT `Return_accessorySaleId_fkey` FOREIGN KEY (`accessorySaleId`) REFERENCES `accessorysales` (`_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Return_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Return_mobileSaleId_fkey` FOREIGN KEY (`mobileSaleId`) REFERENCES `mobilesales` (`_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Return_processedBy_fkey` FOREIGN KEY (`processedBy`) REFERENCES `actors` (`_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Return`
--

LOCK TABLES `Return` WRITE;
/*!40000 ALTER TABLE `Return` DISABLE KEYS */;
/*!40000 ALTER TABLE `Return` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `SalaryPayment`
--

DROP TABLE IF EXISTS `SalaryPayment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `SalaryPayment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employeeId` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paymentDate` datetime(3) NOT NULL,
  `payPeriodMonth` int NOT NULL,
  `payPeriodYear` int NOT NULL,
  `processedById` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `SalaryPayment_employeeId_idx` (`employeeId`),
  KEY `SalaryPayment_processedById_idx` (`processedById`),
  CONSTRAINT `SalaryPayment_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `actors` (`_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `SalaryPayment_processedById_fkey` FOREIGN KEY (`processedById`) REFERENCES `actors` (`_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SalaryPayment`
--

LOCK TABLES `SalaryPayment` WRITE;
/*!40000 ALTER TABLE `SalaryPayment` DISABLE KEYS */;
INSERT INTO `SalaryPayment` VALUES (1,3,3000.00,NULL,'2025-08-17 10:00:00.000',8,2025,1),(2,3,3000.00,'VOIDED','2025-10-30 10:00:00.000',8,2025,1),(3,4,2000.00,NULL,'2025-10-31 19:48:30.859',10,2025,1);
/*!40000 ALTER TABLE `SalaryPayment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Supplier`
--

DROP TABLE IF EXISTS `Supplier`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Supplier` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contactName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Supplier_name_key` (`name`),
  UNIQUE KEY `Supplier_email_key` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Supplier`
--

LOCK TABLES `Supplier` WRITE;
/*!40000 ALTER TABLE `Supplier` DISABLE KEYS */;
INSERT INTO `Supplier` VALUES (1,'timothy kinoti ANTONY','timo muchori',NULL,'KINOTI@gmail.com','Nairobi CBD','2025-10-29 08:49:23.538','2025-10-29 08:49:24');
/*!40000 ALTER TABLE `Supplier` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('6e467927-6a38-4e8c-927c-369d80aa24ab','a390b160864152a1b9bcff48f3a5662bdda11e89c19673d918eb86712e3a640f','2025-10-29 07:29:44.572','20251029070721_add_status_to_category',NULL,NULL,'2025-10-29 07:29:38.941',1),('9f3b9f1a-a928-426c-8efd-b2a3934a50c4','2c40966fa6b701e41e249b34ccffa014c091e4258cdb269878eb6ba7a71bdd7a','2025-10-29 06:55:23.327','20251025162221_smart_giggs',NULL,NULL,'2025-10-29 06:48:50.562',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `accessories`
--

DROP TABLE IF EXISTS `accessories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accessories` (
  `_id` int NOT NULL AUTO_INCREMENT,
  `batchNumber` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productType` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `CategoryId` int NOT NULL,
  `faultyItems` int unsigned DEFAULT '0',
  `barcodePath` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `availableStock` int unsigned DEFAULT '0',
  `stockStatus` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'available',
  `color` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'white',
  `productCost` int DEFAULT NULL,
  `commission` int DEFAULT NULL,
  `discount` int DEFAULT NULL,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `paymentStatus` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PAID',
  `supplierId` int DEFAULT NULL,
  PRIMARY KEY (`_id`),
  UNIQUE KEY `_id_UNIQUE` (`_id`),
  UNIQUE KEY `itemName_UNIQUE` (`batchNumber`),
  KEY `accessories_supplierId_fkey` (`supplierId`),
  KEY `fk_accessories_1_idx` (`CategoryId`),
  CONSTRAINT `accessories_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_accessories_1` FOREIGN KEY (`CategoryId`) REFERENCES `categories` (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accessories`
--

LOCK TABLES `accessories` WRITE;
/*!40000 ALTER TABLE `accessories` DISABLE KEYS */;
INSERT INTO `accessories` VALUES (2,'23-3579-17','type-C',1,0,NULL,'2025-10-29 08:49:32',20,'available','white',300,50,0,'2025-10-30 06:38:02','PAID',1),(4,'23-3579-18','type-C',1,0,NULL,'2025-10-29 08:50:10',10,'available','white',300,0,0,'2025-10-30 06:13:35','PAID',1),(5,'23-3579-19','type-C',1,0,NULL,'2025-10-29 09:11:19',0,'available','white',300,60,0,'2025-10-30 06:45:29','PAID',1),(6,'2025-21-25','type-c',2,0,NULL,'2025-10-29 11:13:11',100,'available','white',NULL,0,0,'2025-10-29 11:13:11','PAID',1),(7,'2025-12-22','type-c',1,0,NULL,'2025-10-30 06:14:42',30,'available','yellow',300,0,0,'2025-10-30 06:35:19','PAID',1),(9,'2025-12-23','type-c',1,0,NULL,'2025-10-30 06:22:30',30,'available','yellow',300,0,0,'2025-10-30 06:35:27','PAID',1),(11,'2025-12-27','type-c',1,0,NULL,'2025-10-30 06:24:37',30,'available','yellow',300,0,0,'2025-10-30 06:35:35','PAID',1),(13,'2025-12-36','type-c',1,0,NULL,'2025-10-30 06:25:51',30,'available','yellow',300,0,0,'2025-10-30 06:35:09','PAID',1),(17,'2025-12-37','type-c',1,0,NULL,'2025-10-30 06:34:12',30,'available','yellow',300,0,0,'2025-10-30 06:35:51','PAID',1);
/*!40000 ALTER TABLE `accessories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `accessoryHistory`
--

DROP TABLE IF EXISTS `accessoryHistory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accessoryHistory` (
  `_id` int NOT NULL AUTO_INCREMENT,
  `addedBy` int NOT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `shopId` int NOT NULL,
  `type` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'new stock',
  `quantity` int unsigned NOT NULL,
  `productID` int NOT NULL,
  PRIMARY KEY (`_id`),
  UNIQUE KEY `_id_UNIQUE` (`_id`),
  KEY `fk_acccessoryHistory_1_idx` (`productID`),
  KEY `fk_accessoryHistory_1_idx` (`shopId`),
  KEY `fk_accessoryHistory_2_idx` (`addedBy`),
  CONSTRAINT `fk_acccessoryHistory_accessory__1` FOREIGN KEY (`productID`) REFERENCES `accessories` (`_id`),
  CONSTRAINT `fk_accessoryHistory_1` FOREIGN KEY (`shopId`) REFERENCES `shops` (`_id`),
  CONSTRAINT `fk_accessoryHistory_2` FOREIGN KEY (`addedBy`) REFERENCES `actors` (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accessoryHistory`
--

LOCK TABLES `accessoryHistory` WRITE;
/*!40000 ALTER TABLE `accessoryHistory` DISABLE KEYS */;
INSERT INTO `accessoryHistory` VALUES (1,1,'2025-10-29 08:49:32',1,'new stock',20,2),(2,1,'2025-10-29 08:50:10',1,'new stock',20,4),(3,1,'2025-10-29 09:11:19',1,'new stock',20,5),(4,1,'2025-10-29 11:13:12',1,'new stock',100,6),(5,1,'2025-10-30 06:12:50',1,'update',20,2),(6,1,'2025-10-30 06:13:35',1,'update',10,4),(7,1,'2025-10-30 06:13:49',1,'update',0,5),(8,1,'2025-10-30 06:14:42',1,'new stock',30,7),(9,1,'2025-10-30 06:22:30',1,'new stock',30,9),(10,1,'2025-10-30 06:24:37',1,'new stock',30,11),(11,1,'2025-10-30 06:25:51',1,'new stock',30,13),(12,1,'2025-10-30 06:34:12',1,'new stock',30,17),(13,1,'2025-10-30 06:35:09',1,'update',30,13),(14,1,'2025-10-30 06:35:20',1,'update',30,7),(15,1,'2025-10-30 06:35:28',1,'update',30,9),(16,1,'2025-10-30 06:35:35',1,'update',30,11),(17,1,'2025-10-30 06:35:51',1,'update',30,17),(18,1,'2025-10-30 06:38:02',1,'update',20,2),(19,1,'2025-10-30 06:45:18',1,'update',0,5),(20,1,'2025-10-30 06:45:29',1,'update',0,5);
/*!40000 ALTER TABLE `accessoryHistory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `accessoryItems`
--

DROP TABLE IF EXISTS `accessoryItems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accessoryItems` (
  `_id` int NOT NULL AUTO_INCREMENT,
  `accessoryID` int NOT NULL,
  `shopID` int NOT NULL,
  `status` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `quantity` int unsigned DEFAULT NULL,
  `productStatus` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'new stock',
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `transferId` int DEFAULT NULL,
  `confirmedBy` int DEFAULT NULL,
  PRIMARY KEY (`_id`),
  UNIQUE KEY `_id_UNIQUE` (`_id`),
  KEY `fk_accessoryItems_1_idx` (`shopID`),
  KEY `fk_accessoryItems_2_idx` (`accessoryID`),
  KEY `fk_confirmedBy_actor_2` (`confirmedBy`),
  CONSTRAINT `fk_accessoryItems_1` FOREIGN KEY (`shopID`) REFERENCES `shops` (`_id`),
  CONSTRAINT `fk_accessoryItems_2` FOREIGN KEY (`accessoryID`) REFERENCES `accessories` (`_id`),
  CONSTRAINT `fk_confirmedBy_actor_2` FOREIGN KEY (`confirmedBy`) REFERENCES `actors` (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accessoryItems`
--

LOCK TABLES `accessoryItems` WRITE;
/*!40000 ALTER TABLE `accessoryItems` DISABLE KEYS */;
INSERT INTO `accessoryItems` VALUES (1,5,2,'confirmed','2025-10-30 06:00:54',7,'new stock','2025-10-30 06:01:55',1,3),(2,4,2,'confirmed','2025-10-30 06:00:54',2,'new stock','2025-10-30 06:01:58',2,3);
/*!40000 ALTER TABLE `accessoryItems` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `accessorysales`
--

DROP TABLE IF EXISTS `accessorysales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accessorysales` (
  `_id` int NOT NULL AUTO_INCREMENT,
  `productID` int NOT NULL,
  `shopID` int NOT NULL,
  `sellerId` int NOT NULL,
  `soldPrice` decimal(10,2) NOT NULL,
  `status` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'COMPLETED',
  `profit` int unsigned NOT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `commisssionStatus` enum('pending','paid') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` int DEFAULT '0',
  `commission` int DEFAULT '0',
  `categoryId` int DEFAULT NULL,
  `financeStatus` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'paid',
  `financeAmount` int DEFAULT '0',
  `customerId` int DEFAULT NULL,
  `financerId` int DEFAULT NULL,
  `paymentId` int DEFAULT NULL,
  `commissionPaid` int DEFAULT '0',
  PRIMARY KEY (`_id`),
  UNIQUE KEY `_id_UNIQUE` (`_id`),
  KEY `accessorysales_customerId_idx` (`customerId`),
  KEY `accessorysales_financerId_idx` (`financerId`),
  KEY `accessorysales_paymentId_idx` (`paymentId`),
  KEY `fk_accessorysales_1_idx` (`productID`),
  KEY `fk_accessorysales_2_idx` (`sellerId`),
  KEY `fk_accessorysales_3_idx` (`shopID`),
  KEY `fk_accessorysales_category` (`categoryId`),
  KEY `idx_sales_created` (`createdAt`),
  CONSTRAINT `accessorysales_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `accessorysales_financerId_fkey` FOREIGN KEY (`financerId`) REFERENCES `Financer` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `accessorysales_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `Payment` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_accessorysales_1` FOREIGN KEY (`productID`) REFERENCES `accessories` (`_id`),
  CONSTRAINT `fk_accessorysales_2` FOREIGN KEY (`sellerId`) REFERENCES `actors` (`_id`),
  CONSTRAINT `fk_accessorysales_3` FOREIGN KEY (`shopID`) REFERENCES `shops` (`_id`),
  CONSTRAINT `fk_accessorysales_category` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accessorysales`
--

LOCK TABLES `accessorysales` WRITE;
/*!40000 ALTER TABLE `accessorysales` DISABLE KEYS */;
INSERT INTO `accessorysales` VALUES (1,5,2,3,600.00,'COMPLETED',600,'2025-10-30 06:07:13',NULL,1,0,1,'paid',0,1,1,1,0),(2,4,2,3,600.00,'COMPLETED',0,'2025-10-30 06:47:52',NULL,2,0,1,'paid',0,2,1,2,0),(3,4,2,3,1200.00,'COMPLETED',600,'2025-10-30 07:14:01',NULL,2,0,1,'paid',0,3,1,6,0),(4,5,2,3,500.00,'COMPLETED',200,'2025-10-30 07:28:42','paid',1,60,1,'paid',0,2,1,7,60),(5,5,2,3,500.00,'COMPLETED',200,'2025-10-30 07:28:43',NULL,1,60,1,'paid',0,2,1,7,0),(6,5,2,3,1200.00,'COMPLETED',600,'2025-10-30 07:45:42','pending',2,120,1,'paid',0,2,1,8,60),(7,5,2,3,1000.00,'COMPLETED',400,'2025-10-30 07:59:07',NULL,2,120,1,'paid',0,2,1,9,0),(8,5,2,3,500.00,'COMPLETED',200,'2025-10-30 08:00:24','paid',1,60,1,'paid',0,2,1,10,60),(9,4,2,3,1200.00,'COMPLETED',600,'2025-10-30 08:04:09',NULL,2,0,1,'paid',0,2,1,11,0),(10,5,2,3,500.00,'COMPLETED',200,'2025-10-30 08:08:44',NULL,1,60,1,'paid',0,2,1,12,0),(11,4,2,3,500.00,'COMPLETED',200,'2025-10-30 08:16:47',NULL,1,0,1,'paid',0,2,1,13,0),(12,4,2,3,500.00,'COMPLETED',200,'2025-10-30 09:13:37',NULL,1,0,1,'paid',0,2,1,14,0),(13,5,2,3,500.00,'COMPLETED',200,'2025-10-30 11:36:18',NULL,1,60,1,'paid',500,2,1,15,0),(14,5,2,3,500.00,'COMPLETED',200,'2025-10-30 12:20:34',NULL,1,60,1,'pending',500,2,1,16,0),(15,5,2,3,1300.00,'COMPLETED',700,'2025-10-31 17:54:53',NULL,2,120,1,'paid',0,2,1,17,0);
/*!40000 ALTER TABLE `accessorysales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `accessorytransferhistory`
--

DROP TABLE IF EXISTS `accessorytransferhistory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accessorytransferhistory` (
  `_id` int NOT NULL AUTO_INCREMENT,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `fromshop` int NOT NULL,
  `toshop` int NOT NULL,
  `status` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `type` enum('distribution','transfer') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `productID` int NOT NULL,
  `confirmedBy` int DEFAULT NULL,
  `transferdBy` int DEFAULT NULL,
  `quantity` int unsigned DEFAULT NULL,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`_id`),
  UNIQUE KEY `_id_UNIQUE` (`_id`),
  KEY `fk_accessorytransferhistory_1_idx` (`productID`),
  KEY `fk_accessorytransferhistory_2_idx` (`fromshop`),
  KEY `fk_accessorytransferhistory_3_idx` (`toshop`),
  KEY `fk_confirmedBy_actor` (`confirmedBy`),
  KEY `fk_transferdBy_actor` (`transferdBy`),
  CONSTRAINT `fk_accessorytransferhistory_1` FOREIGN KEY (`productID`) REFERENCES `accessories` (`_id`),
  CONSTRAINT `fk_accessorytransferhistory_2` FOREIGN KEY (`fromshop`) REFERENCES `shops` (`_id`),
  CONSTRAINT `fk_accessorytransferhistory_3` FOREIGN KEY (`toshop`) REFERENCES `shops` (`_id`),
  CONSTRAINT `fk_confirmedBy_actor` FOREIGN KEY (`confirmedBy`) REFERENCES `actors` (`_id`),
  CONSTRAINT `fk_transferdBy_actor` FOREIGN KEY (`transferdBy`) REFERENCES `actors` (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accessorytransferhistory`
--

LOCK TABLES `accessorytransferhistory` WRITE;
/*!40000 ALTER TABLE `accessorytransferhistory` DISABLE KEYS */;
INSERT INTO `accessorytransferhistory` VALUES (1,'2025-10-30 06:00:54',1,2,'confirmed','distribution',5,3,1,20,'2025-10-30 06:01:55'),(2,'2025-10-30 06:00:54',1,2,'confirmed','distribution',4,3,1,10,'2025-10-30 06:01:58');
/*!40000 ALTER TABLE `accessorytransferhistory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `actors`
--

DROP TABLE IF EXISTS `actors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `actors` (
  `_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nextofkinname` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nextofkinphonenumber` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workingstatus` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT 'inactive',
  `phone` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT 'seller',
  `Idimagebackward` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'https://www.linkedin.com/default_profile_picture.png',
  `Idimagefront` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'https://www.linkedin.com/default_profile_picture.png',
  `profileimage` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'https://www.linkedin.com/default_profile_picture.png',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `baseSalary` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`_id`),
  UNIQUE KEY `_id_UNIQUE` (`_id`),
  UNIQUE KEY `actors_email_key` (`email`),
  UNIQUE KEY `actors_phone_key` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `actors`
--

LOCK TABLES `actors` WRITE;
/*!40000 ALTER TABLE `actors` DISABLE KEYS */;
INSERT INTO `actors` VALUES (1,'Timothy Joseph Kimilu','NA','NA','$2a$10$xGzLL.WODRXKfLrWIiWKtOjUBYfk3pkAWslxl0PRsDTgdOniI2Fri','timothyjoseph8580@gmail.com','active','0757174430','superuser','https://www.linkedin.com/default_profile_picture.png','https://www.linkedin.com/default_profile_picture.png','https://www.linkedin.com/default_profile_picture.png','2025-08-11 16:06:17',NULL),(3,'Kimani Kinoti','Timothy Joseph','0713703212','$2a$10$f216fsGEAM1.BbZ4I/QUwuOSrej6SLA1kco19xI/rgnRkVQGgXspW','kimani@gmail.com','active','0725892386','seller','https://www.linkedin.com/default_profile_picture.png','https://www.linkedin.com/default_profile_picture.png','https://www.linkedin.com/default_profile_picture.png','2025-10-30 05:59:47',NULL),(4,'Antony Kimemia','Timothy Kimemia','075645352','$2a$10$kCUxkIJehWEFMHLXe3zCmuiQJyUayF4CcCo7zvbCVXu7S.yCnuptu','kimemia@gmail.com','active','07574637284','manager','https://www.linkedin.com/default_profile_picture.png','https://www.linkedin.com/default_profile_picture.png','https://www.linkedin.com/default_profile_picture.png','2025-10-31 17:59:39',NULL),(5,'Pope Mutuku','Amboselli Mutuku','0754635264','$2a$10$znDPLPDWwXpoehLyCc48OeJkpoW/Dn/LnhTd1Mut028zkQHAcxEZ6','pope@gmail.com','active','07564636886','seller','https://www.linkedin.com/default_profile_picture.png','https://www.linkedin.com/default_profile_picture.png','https://www.linkedin.com/default_profile_picture.png','2025-10-31 18:08:36',NULL),(6,'Alex Otieno ','Alex ','0765432167','$2a$10$Nm4AXCFs9mBwAaPlgAA5HOe8QrBKK3xunG..tE1oVquV3W..EHj0S','problem256@gmail.com','active','0754324789','seller','https://www.linkedin.com/default_profile_picture.png','https://www.linkedin.com/default_profile_picture.png','https://www.linkedin.com/default_profile_picture.png','2025-10-31 18:23:18',NULL);
/*!40000 ALTER TABLE `actors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `assignment`
--

DROP TABLE IF EXISTS `assignment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assignment` (
  `_id` int NOT NULL AUTO_INCREMENT,
  `userID` int NOT NULL,
  `shopID` int NOT NULL,
  `fromDate` datetime NOT NULL,
  `toDate` datetime NOT NULL,
  `status` enum('assigned','removed') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`_id`),
  UNIQUE KEY `_id_UNIQUE` (`_id`),
  KEY `fk_assignment_1_idx` (`shopID`),
  KEY `fk_assignment_2_idx` (`userID`),
  CONSTRAINT `fk_assignment_1` FOREIGN KEY (`shopID`) REFERENCES `shops` (`_id`),
  CONSTRAINT `fk_assignment_2` FOREIGN KEY (`userID`) REFERENCES `actors` (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assignment`
--

LOCK TABLES `assignment` WRITE;
/*!40000 ALTER TABLE `assignment` DISABLE KEYS */;
INSERT INTO `assignment` VALUES (1,3,2,'2025-10-30 00:00:00','2025-11-07 00:00:00','assigned','2025-10-30 03:00:13'),(2,5,3,'2025-10-31 00:00:00','2025-11-06 00:00:00','assigned','2025-10-31 15:09:05');
/*!40000 ALTER TABLE `assignment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `_id` int NOT NULL AUTO_INCREMENT,
  `itemName` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `itemModel` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `minPrice` int NOT NULL,
  `itemType` enum('mobiles','accessories') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `brand` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'unknown',
  `maxPrice` int NOT NULL,
  `category` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('DELETED','AVAILABLE','SUSPENDED','MODIFIED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AVAILABLE',
  PRIMARY KEY (`_id`),
  UNIQUE KEY `_id_UNIQUE` (`_id`),
  UNIQUE KEY `itemModel_UNIQUE` (`itemModel`),
  UNIQUE KEY `itemName_UNIQUE` (`itemName`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Samsung 25W charger','25W',500,'accessories','samsung',600,'accessories','AVAILABLE'),(2,'samsung 45wats','45watts',700,'accessories','samsung',800,'accessories','AVAILABLE'),(3,'Samsung A05S','AO5s',15000,'mobiles','Samsung',16000,'mobiles','AVAILABLE'),(4,'Samsung A16S','A16s',17000,'mobiles','samsung',18000,'mobiles','AVAILABLE');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mobileHistory`
--

DROP TABLE IF EXISTS `mobileHistory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mobileHistory` (
  `_id` int NOT NULL AUTO_INCREMENT,
  `addedBy` int NOT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `shopId` int NOT NULL,
  `type` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'new stock',
  `productID` int NOT NULL,
  `sellerId` int DEFAULT NULL,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`_id`),
  KEY `fk_mobileHistory_1_idx` (`productID`),
  KEY `fk_mobileHistory_2_idx` (`addedBy`),
  KEY `fk_mobileHistory_3_idx` (`shopId`),
  KEY `fk_mobileHistory_seller` (`sellerId`),
  CONSTRAINT `fk_mobileHistory_1` FOREIGN KEY (`productID`) REFERENCES `mobiles` (`_id`),
  CONSTRAINT `fk_mobileHistory_2` FOREIGN KEY (`addedBy`) REFERENCES `actors` (`_id`),
  CONSTRAINT `fk_mobileHistory_3` FOREIGN KEY (`shopId`) REFERENCES `shops` (`_id`),
  CONSTRAINT `fk_mobileHistory_seller` FOREIGN KEY (`sellerId`) REFERENCES `actors` (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mobileHistory`
--

LOCK TABLES `mobileHistory` WRITE;
/*!40000 ALTER TABLE `mobileHistory` DISABLE KEYS */;
INSERT INTO `mobileHistory` VALUES (1,4,'2025-10-31 18:02:58',1,'new stock',1,NULL,'2025-10-31 18:02:58'),(2,4,'2025-10-31 18:03:04',1,'new stock',2,NULL,'2025-10-31 18:03:04'),(3,4,'2025-10-31 18:03:08',1,'new stock',3,NULL,'2025-10-31 18:03:08'),(4,4,'2025-10-31 18:03:14',1,'new stock',4,NULL,'2025-10-31 18:03:14'),(5,4,'2025-10-31 18:03:20',1,'new stock',6,NULL,'2025-10-31 18:03:20'),(6,4,'2025-10-31 18:03:28',1,'new stock',7,NULL,'2025-10-31 18:03:28'),(7,4,'2025-10-31 18:03:35',1,'new stock',8,NULL,'2025-10-31 18:03:35'),(8,4,'2025-10-31 18:03:39',1,'new stock',9,NULL,'2025-10-31 18:03:39'),(9,4,'2025-10-31 18:03:51',1,'new stock',10,NULL,'2025-10-31 18:03:51'),(10,4,'2025-10-31 18:06:24',1,'new stock',11,NULL,'2025-10-31 18:06:24'),(11,4,'2025-10-31 18:06:31',1,'new stock',12,NULL,'2025-10-31 18:06:31'),(12,4,'2025-10-31 18:06:38',1,'new stock',13,NULL,'2025-10-31 18:06:38'),(13,4,'2025-10-31 18:06:42',1,'new stock',14,NULL,'2025-10-31 18:06:42'),(14,4,'2025-10-31 18:06:47',1,'new stock',16,NULL,'2025-10-31 18:06:47'),(15,4,'2025-10-31 18:06:50',1,'new stock',17,NULL,'2025-10-31 18:06:50'),(16,4,'2025-10-31 18:06:53',1,'new stock',18,NULL,'2025-10-31 18:06:53'),(17,4,'2025-10-31 18:06:59',1,'new stock',20,NULL,'2025-10-31 18:06:59'),(18,4,'2025-10-31 18:07:10',1,'new stock',23,NULL,'2025-10-31 18:07:10'),(19,4,'2025-10-31 18:07:15',1,'new stock',25,NULL,'2025-10-31 18:07:15'),(20,4,'2025-10-31 18:07:18',1,'new stock',27,NULL,'2025-10-31 18:07:18'),(21,4,'2025-10-31 18:10:57',1,'update',25,NULL,'2025-10-31 18:10:57'),(22,4,'2025-10-31 18:12:04',1,'update',11,NULL,'2025-10-31 18:12:04');
/*!40000 ALTER TABLE `mobileHistory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mobileItems`
--

DROP TABLE IF EXISTS `mobileItems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mobileItems` (
  `_id` int NOT NULL AUTO_INCREMENT,
  `mobileID` int NOT NULL,
  `shopID` int NOT NULL,
  `status` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `confirmedBy` int DEFAULT NULL,
  `transferId` int DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `productStatus` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'new stock',
  `quantity` int unsigned DEFAULT '0',
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`_id`),
  UNIQUE KEY `_id_UNIQUE` (`_id`),
  KEY `fk_mobileItems_1_idx` (`shopID`),
  KEY `fk_mobileItems_2_idx` (`mobileID`),
  KEY `fk_mobileItems_confirmedBy` (`confirmedBy`),
  CONSTRAINT `fk_mobileItems_1` FOREIGN KEY (`shopID`) REFERENCES `shops` (`_id`),
  CONSTRAINT `fk_mobileItems_2` FOREIGN KEY (`mobileID`) REFERENCES `mobiles` (`_id`),
  CONSTRAINT `fk_mobileItems_confirmedBy` FOREIGN KEY (`confirmedBy`) REFERENCES `actors` (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mobileItems`
--

LOCK TABLES `mobileItems` WRITE;
/*!40000 ALTER TABLE `mobileItems` DISABLE KEYS */;
INSERT INTO `mobileItems` VALUES (1,10,3,'sold',5,1,'2025-10-31 18:09:54','new stock',0,'2025-10-31 18:16:07'),(2,9,3,'confirmed',5,2,'2025-10-31 18:09:54','new stock',1,'2025-10-31 18:16:07'),(3,8,3,'confirmed',5,3,'2025-10-31 18:09:55','new stock',1,'2025-10-31 18:16:07'),(4,7,3,'confirmed',5,4,'2025-10-31 18:09:55','new stock',1,'2025-10-31 18:16:07'),(5,6,3,'confirmed',5,5,'2025-10-31 18:09:55','new stock',1,'2025-10-31 18:16:08'),(6,27,3,'sold',5,6,'2025-10-31 18:10:27','new stock',0,'2025-10-31 18:16:08'),(7,25,3,'confirmed',5,7,'2025-10-31 18:10:27','new stock',1,'2025-10-31 18:16:08'),(8,23,3,'confirmed',5,8,'2025-10-31 18:10:27','new stock',1,'2025-10-31 18:16:08');
/*!40000 ALTER TABLE `mobileItems` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mobiles`
--

DROP TABLE IF EXISTS `mobiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mobiles` (
  `_id` int NOT NULL AUTO_INCREMENT,
  `IMEI` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `batchNumber` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0',
  `availableStock` int unsigned NOT NULL DEFAULT '1',
  `commission` decimal(10,2) NOT NULL DEFAULT '0.00',
  `discount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `productCost` decimal(10,2) NOT NULL,
  `color` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'white',
  `stockStatus` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT 'available',
  `CategoryId` int NOT NULL,
  `barcodePath` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `storage` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phoneType` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `itemType` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT 'mobiles',
  `paymentStatus` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PAID',
  `supplierId` int DEFAULT NULL,
  PRIMARY KEY (`_id`),
  UNIQUE KEY `_id_UNIQUE` (`_id`),
  UNIQUE KEY `IMEI_UNIQUE` (`IMEI`),
  KEY `fk_mobiles_1_idx` (`CategoryId`),
  KEY `mobiles_supplierId_fkey` (`supplierId`),
  CONSTRAINT `fk_mobiles_1` FOREIGN KEY (`CategoryId`) REFERENCES `categories` (`_id`),
  CONSTRAINT `mobiles_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mobiles`
--

LOCK TABLES `mobiles` WRITE;
/*!40000 ALTER TABLE `mobiles` DISABLE KEYS */;
INSERT INTO `mobiles` VALUES (1,'89992385673623','2025-10-26',1,300.00,0.00,13500.00,'black','available',3,NULL,'2025-10-31 18:02:58','4/128GB','smartphone','2025-10-31 18:02:58','mobiles','paid',1),(2,'89992385673626','2025-10-26',1,300.00,0.00,13500.00,'black','available',3,NULL,'2025-10-31 18:03:04','4/128GB','smartphone','2025-10-31 18:03:04','mobiles','paid',1),(3,'89992385673629','2025-10-26',1,300.00,0.00,13500.00,'black','available',3,NULL,'2025-10-31 18:03:08','4/128GB','smartphone','2025-10-31 18:03:08','mobiles','paid',1),(4,'89992385673622','2025-10-26',1,300.00,0.00,13500.00,'black','available',3,NULL,'2025-10-31 18:03:14','4/128GB','smartphone','2025-10-31 18:03:14','mobiles','paid',1),(6,'89992385673625','2025-10-26',0,300.00,0.00,13500.00,'black','distributed',3,NULL,'2025-10-31 18:03:20','4/128GB','smartphone','2025-10-31 18:09:55','mobiles','paid',1),(7,'89992385673624','2025-10-26',0,300.00,0.00,13500.00,'black','distributed',3,NULL,'2025-10-31 18:03:28','4/128GB','smartphone','2025-10-31 18:09:55','mobiles','paid',1),(8,'89992385673667','2025-10-26',0,300.00,0.00,13500.00,'black','distributed',3,NULL,'2025-10-31 18:03:35','4/128GB','smartphone','2025-10-31 18:09:55','mobiles','paid',1),(9,'89992385673668','2025-10-26',0,300.00,0.00,13500.00,'black','distributed',3,NULL,'2025-10-31 18:03:39','4/128GB','smartphone','2025-10-31 18:09:54','mobiles','paid',1),(10,'89992395673668','2025-10-26',0,300.00,0.00,13500.00,'black','sold',3,NULL,'2025-10-31 18:03:51','4/128GB','smartphone','2025-10-31 18:09:54','mobiles','paid',1),(11,'785734636584832','2049-08-23',1,500.00,0.00,15000.00,'yellow','available',4,NULL,'2025-10-31 18:06:24','6/278','smartphone','2025-10-31 18:12:04','mobiles','paid',1),(12,'785734636584834','2049-08-23',1,500.00,0.00,15500.00,'yellow','available',4,NULL,'2025-10-31 18:06:31','6/278','smartphone','2025-10-31 18:06:31','mobiles','paid',1),(13,'785734636684834','2049-08-23',1,500.00,0.00,15500.00,'yellow','available',4,NULL,'2025-10-31 18:06:38','6/278','smartphone','2025-10-31 18:06:38','mobiles','paid',1),(14,'785734636984834','2049-08-23',1,500.00,0.00,15500.00,'yellow','available',4,NULL,'2025-10-31 18:06:42','6/278','smartphone','2025-10-31 18:06:42','mobiles','paid',1),(16,'785734636384834','2049-08-23',1,500.00,0.00,15500.00,'yellow','available',4,NULL,'2025-10-31 18:06:47','6/278','smartphone','2025-10-31 18:06:47','mobiles','paid',1),(17,'785734636184834','2049-08-23',1,500.00,0.00,15500.00,'yellow','available',4,NULL,'2025-10-31 18:06:50','6/278','smartphone','2025-10-31 18:06:50','mobiles','paid',1),(18,'785734636884834','2049-08-23',1,500.00,0.00,15500.00,'yellow','available',4,NULL,'2025-10-31 18:06:53','6/278','smartphone','2025-10-31 18:06:53','mobiles','paid',1),(20,'78573463688483','2049-08-23',1,500.00,0.00,15500.00,'yellow','available',4,NULL,'2025-10-31 18:06:59','6/278','smartphone','2025-10-31 18:06:59','mobiles','paid',1),(23,'785734636884839','2049-08-23',0,500.00,0.00,15500.00,'yellow','distributed',4,NULL,'2025-10-31 18:07:10','6/278','smartphone','2025-10-31 18:10:27','mobiles','paid',1),(25,'885734636884839','2049-08-23',0,500.00,0.00,15500.00,'brown','distributed',4,NULL,'2025-10-31 18:07:15','6/278','smartphone','2025-10-31 18:10:57','mobiles','paid',1),(27,'985734636884839','2049-08-23',0,500.00,0.00,15500.00,'yellow','sold',4,NULL,'2025-10-31 18:07:18','6/278','smartphone','2025-10-31 18:10:27','mobiles','paid',1);
/*!40000 ALTER TABLE `mobiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mobilesales`
--

DROP TABLE IF EXISTS `mobilesales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mobilesales` (
  `_id` int NOT NULL AUTO_INCREMENT,
  `productID` int NOT NULL,
  `shopID` int NOT NULL,
  `sellerId` int NOT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `commisssionStatus` enum('pending','paid') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` int DEFAULT '0',
  `salesType` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'direct',
  `financeStatus` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'captech',
  `financeAmount` int DEFAULT '0',
  `categoryId` int DEFAULT NULL,
  `commission` int DEFAULT '0',
  `profit` int DEFAULT '0',
  `soldPrice` int DEFAULT '0',
  `status` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'COMPLETED',
  `customerId` int DEFAULT NULL,
  `financerId` int DEFAULT NULL,
  `paymentId` int DEFAULT NULL,
  `commissionPaid` int DEFAULT '0',
  PRIMARY KEY (`_id`),
  UNIQUE KEY `_id_UNIQUE` (`_id`),
  KEY `fk_mobileSales_category` (`categoryId`),
  KEY `fk_mobilesales_1_idx` (`productID`),
  KEY `fk_mobilesales_2_idx` (`sellerId`),
  KEY `fk_mobilesales_3_idx` (`shopID`),
  KEY `idx_sales_created` (`createdAt`),
  KEY `idx_sales_finance_status` (`financeStatus`),
  KEY `mobilesales_customerId_idx` (`customerId`),
  KEY `mobilesales_financerId_idx` (`financerId`),
  KEY `mobilesales_paymentId_idx` (`paymentId`),
  CONSTRAINT `fk_mobilesales_1` FOREIGN KEY (`productID`) REFERENCES `mobiles` (`_id`),
  CONSTRAINT `fk_mobilesales_2` FOREIGN KEY (`sellerId`) REFERENCES `actors` (`_id`),
  CONSTRAINT `fk_mobilesales_3` FOREIGN KEY (`shopID`) REFERENCES `shops` (`_id`),
  CONSTRAINT `fk_mobileSales_category` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`_id`),
  CONSTRAINT `mobilesales_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `mobilesales_financerId_fkey` FOREIGN KEY (`financerId`) REFERENCES `Financer` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `mobilesales_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `Payment` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mobilesales`
--

LOCK TABLES `mobilesales` WRITE;
/*!40000 ALTER TABLE `mobilesales` DISABLE KEYS */;
INSERT INTO `mobilesales` VALUES (1,10,3,5,'2025-10-31 18:16:48',NULL,1,'direct','paid',0,3,300,2500,16000,'COMPLETED',2,1,18,0),(2,27,3,5,'2025-10-31 18:18:11','paid',1,'direct','pending',17000,4,500,1500,17000,'COMPLETED',2,1,19,500);
/*!40000 ALTER TABLE `mobilesales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mobiletransferHistory`
--

DROP TABLE IF EXISTS `mobiletransferHistory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mobiletransferHistory` (
  `id` int NOT NULL AUTO_INCREMENT,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `fromshop` int NOT NULL,
  `toshop` int NOT NULL,
  `confirmedBy` int DEFAULT NULL,
  `status` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `type` enum('distribution','transfer','return') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `productID` int DEFAULT NULL,
  `transferdBy` int DEFAULT NULL,
  `quantity` int unsigned DEFAULT '0',
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_mobiletransferhistory_confirmedBy` (`confirmedBy`),
  KEY `fk_mobiletransferhistory_fromshop` (`fromshop`),
  KEY `fk_mobiletransferhistory_mobiles` (`productID`),
  KEY `fk_mobiletransferhistory_toshop` (`toshop`),
  KEY `fk_mobiletransferhistory_transferdBy` (`transferdBy`),
  CONSTRAINT `fk_mobiletransferhistory_confirmedBy` FOREIGN KEY (`confirmedBy`) REFERENCES `actors` (`_id`),
  CONSTRAINT `fk_mobiletransferhistory_fromshop` FOREIGN KEY (`fromshop`) REFERENCES `shops` (`_id`),
  CONSTRAINT `fk_mobiletransferhistory_mobiles` FOREIGN KEY (`productID`) REFERENCES `mobiles` (`_id`),
  CONSTRAINT `fk_mobiletransferhistory_toshop` FOREIGN KEY (`toshop`) REFERENCES `shops` (`_id`),
  CONSTRAINT `fk_mobiletransferhistory_transferdBy` FOREIGN KEY (`transferdBy`) REFERENCES `actors` (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mobiletransferHistory`
--

LOCK TABLES `mobiletransferHistory` WRITE;
/*!40000 ALTER TABLE `mobiletransferHistory` DISABLE KEYS */;
INSERT INTO `mobiletransferHistory` VALUES (1,'2025-10-31 18:09:54',1,3,5,'confirmed','distribution',10,4,1,'2025-10-31 18:16:07'),(2,'2025-10-31 18:09:54',1,3,5,'confirmed','distribution',9,4,1,'2025-10-31 18:16:08'),(3,'2025-10-31 18:09:55',1,3,5,'confirmed','distribution',8,4,1,'2025-10-31 18:16:08'),(4,'2025-10-31 18:09:55',1,3,5,'confirmed','distribution',7,4,1,'2025-10-31 18:16:08'),(5,'2025-10-31 18:09:55',1,3,5,'confirmed','distribution',6,4,1,'2025-10-31 18:16:08'),(6,'2025-10-31 18:10:27',1,3,5,'confirmed','distribution',27,4,1,'2025-10-31 18:16:08'),(7,'2025-10-31 18:10:27',1,3,5,'confirmed','distribution',25,4,1,'2025-10-31 18:16:08'),(8,'2025-10-31 18:10:27',1,3,5,'confirmed','distribution',23,4,1,'2025-10-31 18:16:08');
/*!40000 ALTER TABLE `mobiletransferHistory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `session_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires` int unsigned NOT NULL,
  `data` mediumtext COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shops`
--

DROP TABLE IF EXISTS `shops`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shops` (
  `_id` int NOT NULL AUTO_INCREMENT,
  `shopName` varchar(25) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(25) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`_id`),
  UNIQUE KEY `_id_UNIQUE` (`_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shops`
--

LOCK TABLES `shops` WRITE;
/*!40000 ALTER TABLE `shops` DISABLE KEYS */;
INSERT INTO `shops` VALUES (1,'WareHouse','Kiambu 26'),(2,'South B','South B'),(3,'Donholm Outlet','Savannah');
/*!40000 ALTER TABLE `shops` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-31 22:55:24
