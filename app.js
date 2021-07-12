var http = require("http");
http.createServer(function(require,response){
    response.writeHead(200,{'Content-Type': 'text/html'})
    response.end("Hello World")
}).listen(8080);