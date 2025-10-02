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

-- Create portapotties table with rating constraint
CREATE TABLE portapotties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 10),
    x DOUBLE NOT NULL,
    y DOUBLE NOT NULL,
    votes INT DEFAULT 0,
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert users
INSERT INTO users (username, password, first_name, last_name)
VALUES
    ('dkeller', 'mypassword123', 'Declan', 'Keller'),
    ('kmiller', 'mypassword1234', 'Kaiden', 'Miller'),
    ('escholes', 'declanisfat', 'Ella',   'Scholes'),
    ('alangley', 'iloveella', 'Alyssa', 'Langley');
    ('afrist', 'peepeepoopoo13', 'Aaron', 'Frist');
    ('msmith', 'aaronismydaddy', 'Math', 'Smith');
    

-- Insert porta potties (user_id values refer to the users inserted above)
INSERT INTO portapotties (user_id, name, description, rating, x, y)
VALUES
    (1, 'Blue PortaPotty', 'Located near the park entrance', 4, 40.12345, -76.54321),
    (2, 'Yellow PortaPotty', 'Close to the main parking lot', 2, 40.98765, -76.33333),
    (3, 'Blue Balloon Bench', 'Under the old oak tree near Pavilion C', 9, 40.98810, -76.33300),
    (4, 'Pink Flamingo Stand', 'Just east of the food trucks area', 2, 40.98750, -76.33280),
    (1, 'Rainbow Gazebo', 'Beside the small pond near Path A', 7, 40.98780, -76.33350),
    (2, 'Giggly Gazebo', 'Near the kids'' playground, facing the field', 6, 40.98730, -76.33310),
    (3, 'Sparkle Shade', 'Under the big elm, between tents B and D', 2, 40.98760, -76.33320),
    (4, 'Whispering Willow', 'Next to the winding path behind Pavilion A', 7, 40.98800, -76.33360);
