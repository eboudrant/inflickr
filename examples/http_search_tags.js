require.paths.unshift('lib');
var FlickrAPI= require('flickr').FlickrAPI;

var API_KEY="";
var USER_NAME= "";

var flickr= new FlickrAPI(API_KEY);

var FlickrAPI= require('flickr').FlickrAPI;
var http = require("http");

var port = process.env.C9_PORT;
var host = "0.0.0.0";

function fail (err) {
    console.log('processing request...error: ERR: ' + err.code + ' -  ' + err.message);
}

http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});

    // Search for photos with a tag of 'tokyo'
    flickr.photos.search({tags:'tokyo', per_page: 500},  function(err, results) {
        if(!err) {
            console.log('processing request...');
            var photos = results.photo;
            for (var i = 0; i < photos.length; i++) {
                var src = 'http://farm' + photos[i].farm + '.static.flickr.com/'+ photos[i].server +'/' + photos[i].id + '_' + photos[i].secret + '_m.jpg';
                link = '<img src=\'' + src+ '\' border=\'0\'/>';
                res.write(link);
            }
            res.end();
            console.log('processing request...end');
        } else {
            fail(err);
            res.end(err.code + ' -  ' + err.message);
        }
    });
    
}).listen(port, host);

console.log("Server running at http://"+host+":"+port+"/");
    
