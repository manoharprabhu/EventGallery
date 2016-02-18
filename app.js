var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var multer = require('multer');

var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './uploads');
    },
    filename: function (req, file, callback) {
        var fileName = file.fieldname + '-' + Date.now();
        callback(null, fileName);
    }
});
var upload = multer({ storage: storage }).single('userPhoto');
var captions = [];
var currentPhoto = 0;
var timer;
require('./cleanup').cleanUploadsFolder();
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(bodyParser());
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
app.use(session({ secret: 'ilovescotchscotchyscotchscotch' })); // session secret
app.use(passport.initialize());
app.use(passport.session());
app.use('/css', express.static('css'));
app.use('/uploads', express.static('uploads'));
app.use('/js', express.static('js'));

passport.use(new FacebookStrategy({
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
    ));

passport.serializeUser(function (user, done) {
    done(null, user);
});
passport.deserializeUser(function (id, done) {
    done(null, id);
});

app.get('/auth/facebook', passport.authenticate('facebook', { authType: 'rerequest', scope: ['email'] }));
app.get('/auth/facebook/callback', passport.authenticate('facebook',
    {
        successRedirect: '/upload',
        failureRedirect: '/login'
    }));


app.get('/', function (req, res) {
    res.render('index');
});

app.get('/upload', isLoggedIn, function (req, res) {
    res.render('upload', {
        message: req.query.message,
        error: req.query.error
    });
});

app.get('/login', function (req, res) {
    if (req.isAuthenticated()) {
        res.redirect('/upload');
    } else {
        res.render('login');
    }
});

app.get('/nextphoto', function (req, res) {
    if (captions.length === 0) {
        res.json({
            src: null,
            caption: null,
            uploadedby: null
        });
    } else {
        res.json({
            src: 'uploads/' + captions[currentPhoto].filename,
            caption: captions[currentPhoto].caption,
            uploadedby: captions[currentPhoto].uploadedby
        });
    }
});

app.post('/api/photo', isLoggedIn, function (req, res) {
    upload(req, res, function (err) {
        if (err || !req.file) {
            var message = encodeURIComponent('Error while uploading the file. Please try again.');
            return res.redirect('/upload?message=' + message + '&error=true');
        } else {
            captions.push({
                'caption': req.body.userCaption,
                'filename': req.file.filename,
                'uploadedby': req.user.displayName
            });
            var message = encodeURIComponent('File uploaded successfully');
            return res.redirect('/upload?message=' + message);
        }
    });
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/login');
}


http.listen(8080, function(){
    console.log('server started at port ' + 8080);
    timer = setInterval(function () {
        if (captions.length !== 0) {
            currentPhoto = (currentPhoto + 1) % captions.length;
            io.emit('photo', JSON.stringify(captions[currentPhoto]));
        }
        
    }, 5000);
});


