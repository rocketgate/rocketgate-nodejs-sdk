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
        try {
            const xml = '<?xml version="1.0" encoding="UTF-8"?>' + builder.build({ gatewayRequest: params });
            callback(null, xml);
        } catch (err) {
            callback(err);
        }
    },
    fromXML: function (xmlDocument, callback) {
        try {
            callback(null, parser.parse(xmlDocument).gatewayResponse);
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
