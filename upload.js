var multer = require('multer');
var cleanupPhotos = require('./cleanup');
var captions = [];
var currentPhoto = 0;
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

var uploadImage = function (req, res) {
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
}

var startTimer = function (io, cycleInterval) {
    return setInterval(function () {
        if (captions.length !== 0) {
            currentPhoto = (currentPhoto + 1) % captions.length;
            io.emit('photo', JSON.stringify(captions[currentPhoto]));
        }

    }, cycleInterval);
}

var getNextPhoto = function (res) {
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
}

module.exports = {
    getNextPhoto: getNextPhoto,
    uploadImage: uploadImage,
    startTimer: startTimer
}
