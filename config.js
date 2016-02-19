var config = {
    facebook: {
        clientId: '1002595339779964',
        clientSecret: '18742cedfc725c7dada96801457a5c97',
    },
    //hostname: 'nodejs-tracker1990.rhcloud.com',
    hostname: 'localhost',
    port: process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ipAddress: process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'
}

var isOpenshift = function () {
    return (typeof process.env.OPENSHIFT_NODEJS_PORT != 'undefined' || process.env.OPENSHIFT_NODEJS_PORT === "")
}

var getFacebookCallbackUrl = function () {
    //Openshift app runs on 8080, but maps to to port 80
    if (isOpenshift()) {
        return "http://" + config.hostname + "/auth/facebook/callback";
    } else {
        return "http://" + config.hostname + ":" + config.port + "/auth/facebook/callback";
    }
}

module.exports = {
    configurations: config,
    getFacebookCallbackUrl: getFacebookCallbackUrl,
    isOpenshift: isOpenshift
}