module.exports = {
    cleanUploadsFolder: function (callback) {
        var fs = require('fs');
        fs.readdir('uploads', function (err, data) {
             data.forEach(function(item){
                 fs.unlink('uploads/'+item,function(err){
                     if(err) console.log(err);
                 });
             });
        });
    }
};