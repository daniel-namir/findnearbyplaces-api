const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require("dotenv").config();

const connectionString = 
`postgres://${process.env.DATABASEUSERNAME}:${process.env.DATABASEPASSWORD}@${process.env.HOST}:${process.env.DATABASEPORT}/${process.env.DATABASE}`;

const connection = {
    connectionString: process.env.DATABASE_URL ? process.env.DATABASE_URL : connectionString,
    ssl: { rejectUnauthorized: false }
}

const pool = new Pool(connection);

let search = (search_term, user_location, radius_filter, maximum_results_to_return, category_filter, sort) => {
    let sql = '';
    sql += `SELECT * FROM findnearbyplaces.place WHERE name LIKE ${search_term}`;
    if (radius_filter != null) {
        sql += `AND SQRT(square(latitude) - (SELECT latitude FROM findnearbyplaces.place WHERE name = ${user_location}))
        + square(longitude - (SELECT longitude FROM findnearbyplaces.place WHERE name = ${user_location}))) <= ${radius_filter}`;
    }
    if (category_filter != null) {
        sql += ` AND category_id = (SELECT id from findnearbyplaces.category WHERE name = ${category_filter})`;
    }
    if (maximum_results_to_return != null) {
        sql += ` LIMIT ${maximum_results_to_return},`;
    }
    return pool.query(sql);
}

let setCustomer = (email, password) => {
    const salt = bcrypt.genSaltSync(9);
    const hashedPassword = bcrypt.hashSync(password, salt);
    return pool.query('insert into findnearbyplaces.customer(email, password) values ($1, $2)', [email.toLowerCase(), hashedPassword]);
}

let addPlace = (name, category_id, latitude, longitude, description) => {
    return pool.query(`INSERT into findnearbyplaces.place(name, category_id, latitude, longitude, description, customer_id) VALUES ($1, $2, $3, $4, $5, $6)`, 
    [name, category_id, latitude, longitude, description, 1])
    .then(x => {
        return pool.query(`SELECT id FROM findnearbyplaces.place WHERE name = $1 AND latitude = $2 AND longitude = $3`, [name, latitude, longitude])
        .then(x => {
            return x.rows[0].id;
        })
    })
    .catch(e => {
        return e;
    })
}

let addPhoto = (photo,place_id,review_id) => {
    pool.query(`INSERT into findnearbyplaces.photo(file) VALUES (${photo})`);
    if (place_id != null) {
        return pool.query(`INSERT into findnearbyplaces.place_photo(location_id,photo_id) VALUES (${place_id},
            (SELECT id FROM findnearbyplaces.photo WHERE file = ${photo}))`);
    }
    if (review_id != null) {
        return pool.query(`INSERT into findnearbyplaces.review_photo(review_id,photo_id) VALUES (${review_id},
            (SELECT id FROM findnearbyplaces.photo WHERE file = ${photo}))`);
    }
}

let addCategory = (category) => {
    return pool.query(`INSERT into findnearbyplaces.category(name) VALUES ($1)`, [category])
    .then(x => {
        return pool.query(`SELECT id FROM findnearbyplaces.category WHERE name = $1`, [category])
        .then(x => {
            return x.rows[0].id;
        })
    })
    .catch(e => {
        return e;
    })
}

let addReview = (place_id, comment, rating) => {
    return pool.query(`INSERT into findnearbyplaces.reviews(location_id, customer_id, comment, rating) VALUES ($1, $2, $3, $4)`, [place_id, 1, comment, rating])
    .then(x => {
        return pool.query(`SELECT id FROM findnearbyplaces.reviews WHERE location_id = $1 AND comment = $2 and rating = $3`, [place_id, comment, rating])
        .then(x => {
            return x.rows[0].id;
        })
    })
    .catch(e => {
        return e;
    })
}

let updatePlace = (place_id, name, category_id, latitude, longitude, description) => {
    if (name != null) {
        pool.query(`UPDATE findnearbyplaces.place SET name = ${name} WHERE id = ${place_id};`)
        .catch(e => {
            return true;
        })
    }
    if (category_id != null) {
        pool.query(`UPDATE findnearbyplaces.place SET category_id = ${category_id} WHERE id = ${place_id};`)
        .catch(e => {
            return true;
        })
    }
    if (latitude != null) {
        pool.query(`UPDATE findnearbyplaces.place SET latitude = ${latitude} WHERE id = ${place_id};`)
        .catch(e => {
            return true;
        })
    }
    if (longitude != null) {
        pool.query(`UPDATE findnearbyplaces.place SET longitude = ${longitude} WHERE id = ${place_id};`)
        .catch(e => {
            return true;
        })
    }
    if (description != null) {
        pool.query(`UPDATE findnearbyplaces.place SET description = ${description} WHERE id = ${place_id};`)
        .catch(e => {
            return true;
        })
    }
    return false;
}

let updateReview = (review_id, comment, rating) => {
    if (comment != null) {
        pool.query(`UPDATE findnearbyplaces.reviews SET comment = ${comment} WHERE id = ${review_id};`)
        .catch(e => {
            return true;
        })
    }
    if (rating != null) {
        pool.query(`UPDATE findnearbyplaces.reviews SET rating = ${rating} WHERE id = ${review_id};`)
        .catch(e => {
            return true;
        })
    }
    return false;
}

let updatePhoto = (photo_id, photo) => {
    if (photo != null) {
        pool.query(`UPDATE findnearbyplaces.photo SET photo = ${photo} WHERE id = ${photo_id};`)
        .catch(e => {
            return true;
        })
    }
    return false;
}

let deletePlace = (place_id) => {
    return pool.query(`DELETE FROM findnearbyplaces.reviews WHERE location_id = $1`, [place_id])
    .then(x => {
        return pool.query(`DELETE FROM findnearbyplaces.place WHERE id = $1`, [place_id]);
    })
}

let deleteReview = (review_id) => {
    return pool.query(`DELETE FROM findnearbyplaces.reviews WHERE id = $1`, [review_id]);
}

let deletePhoto = (photo_id) => {
    return pool.query(`DELETE FROM findnearbyplaces.photo WHERE photo_id = $1`, [photo_id]);
}

exports.search = search;
exports.setCustomer = setCustomer;
exports.addPlace = addPlace;
exports.addCategory = addCategory;
exports.addPhoto = addPhoto;
exports.addReview = addReview;
exports.updatePlace = updatePlace;
exports.updateReview = updateReview;
exports.updatePhoto = updatePhoto;
exports.deletePlace = deletePlace;
exports.deleteReview = deleteReview;
exports.deletePhoto = deletePhoto;