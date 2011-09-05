var config = require('./config'),
	fs = require('fs'),
	http = require('http'),
	staticServer = new(require('node-static').Server)('./public');

http.createServer(function (request, response) {
	
	// http-bind proxy
	if(request.url === '/http-bind/') {
		var proxy_req = http.request({
			host: config.http_bind.host,
			port: config.http_bind.port,
			path: config.http_bind.path,
			method: request.method
		});
		proxy_req.on('response', function(proxy_response) {
			proxy_response.addListener('data', function(chunk) {
				response.write(chunk, 'binary');
			});
			proxy_req.on('end', function() {
				response.end();
			});
			response.writeHead(proxy_response.statusCode, proxy_response.headers);
		});
		request.addListener('data', function(chunk) {
			proxy_req.write(chunk, 'binary');
		});
		request.addListener('end', function() {
			proxy_req.end();
		});
	
	// static files
	} else {	
		request.addListener('end', function() {
			if(request.url === '/' || request.url === '/index.html') {
				// index file
				fs.readFile('public/index.html', 'ascii', function(err, data) {
					data = data.replace('OPTIONS', JSON.stringify(config.candy));
					response.write(data, 'ascii');
					response.end();
				});
			} else {
				staticServer.serve(request, response);
			}
		});		
	}
	
}).listen(config.app.port);