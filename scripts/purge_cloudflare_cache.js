var request = require('request');

var yaml = require('js-yaml');

var fs   = require('fs');

var config = yaml.safeLoad(fs.readFileSync('config.yaml', 'utf8'));

request(config.cloudflare.api, {
    form: {
        a:'fpurge_ts',
        tkn: config.cloudflare.token,
        email: config.cloudflare.email,
        z: config.cloudflare.domain,
        v: '1'
    }
}, function(err, response, body) {
    if (err) {
        throw err;
    }
    //console.log(response);
    console.log(body);
});