'use strict';

var request = require('request'),
    pkg = require('../package.json');

module.exports = request.defaults({
    headers: {
        'User-Agent': pkg.repository.url
    }
});
