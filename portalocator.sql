-- Drop tables if they already exist
DROP TABLE IF EXISTS portapotties;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(100) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL
);

-- Create portapotties table
CREATE TABLE portapotties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    rating INT NOT NULL,
    x DOUBLE NOT NULL,
    y DOUBLE NOT NULL,
    votes INT DEFAULT 0,
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES users(id) -- keep relationship
);

-- Insert user
INSERT INTO users (username, password, first_name, last_name)
VALUES 
	('dkeller', 'mypassword123', 'Declan', 'Keller'),
	('kmiller', 'mypassword1234', 'Kaiden', 'Miller');

-- Insert porta potty (linked to user with id=1)
INSERT INTO portapotties (user_id, name, description, rating, x, y)
VALUES 
    (1, 'Blue PortaPotty', 'Located near the park entrance', 4, 40.12345, -76.54321), 
    (1, 'Yellow PortaPotty', 'Close to the main parking lot', 2, 40.98765, -76.33333);