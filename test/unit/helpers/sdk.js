'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var root = path.resolve(process.env.ROCKETGATE_SDK_ROOT || path.join(__dirname, '../../..'));
var sdkRequire = require('module').createRequire(path.join(root, 'package.json'));

// Load the real SDK with a fresh module cache for each test. Only transport,
// DNS, and the retry clock are replaced; XML conversion and public wrappers run.
// The allowlist prevents an unmocked network module from entering the harness.
module.exports = function createSDK(options) {
    options = options || {};
    var cache = Object.create(null);
    var replies = [];
    var pending = [];
    var timers = [];
    var now = 0;
    var calls = [];
    var dnsCalls = [];
    var delays = [];
    var allowed = ['async', 'fast-xml-parser', 'crypto', 'url', 'urlencode'];

    function transport(request, callback) {
        calls.push(request);
        // Defer callbacks until flush(), as a real HTTP request would.
        pending.push(function () {
            assert.ok(replies.length, 'Unexpected HTTP request: ' + request.uri);
            var reply = replies.shift();
            callback(reply.error || null, {
                statusCode: reply.statusCode === undefined ? 200 : reply.statusCode,
                statusMessage: reply.statusMessage || 'OK'
            }, reply.body);
        });
    }

    function resolve4(host, callback) {
        dnsCalls.push(host);
        pending.push(function () {
            callback(options.dnsError || null,
                options.records === undefined ? ['69.20.127.91'] : options.records.slice());
        });
    }

    function schedule(callback, delay) {
        delays.push(delay);
        timers.push({ at: now + delay, callback: callback });
    }

    function load(filename) {
        filename = require.resolve(filename);
        assert.ok(filename.indexOf(root + path.sep) === 0, 'SDK import escaped the project');
        if (cache[filename]) return cache[filename].exports;
        var mod = { exports: {} };
        cache[filename] = mod;
        var source = fs.readFileSync(filename, 'utf8');
        if (path.extname(filename) === '.json') {
            mod.exports = JSON.parse(source);
        } else {
            function localRequire(name) {
                if (name === 'request') return transport;
                if (name === 'dns' || name === 'node:dns') return { resolve4: resolve4 };
                if (name.charAt(0) === '.') return load(path.resolve(path.dirname(filename), name));
                assert.ok(allowed.indexOf(name) !== -1, 'Unmocked SDK dependency: ' + name);
                return sdkRequire(name);
            }
            // NYC's run-in-context hook instruments the actual source filenames.
            // No global timers, require hooks, or production module caches change.
            var compile = vm.runInThisContext(
                '(function (require, module, exports, setTimeout) {' + source + '\n})',
                filename // NYC 10's hook requires the legacy filename argument.
            );
            compile(localRequire, mod, mod.exports, schedule);
        }
        return mod.exports;
    }

    function flush() {
        var count = 0;
        while (pending.length) {
            assert.ok(++count <= 100, 'HTTP/DNS callback loop did not settle');
            pending.shift()();
        }
    }

    return {
        api: load(path.join(root, 'index.js')),
        service: load(path.join(root, 'lib/gatewayService.js')),
        calls: calls,
        dnsCalls: dnsCalls,
        delays: delays,
        reply: function (body, statusCode, statusMessage) {
            replies.push({ body: body, statusCode: statusCode, statusMessage: statusMessage });
        },
        fail: function (error) { replies.push({ error: error }); },
        flush: flush,
        advance: function (milliseconds) {
            now += milliseconds;
            timers.sort(function (a, b) { return a.at - b.at; });
            while (timers.length && timers[0].at <= now) {
                timers.shift().callback();
                flush();
            }
        },
        assertIdle: function () {
            assert.strictEqual(pending.length, 0, 'Unprocessed HTTP/DNS callbacks');
            assert.strictEqual(timers.length, 0, 'Unprocessed retry timers');
            assert.strictEqual(replies.length, 0, 'Unused HTTP response fixtures');
        }
    };
};
