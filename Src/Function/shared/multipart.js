/**
	This is a modified source from parse-multipart (https://github.com/guigrpa/docx-templates).

 	Multipart Parser
	usage:
		var multipart = require('./multipart.js');
		var body = multipart.DemoData(); 							   // raw body	
		var boundary = multipart.getBoundary(event.params.header['content-type']);
		var parts = multipart.Parse(body, boundary);
	
	parsing:
		The boundary is taken from the content-type of the request message
		Content-Type: Boundary_boundary

		parsing of the parts is based on the structure
		
		--Boundary_boundary
		Content-Disposition: file;  filename="file.docx"
		Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
		
		@11X
		111Y
		111Z\rCCCC\nCCCC\r\nCCCCC@
		--Boundary_boundary

		{ 
			type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
			filename: "file.docx", 
			data: <Buffer 41 41 41 42 42 ...>
		}

		'type' and 'data' are always present, additional fields are taken from the Content-Disposition row.
 */

exports.Parse = function(multipartBodyBuffer,boundary){
	//  debugger;
	var process = function(part) {
		var obj = function(arr) {
			var o = {};
			if (arr) {
				arr.forEach(s => {
					var k = s.split('=');
					var a = k[0].trim();
					var b = JSON.parse(k[1].trim());
								
					Object.defineProperty( o , a , 
					{ value: b, writable: true, enumerable: true, configurable: true })
				});
			}
			return o;
		}

		var info = part.disposition.split(';');
		var partObj = obj(info.slice(1));
		var contentType = part.type.split(':')[1].trim();
		Object.defineProperty( partObj , 'type' , 
			{ value: contentType, writable: true, enumerable: true, configurable: true })
		Object.defineProperty( partObj , 'data' , 
			{ value: Buffer.from(part.part), writable: true, enumerable: true, configurable: true })
		return partObj;
	}

	var lastline='';
	var disposition = '', type = '';
	var state=0; var buffer=[];
	var allParts = [];
			
	for (i=0; i < multipartBodyBuffer.length; i++) {
		var oneByte = multipartBodyBuffer[i];
		var prevByte = i > 0 ? multipartBodyBuffer[i-1] : null;
		var newLineDetected = ((oneByte == 0x0a) && (prevByte == 0x0d)) ? true : false;
		var newLineChar = ((oneByte == 0x0a) || (oneByte == 0x0d)) ? true : false;
			
		if (!newLineChar)
			lastline += String.fromCharCode(oneByte);
			
		if ((state == 0) && newLineDetected) {
			if (`--${boundary}` == lastline) {
				state = 1;
			}
			lastline = '';
		} else
		if ((state == 1) && newLineDetected) {
			if (lastline == '') {
				// next-line will be part content
				state = 2;
				buffer = [];
			} else if (lastline.includes('Content-Disposition')) {
				disposition = lastline;
			} else if (lastline.includes('Content-Type')) {
				type = lastline;
			}
			lastline='';
		} else
		if (state == 2){
			if (lastline.length > (boundary.length + 4)) { lastline = ''; }// mem save
			if (`--${boundary}` == lastline) {
				var j = buffer.length - lastline.length;
				var part = buffer.slice(0, j - 1);
				var p = { type: type, disposition: disposition, part: part };
				allParts.push(process(p));
				buffer = []; lastline=''; state=3; type=''; disposition='';
			} else {
				buffer.push(oneByte);
			}
			if (newLineDetected) lastline = '';
		} else
		if (state == 3) {
			if (newLineDetected) {
				state = 1;
			}
		}
	}
	return allParts;
};
			
//  read the boundary from the content-type header sent by the http client
//  this value may be similar to:
//  'multipart/form-data; boundary=----WebKitFormBoundaryvm5A9tzU1ONaGP5B',
exports.getBoundary = function(header){
	var items = header.split(';');
	if(items)
		for(i=0;i<items.length;i++){
			var item = (new String(items[i])).trim();
			if(item.indexOf('boundary') >= 0){
				var k = item.split('=');
				return (new String(k[1])).trim();
			}
		}
	return "";
}
			
exports.DemoData = function(){
	body = "trash1\r\n"
	body += exampleBodyString
	return (buffer.from(body,'utf-8')); 
	// returns a Buffered payload, so the it will be treated as a binary content.
};

exports.exampleBodyString = function () {
	body += "--WebKitFormBoundaryvef1fLxmoUdYZWXp\r\n";
	body += "Content-Disposition: form-data\"\r\n";
	body += "Content-Type: application/json\r\n",
	body += "\r\n\r\n";
	body += "{\r\n";
	body += " \"name\": \"John Smith\",";
	body += " \"email\": \"john.smith@contoso.com\"";
	body += "}\r\n";
	body += "--WebKitFormBoundaryvef1fLxmoUdYZWXp\r\n";
	body += "Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document\r\n",
	body += "Content-Disposition: file; filename=\"myfile.docx\"\r\n";
	body += "\r\n\r\n";
	body += "@22X";
	body += "222Y\r\n";
	body += "222Z\r222W\n2220\r\n666@\r\n";
	body += "--WebKitFormBoundaryvef1fLxmoUdYZWXp--\r\n";
	return body;
}