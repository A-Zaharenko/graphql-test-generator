"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = Test;

var _testGenerator = require("./test-generator");

function Test(_ref) {
    var mockData = _ref.mockData,
        title = _ref.title;

    return function (Class) {
        return function () {
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            var entity = new (Function.prototype.bind.apply(Class, [null].concat(args)))();

            var request = {
                query: (0, _testGenerator.generateQuery)(Class.name, entity.args, entity.type)
            };

            if (mockData || Class.__mockData) {
                request.variables = mockData || Class.__mockData;
            }

            (0, _testGenerator.generateTest)(request, title + ".test.js", entity, title);

            return entity;
        };
    };
}