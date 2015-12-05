var express = require('express');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var app = express();


app.use(passport.initialize());
app.use(passport.session());


// Dummy database
var User = {
    users: require('./users.json'),
    /*findById: function(id) {
        return this.users.find(function(x) {
            return x.id === id;
        })[0];
    },*/
    findById: function(id){
        var x= this.users.find(function(x){
            return x.id===id;});
        if (x != null)
        {
            return x[0];
        }

    },
    findOrCreate: function(user) {
        return this.findById(user.id) || this.create(user);
    },
    create: function(user) {
        this.users.push(user);
        require('fs').writeFileSync('./users.json', JSON.stringify(this.users));
        return user;
    }
};

// Passport configuration

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    done(null, User.findById(id));
});

passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/oauth/google/callback"
    },
    function(accessToken, refreshToken, profile, done) {
        require('fs').writeFileSync('./profile.json', JSON.stringify(profile));
        done(null, User.findOrCreate({
            id: profile.id
        }));
    }
));

app.get('/oauth/google',
    passport.authenticate('google', {
        scope: ['https://www.googleapis.com/auth/plus.login']
    }));

app.get('/oauth/google/callback',
    passport.authenticate('google'),
    function(req, res) {
        res.redirect('/');
    });

app.get('/logout', function(req, res){
    req.logout();
    res.send(200);
});

// Express configuration

app.use(express.static('.'));





app.get('/profile', authenticationCheck, function (req, res) {
    res.json(req.user);
});

function authenticationCheck(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.send(401);
}

var server = app.listen(3000, function () {
    console.log('Running on port 3000.');
});