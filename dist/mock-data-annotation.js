"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = MockData;
function MockData(data) {
    return function (Class) {
        Class.__mockData = data;
        return Class;
    };
}