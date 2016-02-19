(function () {
    var socket = io();
    //Capture photo requests and change photo
    socket.on('photo', function (data) {
        console.log(data);
        data = JSON.parse(data);
        if (data.src === null) {
            document.getElementById('photocaption').style.display = 'none';
        } else {
            document.getElementById('photocaption').style.display = 'block';
            document.getElementById('imagetorep').src = 'uploads/' + data.filename;
            document.getElementById('photocaption')
                    .getElementsByClassName('caption')[0].innerText = data.caption;
            document.getElementById('photocaption')
                    .getElementsByClassName('name')[0].innerText = data.uploadedby;
            document.getElementById('photocaption')
                    .getElementsByClassName('profilephoto')[0].src = data.photo;
                    
        }
    });

})();
