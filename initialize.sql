CREATE EXTENSION IF NOT EXISTS postgis; --enabling postgis

CREATE TABLE IF NOT EXISTS users ( --db for user login info
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS keypoints ( --db for locations/rooms
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    geom GEOMETRY(Point, 4326) -- SRID 4326 = standard GPS
);

INSERT INTO keypoints (name, geom) 
VALUES ('PFT', ST_SetSRID(ST_MakePoint(-91.1794, 30.4076), 4326));