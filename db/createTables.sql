SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `votes`;
DROP TABLE IF EXISTS `porta_potties`;
DROP TABLE IF EXISTS `users`;

-- -----------------------------------------------------
-- Table `users` - slimmed down, WorkOS handles auth
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) NOT NULL,  -- WorkOS user.id (e.g. "user_01ABC...")
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `theme` VARCHAR(10) DEFAULT 'light',
  PRIMARY KEY (`id`)
);


-- -----------------------------------------------------
-- Table `porta_potties`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `porta_potties` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  `latitude` DECIMAL(10, 8) NOT NULL,
  `longitude` DECIMAL(11, 8) NOT NULL,
  `description` TEXT NULL,
  `rating` INT NULL,
  `isPrivate` TINYINT(1) NULL,
  `isAccessible` TINYINT(1) NULL,
  `hasWomensProducts` TINYINT(1) NULL,
  `createdBy` VARCHAR(64) NOT NULL,  -- WorkOS user.id
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_potties_users_id_idx` (`createdBy` ASC),
  CONSTRAINT `fk_potties_users_id`
    FOREIGN KEY (`createdBy`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);


-- -----------------------------------------------------
-- Table `votes`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `votes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `voteType` TINYINT(1) NOT NULL,
  `portaPottyId` INT NOT NULL,
  `createdBy` VARCHAR(64) NOT NULL,  -- WorkOS user.id
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_votes_users_id_idx` (`createdBy` ASC),
  INDEX `fk_votes_porta_potties_id_idx` (`portaPottyId` ASC),
  UNIQUE INDEX `unique_vote` (`createdBy`, `portaPottyId`),
  CONSTRAINT `fk_upvotes_users_id`
    FOREIGN KEY (`createdBy`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_upvotes_porta_potties_id`
    FOREIGN KEY (`portaPottyId`)
    REFERENCES `porta_potties` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

SET FOREIGN_KEY_CHECKS = 1;