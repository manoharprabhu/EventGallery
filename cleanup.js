var fs = require('fs');
module.exports = {
    createUploadsIfNotExists: function () {
        if (!fs.existsSync('./uploads')) {
            fs.mkdirSync('./uploads');
        }
        return this;
    },
    cleanUploadsFolder: function (callback) {
        fs.readdir('uploads', function (err, data) {
            data.forEach(function (item) {
                fs.unlink('uploads/' + item, function (err) {
                    if (err) console.log(err);
                });
            });
        });
        return this;
    },
    deletePhoto: function (photo) {
        fs.unlink('uploads/' + photo, function (err) {
            if (err) console.log(err);
        });
        return this;
    }
};