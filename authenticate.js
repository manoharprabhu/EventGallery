var FacebookStrategy = require('passport-facebook').Strategy;

var getFacebookStrategy = function () {
    return new FacebookStrategy({
        clientID: '1002595339779964',
        clientSecret: '18742cedfc725c7dada96801457a5c97',
        callbackURL: "http://localhost:8080/auth/facebook/callback",
        profileFields: ['email', 'displayName']
    },
        function (accessToken, refreshToken, profile, done) {
            process.nextTick(function () {
                return done(null, profile);
            });
        }
        )
}

var serializeUser = function (user, done) {
    done(null, user);
}

var deserializeUser = function (user, done) {
    done(null, user);
}

var registerCallbacks = function (app, passport) {
    app.get('/auth/facebook', passport.authenticate('facebook', { authType: 'rerequest', scope: ['email'] }));
    app.get('/auth/facebook/callback', passport.authenticate('facebook', { successRedirect: '/upload', failureRedirect: '/login' }));
}

var isLoggedIn = function(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/login');
}

module.exports = {
    getFacebookStrategy: getFacebookStrategy,
    serializeUser: serializeUser,
    deserializeUser: deserializeUser,
    registerCallbacks: registerCallbacks,
    isLoggedIn: isLoggedIn
}

