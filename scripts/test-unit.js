'use strict';

var fs = require('fs');
var path = require('path');
var Mocha = require('mocha');
var directory = path.join(__dirname, '../test/unit');
// The first test includes loading dependencies and instrumenting SDK sources.
var mocha = new Mocha({ reporter: 'spec', timeout: 5000 });

fs.readdirSync(directory).filter(function (file) {
    return /\.test\.js$/.test(file);
}).sort().forEach(function (file) {
    mocha.addFile(path.join(directory, file));
});

mocha.run(function (failures) {
    process.exitCode = failures ? 1 : 0;
});
