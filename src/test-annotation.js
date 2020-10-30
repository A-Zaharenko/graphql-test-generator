import {generateQuery, generateTest} from "./test-generator";

export default function Test({mockData, title}) {
    return function (Class) {
        return function (...args) {
            let entity = new Class(...args);

            let request = {
                query: generateQuery(Class.name, entity.args, entity.type),
            };

            if (mockData || Class.__mockData) {
                request.variables = mockData || Class.__mockData;
            }

            generateTest(request, `${title}.test.js`, entity, title);

            return entity;
        }
    }
}