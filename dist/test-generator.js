"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _templateObject = _taggedTemplateLiteral(["   it('", "', (done) => {\n                var mockData = ", ";\n                \n                var test = chai.request(server)\n                    .post(graphUrl || \"", "\");\n                \n                var name = ", ";\n                    \n                if (context && context[name]) {\n                    deepMapper(mockData, context[name]);\n                }\n                \n                test.send(mockData);\n                \n                if(headers) {\n                    Object.keys(headers).forEach((key)=>{\n                        test.set(key, headers[key])\n                    });\n                }\n                    \n                test.end((err, res) => {\n                        ", "\n                        done();\n                });\n            });\n    \n"], ["   it('", "', (done) => {\n                var mockData = ", ";\n                \n                var test = chai.request(server)\n                    .post(graphUrl || \"", "\");\n                \n                var name = ", ";\n                    \n                if (context && context[name]) {\n                    deepMapper(mockData, context[name]);\n                }\n                \n                test.send(mockData);\n                \n                if(headers) {\n                    Object.keys(headers).forEach((key)=>{\n                        test.set(key, headers[key])\n                    });\n                }\n                    \n                test.end((err, res) => {\n                        ", "\n                        done();\n                });\n            });\n    \\n"]);

exports.default = function (config) {
    _test_dir = config.testDir || _test_dir;
    _server = config.server;
    _graphql_path = config.path;

    if (!_fs2.default.existsSync(_test_dir)) {
        _fs2.default.mkdirSync(_test_dir);
    } else {
        var files = [];
        var rmDir = function rmDir(dirPath) {
            try {
                files = _fs2.default.readdirSync(dirPath);
            } catch (e) {
                return;
            }
            if (files.length > 0) {
                for (var i = 0; i < files.length; i++) {
                    var filePath = dirPath + '/' + files[i];
                    if (_fs2.default.statSync(filePath).isFile() && files[i] !== "index.js") _fs2.default.unlinkSync(filePath);else rmDir(filePath);
                }
            }
        };
        rmDir(_test_dir);
    }

    _configured = true;
};

exports.generateQuery = generateQuery;
exports.generateTest = generateTest;

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _graphql = require("graphql");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var _test_dir = "./test";
var _server = null;
var _graphql_path = null;
var _configured = false;

function generateQuery(name, args, type) {
    var fields = type._typeConfig && type._typeConfig.fields;

    return "mutation(" + _getArgsString(args) + "){" + name + "(" + _getArgsMappedString(args) + ")" + (_isCustomType(type) ? "{ \n            " + Object.keys(fields).filter(function (key) {
        return !_isCustomType(fields[key].type);
    }) + " \n        }}" : "}");
}

function generateTest(request, file, entity, title) {
    if (!_configured) throw new Error("Tests generator is not configured");

    file = _path2.default.join(_test_dir, file);
    var testBody = _newTest(_templateObject, entity.constructor.name, request, _graphql_path, title, entity);

    if (!_fs2.default.existsSync(file)) {
        var data = "module.exports = function ({server, chai, should, describe, it, headers, graphUrl, context}) { \n                        context['" + title + "'] = {}; \n                        \n                        " + deepMapper.toString().replace("_typeof", "typeof") + "\n                        \n                        return describe('" + title + "', ()=>{\n                            " + testBody + "\n                        });};";

        _fs2.default.writeFileSync(file, data);
    } else {
        var fileData = _fs2.default.readFileSync(file).toString();
        fileData = fileData.replace(/}\);};$/, '\n');
        fileData += testBody;
        fileData += '});};';

        _fs2.default.writeFileSync(file, fileData);
    }
}

function _newTest(strings) {
    var testIt = arguments.length <= 1 ? undefined : arguments[1],
        testName = arguments.length <= 1 ? undefined : arguments[1],
        request = JSON.stringify(arguments.length <= 2 ? undefined : arguments[2]),
        grPath = arguments.length <= 3 ? undefined : arguments[3],
        context = JSON.stringify(arguments.length <= 4 ? undefined : arguments[4]),
        entity = arguments.length <= 5 ? undefined : arguments[5];

    var success = "\n        res.should.have.status(200);\n        res.body.should.be.a('object');\n    ";

    if (_isCustomType(entity.type)) {
        success += "\n             res.body.should.have.property('data');\n             res.body.data.should.have.property('" + testName + "');\n        ";
        Object.keys(entity.type._typeConfig.fields).forEach(function (key) {
            if (_isCustomType(entity.type._typeConfig.fields[key].type)) return;

            success += "\n                res.body.data." + testName + ".should.have.property('" + key + "');\n                context[" + context + "]['" + key + "'] = res.body.data." + testName + "." + key + ";             \n            ";
        });
    } else {
        success += "\n             res.body.should.have.property('data');\n             res.body.data.should.have.property('" + testName + "');\n             \n             context[" + context + "]['" + testName + "'] = res.body.data." + testName + ";  \n        ";
    }

    return strings[0] + testIt + strings[1] + request + strings[2] + grPath + strings[3] + context + strings[4] + success + strings[5];
}

function _getArgsString(args) {
    var q = "";

    Object.keys(args).forEach(function (key) {
        q += "$" + args[key].name + ": " + args[key].type + ",";
    });

    return q.slice(0, -1);
}

function _getArgsMappedString(args) {
    var q = "";

    Object.keys(args).forEach(function (key) {
        q += args[key].name + ": $" + args[key].name + ",";
    });

    return q.slice(0, -1);
}

function _isCustomType(type) {
    return !(0, _graphql.isLeafType)(type);
}

function deepMapper(obj, context) {
    Object.keys(obj).forEach(function (k) {
        if (_typeof(obj[k]) === "object") deepMapper(obj[k], context);
        if (context[k]) obj[k] = context[k];
        if (context[obj[k]]) obj[k] = context[obj[k]];
    });
}