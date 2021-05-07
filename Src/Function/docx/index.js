/**
 * Azure Function docx-templates
 * 
 * This function will construct a document from a .docx template and a js object
 * using the docx-templates library (https://github.com/guigrpa/docx-templates). 
 * 
 * - return 200 with parsed docx document in body.
 * - return 400 if request does not contain a js object and/or docx file.
 */
const multipart = require("../shared/multipart");
const docx = require("docx-templates");

module.exports = async function (context, req) {
    context.log('start handling new request');
    // debugger;
    try {
        context.log('validating request');
        // get the boundary from the request's Content-Type
        const boundary = multipart.getBoundary(req.headers["content-type"]);
        if (boundary == '') {
            return endWithBadResponse(context, 'No boundary found. Provide the boundary in the request\'s Content-Type header.\r\nContent-Type: multipart/form-data; boundary=multipartboundary');
        }

        if (!req.body) {
            return endWithBadResponse(context, "No request body defined");
        }

        const bodyBuffer = Buffer.from(req.body);
        const parts = multipart.Parse(bodyBuffer, boundary);

        if (!validateParts(parts)) {
            return endWithBadResponse(context, `Expect 2 parts in the request body. First of type application/json, second the docx template\r\n\r\n${multipart.exampleBodyString()}`);
        }

        // do the parsing
        context.log('start parsing template');
        var obj = JSON.parse(parts[0].data.toString());
        var template = Buffer.from(parts[1].data);
        const document = await docx.createReport({
            template,
            data: obj
        });

        var doc = Buffer.from(document);

        context.log('write response');
        context.res = {
            status: 200,
            headers: {
                'Content-Type': parts[1].type
            },
            body: doc
        };
        context.done();
        context.log('end request handling');
    } catch (err) {
        context.log.error(`An error occured on the server: ${err.message}`);
        throw err;
    }
}

function endWithBadResponse(context, message = 'Bad Request') {
    context.log.error(message);
    context.bindings.response = {
        status: 400,
        body: message
    };
    context.done();
}

function validateParts(parts) {
    if (parts.length < 2) { return false; }
    if (parts[0].type.toLowerCase() != 'application/json') { return false; }
    return true;
}
