import fs from "fs";
import path from "path";
import {
    isLeafType
} from "graphql";

let _test_dir = "./test";
let _server = null;
let _graphql_path = null;
let _configured = false;


export default function (config) {
    _test_dir = config.testDir || _test_dir;
    _server = config.server;
    _graphql_path = config.path;

    if (!fs.existsSync(_test_dir)) {
        fs.mkdirSync(_test_dir);
    } else {
        let files = [];
        let rmDir = function (dirPath) {
            try {
                files = fs.readdirSync(dirPath);
            } catch (e) {
                return;
            }
            if (files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                    let filePath = dirPath + '/' + files[i];
                    if (fs.statSync(filePath).isFile() && files[i] !== "index.js")
                        fs.unlinkSync(filePath);
                    else
                        rmDir(filePath);
                }
            }
        };
        rmDir(_test_dir);
    }

    _configured = true;
}

export function generateQuery(name, args, type) {
    let fields = type._typeConfig && type._typeConfig.fields;

    return `mutation(${_getArgsString(args)}){${name}(${_getArgsMappedString(args)})` +
        (_isCustomType(type) ? `{ 
            ${Object.keys(fields).filter((key) => {
                return !_isCustomType(fields[key].type);
            })} 
        }}` : `}`);
}

export function generateTest(request, file, entity, title) {
    if (!_configured) throw new Error("Tests generator is not configured");

    file = path.join(_test_dir, file);
    let testBody = _newTest
        `   it('${entity.constructor.name}', (done) => {
                var mockData = ${request};
                
                var test = chai.request(server)
                    .post(graphUrl || "${_graphql_path}");
                
                var name = ${title};
                    
                if (context && context[name]) {
                    deepMapper(mockData, context[name]);
                }
                
                test.send(mockData);
                
                if(headers) {
                    Object.keys(headers).forEach((key)=>{
                        test.set(key, headers[key])
                    });
                }
                    
                test.end((err, res) => {
                        ${entity}
                        done();
                });
            });
    \n`;

    if (!fs.existsSync(file)) {
        let data = `module.exports = function ({server, chai, should, describe, it, headers, graphUrl, context}) { 
                        context['${title}'] = {}; 
                        
                        ${deepMapper.toString().replace("_typeof", "typeof")}
                        
                        return describe('${title}', ()=>{
                            ${testBody}
                        });};`;

        fs.writeFileSync(file, data);
    } else {
        let fileData = fs.readFileSync(file).toString();
        fileData = fileData.replace(/}\);};$/, '\n');
        fileData += testBody;
        fileData += '});};';

        fs.writeFileSync(file, fileData);
    }
}

function _newTest(strings, ...values) {
    let testIt = values[0],
        testName = values[0],
        request = JSON.stringify(values[1]),
        grPath = values[2],
        context = JSON.stringify(values[3]),
        entity = values[4];

    let success = `
        res.should.have.status(200);
        res.body.should.be.a('object');
    `;

    if (_isCustomType(entity.type)) {
        success += `
             res.body.should.have.property('data');
             res.body.data.should.have.property('${testName}');
        `;
        Object.keys(entity.type._typeConfig.fields).forEach((key) => {
            if (_isCustomType(entity.type._typeConfig.fields[key].type)) return;

            success += `
                res.body.data.${testName}.should.have.property('${key}');
                context[${context}]['${key}'] = res.body.data.${testName}.${key};             
            `
        })
    } else {
        success += `
             res.body.should.have.property('data');
             res.body.data.should.have.property('${testName}');
             
             context[${context}]['${testName}'] = res.body.data.${testName};  
        `;
    }

    return strings[0] +
        testIt + strings[1] +
        request + strings[2] +
        grPath + strings[3] +
        context + strings[4] +
        success + strings[5];
}

function _getArgsString(args) {
    let q = "";

    Object.keys(args).forEach(key => {
        q += `$${args[key].name}: ${args[key].type},`;
    });

    return q.slice(0, -1);
}

function _getArgsMappedString(args) {
    let q = "";

    Object.keys(args).forEach(key => {
        q += `${args[key].name}: $${args[key].name},`;
    });

    return q.slice(0, -1);
}

function _isCustomType(type) {
    return !isLeafType(type)
}

function deepMapper(obj, context) {
    Object.keys(obj).forEach((k) => {
        if (typeof obj[k] === "object") deepMapper(obj[k], context);
        if (context[k]) obj[k] = context[k];
        if (context[obj[k]]) obj[k] = context[obj[k]];
    });
}