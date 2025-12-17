const { XMLParser, XMLBuilder } = require('fast-xml-parser');

const parser = new XMLParser({
    attributeNamePrefix: "",
    textNodeName: "$t",
    parseTagValue: false,
    ignoreDeclaration: true,
    ignoreAttributes: false,
});

const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: "$",
    textNodeName: "$t",
});

var exports = module.exports = {
    toXML: function (params, callback) {
        try {
            const xml = builder.build({ '?xml': { '$version': '1.0', '$encoding': 'UTF-8' }, gatewayRequest: params });
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
