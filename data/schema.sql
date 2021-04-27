DROP TABLE IF EXISTS table1;

CREATE TABLE table1 (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    price VARCHAR(255),
    image VARCHAR(255),
    description VARCHAR(500)
)