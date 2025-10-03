CREATE TABLE user (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255),
    password_hash VARCHAR(255),
    email VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE session (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id)
);

CREATE TABLE records (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NULL,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE record_fields (
    field_id INT AUTO_INCREMENT PRIMARY KEY,
    record_id INT,
    field_name CHAR(1),
    field_action ENUM ('YES', 'NO') DEFAULT NULL,
    FOREIGN KEY (record_id) REFERENCES records (record_id) ON DELETE CASCADE
);

CREATE TABLE record_images (
    image_id INT AUTO_INCREMENT PRIMARY KEY,
    record_id INT,
    image_number INT,
    image_url VARCHAR(255),
    FOREIGN KEY (record_id) REFERENCES records (record_id) ON DELETE CASCADE
);