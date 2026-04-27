-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: prospectus_module
-- ------------------------------------------------------
-- Server version	9.5.0

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
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ 'b81d17d3-e73c-11f0-bf6b-04d4c47a061e:1-48';

--
-- Table structure for table `mt_languages`
--

DROP TABLE IF EXISTS `mt_languages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mt_languages` (
  `language_id` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `language_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `native_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direction` enum('LTR','RTL') COLLATE utf8mb4_unicode_ci DEFAULT 'LTR',
  `is_active` tinyint DEFAULT '1',
  `sort_order` int DEFAULT '0',
  PRIMARY KEY (`language_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mt_languages`
--

LOCK TABLES `mt_languages` WRITE;
/*!40000 ALTER TABLE `mt_languages` DISABLE KEYS */;
INSERT INTO `mt_languages` VALUES ('AR','Arabic','العربية','RTL',1,6),('BN','Bengali','বাংলা','LTR',1,23),('DA','Danish','Dansk','LTR',1,20),('DE','German','Deutsch','LTR',1,11),('EN','English','English','LTR',1,1),('ES','Spanish','Español','LTR',1,9),('FA','Farsi/Persian','فارسی','RTL',1,32),('FI','Finnish','Suomi','LTR',1,22),('FR','French','Français','LTR',1,10),('GU','Gujarati','ગુજરાતી','LTR',1,25),('HE','Hebrew','עברית','RTL',1,33),('HI','Hindi','हिन्दी','LTR',1,2),('ID','Indonesian','Bahasa Indonesia','LTR',1,35),('IT','Italian','Italiano','LTR',1,15),('JA','Japanese','日本語','LTR',1,5),('KN','Kannada','ಕನ್ನಡ','LTR',1,28),('KO','Korean','한국어','LTR',1,14),('ML','Malayalam','മലയാളം','LTR',1,29),('MR','Marathi','मराठी','LTR',1,24),('MS','Malay','Bahasa Melayu','LTR',1,3),('NL','Dutch','Nederlands','LTR',1,17),('NO','Norwegian','Norsk','LTR',1,21),('PA','Punjabi','ਪੰਜਾਬੀ','LTR',1,30),('PL','Polish','Polski','LTR',1,18),('PT','Portuguese','Português','LTR',1,12),('RU','Russian','Русский','LTR',1,13),('SV','Swedish','Svenska','LTR',1,19),('TA','Tamil','தமிழ்','LTR',1,26),('TE','Telugu','తెలుగు','LTR',1,27),('TH','Thai','ภาษาไทย','LTR',1,4),('TR','Turkish','Türkçe','LTR',1,16),('UR','Urdu','اردو','RTL',1,31),('VI','Vietnamese','Tiếng Việt','LTR',1,34),('ZH_CN','Chinese (Simplified)','中文(简体)','LTR',1,7),('ZH_TW','Chinese (Traditional)','中文(繁體)','LTR',1,8);
/*!40000 ALTER TABLE `mt_languages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mt_sources`
--

DROP TABLE IF EXISTS `mt_sources`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mt_sources` (
  `source_id` int NOT NULL AUTO_INCREMENT,
  `source_key` varchar(50) NOT NULL,
  `icon` varchar(100) DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`source_id`),
  UNIQUE KEY `source_key` (`source_key`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mt_sources`
--

LOCK TABLES `mt_sources` WRITE;
/*!40000 ALTER TABLE `mt_sources` DISABLE KEYS */;
INSERT INTO `mt_sources` VALUES (1,'INSTAGRAM',NULL,1,1),(2,'FACEBOOK',NULL,2,1),(3,'LINKEDIN',NULL,3,1),(4,'TWITTER_X',NULL,4,1),(5,'YOUTUBE',NULL,5,1),(6,'GOOGLE_ADS',NULL,6,1),(7,'WHATSAPP',NULL,7,1),(8,'CAMPAIGN_EMAIL',NULL,8,1),(9,'CAMPAIGN_SMS',NULL,9,1),(10,'REFERRAL',NULL,10,1),(11,'WALK_IN',NULL,11,1),(12,'WEBSITE',NULL,12,1),(13,'COLD_CALL',NULL,13,1),(14,'EVENT',NULL,14,1),(15,'PARTNER',NULL,15,1),(16,'OTHER',NULL,16,1);
/*!40000 ALTER TABLE `mt_sources` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mt_stages`
--

DROP TABLE IF EXISTS `mt_stages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mt_stages` (
  `stage_code` int NOT NULL,
  `stage_key` varchar(50) NOT NULL,
  `sort_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`stage_code`),
  UNIQUE KEY `stage_key` (`stage_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mt_stages`
--

LOCK TABLES `mt_stages` WRITE;
/*!40000 ALTER TABLE `mt_stages` DISABLE KEYS */;
INSERT INTO `mt_stages` VALUES (1,'PENDING',1,1),(2,'CONTACTED',2,1),(3,'INTERESTED',3,1),(4,'QUALIFIED',4,1),(5,'CONVERTED',5,1),(6,'DROPPED',6,1),(7,'HOLD',7,1),(8,'DEFERRED',8,1);
/*!40000 ALTER TABLE `mt_stages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mt_stages_translation`
--

DROP TABLE IF EXISTS `mt_stages_translation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mt_stages_translation` (
  `stage_code` int NOT NULL,
  `lang_id` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stage_in_lang` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`stage_code`,`lang_id`),
  KEY `lang_id` (`lang_id`),
  CONSTRAINT `mt_stages_translation_ibfk_1` FOREIGN KEY (`stage_code`) REFERENCES `mt_stages` (`stage_code`),
  CONSTRAINT `mt_stages_translation_ibfk_2` FOREIGN KEY (`lang_id`) REFERENCES `mt_languages` (`language_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mt_stages_translation`
--

LOCK TABLES `mt_stages_translation` WRITE;
/*!40000 ALTER TABLE `mt_stages_translation` DISABLE KEYS */;
INSERT INTO `mt_stages_translation` VALUES (1,'EN','Pending'),(1,'HI','लंबित'),(1,'JA','保留中'),(1,'MS','Belum Selesai'),(1,'TH','รอดำเนินการ'),(2,'EN','Contacted'),(2,'HI','संपर्क किया'),(2,'JA','連絡済み'),(2,'MS','Dihubungi'),(2,'TH','ติดต่อแล้ว'),(3,'EN','Interested'),(3,'HI','इच्छुक'),(3,'JA','興味あり'),(3,'MS','Berminat'),(3,'TH','สนใจ'),(4,'EN','Qualified'),(4,'HI','योग्य'),(4,'JA','適格'),(4,'MS','Layak'),(4,'TH','มีคุณสมบัติ'),(5,'EN','Converted'),(5,'HI','परिवर्तित'),(5,'JA','転換済み'),(5,'MS','Ditukar'),(5,'TH','แปลงแล้ว'),(6,'EN','Dropped'),(6,'HI','हटाया गया'),(6,'JA','離脱'),(6,'MS','Digugurkan'),(6,'TH','ยกเลิก'),(7,'EN','Hold'),(7,'HI','रोका गया'),(7,'JA','保留'),(7,'MS','Ditangguh'),(7,'TH','พักไว้'),(8,'EN','Deferred'),(8,'HI','स्थगित'),(8,'JA','延期'),(8,'MS','Ditangguhkan'),(8,'TH','เลื่อนออกไป');
/*!40000 ALTER TABLE `mt_stages_translation` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-28  0:25:40
