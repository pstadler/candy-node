var config = require(__dirname + '/config'),
	fs = require('fs'),
	http = require('http'),
	staticServer = new(require('node-static').Server)(__dirname + '/public'),
	indexFile;

// parse index file only once
fs.readFile(__dirname + '/public/index.html', 'ascii', function(err, data) {
	indexFile = data.replace('OPTIONS', '{ core: ' + JSON.stringify(config.candy.core) + ', view: ' + JSON.stringify(config.candy.view) + '}');
	var connect = '';
	if(Array.isArray(config.candy.connect) && config.candy.connect.length > 0) {
		var connect = "'" + config.candy.connect.join("', '") + "'";
	}
	indexFile = indexFile.replace('CONNECT', connect);
});

http.createServer(function(request, response) {
	// http-bind proxy
	if(request.url === '/http-bind/') {
		if(request.headers.host) {
			delete request.headers.host;
		}

		var proxy_request = http.request({
			host: config.http_bind.host,
			port: config.http_bind.port,
			path: config.http_bind.path,
			method: request.method,
			headers: request.headers
		});

		proxy_request.on('response', function(proxy_response) {
			proxy_response.on('data', function(chunk) {
				response.write(chunk, 'binary');
			});
			proxy_response.on('end', function() {
				response.end();
			});
			response.writeHead(proxy_response.statusCode, proxy_response.headers);
		});

		request.on('data', function(chunk) {
			proxy_request.write(chunk, 'binary');
		});
		request.on('end', function() {
			proxy_request.end();
		});

	// static files
	} else {
		request.on('end', function() {
			if(request.url === '/' || request.url === '/index.html') {
				response.write(indexFile, 'ascii');
				response.end();
			} else {
				staticServer.serve(request, response);
			}
		});
	}

}).listen(config.app.port);
