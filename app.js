var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var multer = require('multer');
var authenticate = require('./authenticate');
var uploadHelper = require('./upload');
var cleanupPhotos = require('./cleanup');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
var config = require('./config');
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(bodyParser());
app.use(session({ secret: 'mysessionsecretishere' })); // session secret
app.use(passport.initialize());
app.use(passport.session());
app.use('/css', express.static('css'));
app.use('/uploads', express.static('uploads'));
app.use('/js', express.static('js'));

passport.use(authenticate.getFacebookStrategy());
passport.serializeUser(authenticate.serializeUser);
passport.deserializeUser(authenticate.deserializeUser);
authenticate.registerCallbacks(app, passport);

var timer;
var port = config.configurations.port;
var cycleInterval = 5000;
var ipAddress = config.configurations.ipAddress;
var host = config.configurations.hostname;

cleanupPhotos.createUploadsIfNotExists().cleanUploadsFolder();

app.get('/', function (req, res) {
        res.render('index', { ip: host, port: port });
});

app.get('/upload', authenticate.isLoggedIn, function (req, res) {
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
    uploadHelper.getNextPhoto(res);
});

app.post('/api/photo', authenticate.isLoggedIn, function (req, res) {
    uploadHelper.uploadImage(req, res);
});

http.listen(port, ipAddress, function () {
    console.log('server started at port ' + port);
    timer = uploadHelper.startTimer(io, cycleInterval);
});


