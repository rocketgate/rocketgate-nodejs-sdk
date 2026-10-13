const { XMLParser, XMLBuilder } = require('fast-xml-parser');

const parser = new XMLParser({
    parseTagValue: false,    // Prefer string only
    ignoreDeclaration: true, // No need parse header
    ignoreAttributes: true,  // To make things simple
    trimValues: true         // Default is true - To make elements compact
});

const builder = new XMLBuilder({
    ignoreAttributes: true,
    suppressEmptyNode: true
});

var exports = module.exports = {

    toXML: function (params, callback) {
        let xml;
        try {
            xml = '<?xml version="1.0" encoding="UTF-8"?>' + builder.build({ gatewayRequest: params });
        } catch (err) {
            return callback(err);
        }
        return callback(null, xml);
    },
    fromXML: function (xmlDocument, callback) {
        let response;
        try {
            response = parser.parse(xmlDocument).gatewayResponse;
        } catch (err) {
            return callback(err);
        }
        return callback(null, response);
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
