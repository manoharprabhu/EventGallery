var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var multer = require('multer');
var port = process.env.Port || 8080;
var cycleInterval = 5000;
var ipAddress;
var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './uploads');
    },
    filename: function (req, file, callback) {
        var fileName = file.fieldname + '-' + Date.now();
        callback(null, fileName);
    }
});
var upload = multer({
    storage: storage
}).single('userPhoto');

var captions = [];
var currentPhoto = 0;
var timer;
var cleanupPhotos = require('./cleanup');
cleanupPhotos
    .createUploadsIfNotExists()
    .cleanUploadsFolder();

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
    if (!ipAddress) {
        require('dns').lookup(require('os').hostname(), function (err, add, fam) {
            ipAddress = add;
            res.render('index',{ip: ipAddress, port: port});
        })
    } else {
        res.render('index',{ip: ipAddress, port: port});   
    }
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
        var message = "Image uploaded successfully";
        var error = false;
        if (req.file) {
            if (req.file.mimetype !== 'image/png' && req.file.mimetype !== 'image/jpg' && req.file.mimetype !== 'image/jpeg') {
                message = "Please upload an image file";
                error = true;
            }
            if (req.file.size > 4000000) {
                message = "Image should be smaller than 4MB";
                error = true;
            }
        } else {
            message = encodeURIComponent('No file specified');
            error = true;
        }

        if (error) {
            cleanupPhotos.deletePhoto(req.file.filename);
            return res.redirect('/upload?message=' + message + '&error=' + error);
        } else if (err) {
            return res.redirect('/upload?message=Unexpected error while uploading photo&error=' + error);
        } else {
            captions.push({
                'caption': req.body.userCaption,
                'filename': req.file.filename,
                'uploadedby': req.user.displayName
            });
            return res.redirect('/upload?message=' + message);
        }
    });
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/login');
}


http.listen(port, function () {
    console.log('server started at port ' + 8080);
    timer = setInterval(function () {
        if (captions.length !== 0) {
            currentPhoto = (currentPhoto + 1) % captions.length;
            io.emit('photo', JSON.stringify(captions[currentPhoto]));
        }

    }, cycleInterval);
});


