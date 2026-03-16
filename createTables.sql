-- -----------------------------------------------------
-- Table `users`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `users` ;

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(45) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `fname` VARCHAR(45) NULL,
  `lname` VARCHAR(45) NULL,
  PRIMARY KEY (`id`))


-- -----------------------------------------------------
-- Table `porta_potties`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `porta_potties` ;

CREATE TABLE IF NOT EXISTS `porta_potties` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  `latitude` VARCHAR(100) NOT NULL,
  `longitude` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `rating` INT NULL,
  `createdBy` INT NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_potties_users_id_idx` (`createdBy` ASC) VISIBLE,
  CONSTRAINT `fk_potties_users_id`
    FOREIGN KEY (`createdBy`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)


-- -----------------------------------------------------
-- Table `votes`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `votes` ;

CREATE TABLE IF NOT EXISTS `votes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `voteType` TINYINT(1) NOT NULL,
  `createdAt` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `userId` INT NOT NULL,
  `portaPottyId` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_votes_users_id_idx` (`userId` ASC) VISIBLE,
  INDEX `fk_votes_porta_potties_id_idx` (`portaPottyId` ASC) VISIBLE,
  UNIQUE INDEX `unique_vote` (`userId` ASC, `portaPottyId` ASC) VISIBLE,
  CONSTRAINT `fk_upvotes_users_id`
    FOREIGN KEY (`userId`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_upvotes_porta_potties_id`
    FOREIGN KEY (`portaPottyId`)
    REFERENCES `porta_potties` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)