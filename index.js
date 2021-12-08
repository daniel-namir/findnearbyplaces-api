const express = require('express');
const cors = require('cors');
const { v4: uuid } = require('uuid');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const api = require('./api');


const application = express();
const port = process.env.PORT || 4002;

passport.use(new LocalStrategy(
    { usernameField: 'email'},
    (email, password, done) => {
        console.log('Inside local strategy callback');
        api.login(email, password)
            .then(x => {
                console.log(x);
                if (x.isValid) {
                    let user = { id: x.id, name: x.name, email: email };
                    console.log(user);
                    return done(null, user);
                } else {
                    console.log('The email or password is not valid.');
                    return done(null, false, 'The email or password was invalid');
                }
            })
            .catch(e => {
                console.log(e);
                return done(e);
            });
    }
));

passport.serializeUser((user, done) => {
    console.log('Inside serializeUser callback. User id is dave to the session file store here')
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    console.log('Inside deserializeUser callback')
    console.log(`The user id passport saved in the session file store is: ${id}`)
    const user = {id: id};
    done(null, user);
});

application.use(express.json());
application.use(cors());

application.use(session({
    genid: (request) => {
        //console.log(request);
        console.log('Inside session middleware genud function');
        console.log(`Request object sessionID from client: ${request.sessionID}`);

        return uuid(); // use UUIDs for session IDs
    },
    store: new FileStore(),
    secret: 'some random string',
    resave: false,
    saveUninitialized: true
}));
application.use(passport.initialize());
application.use(passport.session());

application.get('/add/:n/:m', (request, response) => {
    if (request.isAuthenticated()) {
        let n = Number(request.params.n);
        let m = Number(request.params.m);
        let sum = api.add(n, m);
        response.send(`${n} + ${m} = ${sum}.`);
    } else {
        response.status(403).json({done: false, message: 'You need to log in first.'})
    }
});

application.get('/search', (req, res) => {
    let search_term = req.body.search_term;
    let user_location = req.body.user_location;
    let radius_filter = req.body.radius_filter;
    let maximum_results_to_return = req.body.maximum_results_to_return;
    let category_filter = req.body.category_filter;
    let sort = req.body.sort;
    return api.search(search_term, user_location, radius_filter, maximum_results_to_return, category_filter, sort)
    .then(x => {
        res.json(x);
    })
    .catch(e => {
        res.json({message: 'Search has failed: ' + e});
    })
});

application.post('/customer', (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    return api.setCustomer(email, password)
    .then(x => {
        res.send(JSON(stringify({'done': true, 'message': 'The customer has been added successfully'})));
    })
    .catch(e => {
        res.send(JSON(stringify({'done': false, 'message': 'There was a failure when adding a customer'})));
    })
});

application.post('/login', (req, res) => {
    console.log('Inside POST /login callback');
    passport.authenticate('local', (err, user, info) => {
        console.log('Inside passport.authenticate() callback');
        console.log(`req.session.passport: ${JSON.stringify(req.session.passport)}`);
        console.log(`req.user: ${JSON.stringify(req.user)}`);
        req.login(user, (err) => {
            console.log('Inside req.login() callback');
            console.log(`req.session.passport: ${JSON.stringify(req.session.passport)}`);
            console.log(`req.user: ${JSON.stringify(req.user)}`);
            return response.json({ done: true, message: 'The customer logged in.'});
        })
    })(req, res, next);
});

application.post('/place', (req, res) => {
    let name = req.body.name;
    let category_id = req.body.category_id;
    let latitude = req.body.latitude;
    let longitude = req.body.longitude;
    let description = req.body.description;
    return api.addPlace(name, category_id, latitude, longitude, description)
    .then(x => {
        res.send(JSON(stringify({'done': true, 'id': x, 'message': 'The place has been added successfully'})));
    })
    .catch(e => {
        res.send(JSON(stringify({'done': false, 'id': null, 'message': 'There was a failure when adding a place'})));
    })
});

application.post('/photo', (req, res) => {
    let photo = req.body.photo;
    let place_id = req.body.place_id;
    let review_id = req.body.review_id;
    return api.addPhoto(photo, place_id, review_id)
    .then(x => {
        res.send(JSON(stringify({'done': true, 'id': x.rows[0].id, 'message': 'The photo has been added successfully'})));
    })
    .catch(e => {
        res.send(JSON(stringify({'done': false, 'id': null, 'message': 'There was a failure when adding a photo'})));
    })
});

application.post('/category', (req, res) => {
    let category = req.body.name;
    return api.addCategory(category)
    .then(x => {
        res.send(JSON(stringify({'done': true, 'id': x, 'message': 'The category has been added successfully'})));
    })
    .catch(e => {
        res.send(JSON(stringify({'done': false, 'id': null, 'message': 'There was a failure when adding a category'})));
    })
});

application.post('/review', (req, res) => {
    let place_id = req.body.place_id;
    let comment = req.body.comment;
    let rating = req.body.rating;
    return api.addReview(place_id, comment, rating)
    .then(x => {
        res.send(JSON(stringify({'done': true, 'id': x, 'message': 'The review has been added successfully'})));
    })
    .catch(e => {
        res.send(JSON(stringify({'done': false, 'id': null, 'message': 'There was a failure when adding a review'})));
    })
});

application.put('/place', (req, res) => {
    let place_id = req.body.place_id;
    let name = req.body.name;
    let category_id = req.body.category_id;
    let latitude = req.body.latitude;
    let longitude = req.body.longitude;
    let description = req.body.description;
    if (!api.updatePlace(place_id, name, category_id, latitude, longitude, description)) {
        res.send(JSON(stringify({'done': true, 'message': 'The place has been updated successfully'})));
    }
    else {
        res.send(JSON(stringify({'done': false, 'message': 'There was a failure when updating a place'})));
    }
});

application.put('/review', (req, res) => {
    let review_id = req.body.review_id;
    let comment = req.body.comment;
    let rating = req.body.rating;
    if (!api.updatePlace(review_id, comment, rating)) {
        res.send(JSON(stringify({'done': true, 'message': 'The review has been updated successfully'})));
    }
    else {
        res.send(JSON(stringify({'done': false, 'message': 'There was a failure when updating a review'})));
    }
});

application.put('/photo', (req, res) => {
    let photo_id = req.body.photo_id;
    let photo = req.body.photo;
    if (!api.updatePlace(photo_id, photo)) {
        res.send(JSON(stringify({'done': true, 'message': 'The photo has been updated successfully'})));
    }
    else {
        res.send(JSON(stringify({'done': false, 'message': 'There was a failure when updating a photo'})));
    }
});

application.delete('/place/:PLACE_ID', (req, res) => {
    let place_id = req.params.PLACE_ID;
    return api.deletePhoto(place_id)
    .then(x => {
        res.send(JSON(stringify({'done': true, 'message': 'The place has been deleted successfully'})));
    })
    .catch(e => {
        res.send(JSON(stringify({'done': false, 'message': 'There was a failure when deleting a place'})));
    })
});

application.delete('/review/:REVIEW_ID', (req, res) => {
    let review_id = req.params.REVIEW_ID;
    return api.deleteReview(review_id)
    .then(x => {
        res.send(JSON(stringify({'done': true, 'message': 'The review has been deleted successfully'})));
    })
    .catch(e => {
        res.send(JSON(stringify({'done': false, 'message': 'There was a failure when deleting a review'})));
    })
});

application.delete('/photo/:PHOTO_ID', (req, res) => {
    let photo_id = req.params.PHOTO_ID;
    return api.deletePhoto(photo_id)
    .then(x => {
        res.send(JSON(stringify({'done': true, 'message': 'The photo has been deleted successfully'})));
    })
    .catch(e => {
        res.send(JSON(stringify({'done': false, 'message': 'There was a failure when deleting a photo'})));
    })
});

application.listen(port, () => console.log('Listening on port ' + port));