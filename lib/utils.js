var xml2json = require('xml2json'),
    json2xml = require("json2xml");

var exports = module.exports = {

    toXML: function (params, callback) {
        try {
            callback(null, json2xml({ gatewayRequest: params }, { header: true }));
        } catch (err) {
            callback(err);
        }
    },
    fromXML: function (xmlDocument, callback) {
        try {
            callback(null, JSON.parse(xml2json.toJson(xmlDocument)).gatewayResponse);
        } catch (err) {
            callback(err);
        }
    },
    shuffleArray: function (array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    }
};
