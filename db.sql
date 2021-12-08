create schema if not exists findnearbyplaces;

drop table if exists findnearbyplaces.place;
create table findnearbyplaces.place
(
    id bigserial primary key,
    name text not null,
    latitude numeric not null,
    description text not null,
    category_id int not null references findnearbyplaces.category(id),
    customer_id int not null references findnearbyplaces.customer(id)
);

drop table if exists findnearbyplaces.category;
create table findnearbyplaces.category
(
    id bigserial primary key,
    name text not null
);

drop table if exists findnearbyplaces.customer;
create table findnearbyplaces.customer
(
    id bigserial primary key,
    email text not null unique,
    password text not null
);

drop table if exists findnearbyplaces.reviews;
create table findnearbyplaces.reviews
(
    location_id int not null references findnearbyplaces.place(id),
    customer_id int not null references findnearbyplaces.customer(id),
    id bigserial primary key,
    text text not null,
    rating int not null
);

drop table if exists findnearbyplaces.photo;
create table findnearbyplaces.photo
(
    id bigserial primary key,
    file text not null
);

drop table if exists findnearbyplaces.place_photo;
create table findnearbyplaces.place_photo
(
    location_id int not null references findnearbyplaces.place(id),
    photo_id int not null references findnearbyplaces.photo(id)
);

drop table if exists findnearbyplaces.review_photo;
create tbale findnearbyplaces.review_photo
(
    review_id int not null references findnearbyplaces.reviews(id),
    photo_id int not null references findnearbyplaces.photo(id)
);