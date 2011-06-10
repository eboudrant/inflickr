// inflickr.js

require.paths.unshift('./flickrnode');
require.paths.unshift('./node_modules/express/lib');

var FlickrAPI = require('flickr').FlickrAPI;
var express = require("express");
var url = require("url");

var FlickrKeys = function FlickrKeys() {
    this._configure(process.env.API_KEY || "17f1d14ee2c43e10b94ebfd62915869d", process.env.SECRET || "2d965f23923aaebb");
};

FlickrKeys.prototype._configure= function(api_key, shared_secret) { 
    this.api_key= api_key;
    this.shared_secret= shared_secret;
};

var keys = new FlickrKeys();
var flickr = new FlickrAPI(keys.api_key, keys.shared_secret);

var port = process.env.VMC_APP_PORT || process.env.C9_PORT || 8001;

function fail (err) {
    console.log('processing request...error: ERR: ' + err.code + ' -  ' + err.message);
}

var app = express.createServer();

app.get('/auth/', function(req, res){
    
    flickr.auth.getToken(req.query.frob, function(err, results) {
        if(err) {
            console.log(err.code + " " + err.message);
        }
        flickr.setAuthenticationToken(results.token);
        flickr.setUser(results.user);
        res.redirect('back');
    });    
});

app.get('/favicon.ico',function (req, res) {
    res.writeHead(404, "Not found", {'Content-Type': 'text/html'});
    res.end();
});

app.get('/:tags?',function (req, res) {
    
    if(req.headers.host == 'flickstream.cloudfoundry.com') {
        res.redirect('http://inflickr.cloudfoundry.com/');
        return;
    }
    
    var uri = url.parse(req.url);
    var tags = req.params.tags;
    
    if(flickr.user) {
        console.log('[' + req.client.remoteAddress + '] [' + new Date() + '] ' + flickr.user.username  + ' look for ' + tags);
    } else {
        console.log('[' + req.client.remoteAddress + '] [' + new Date() + '] someone look for ' + tags);
    }
    
    if(!tags) {
        tags = 'cloud';
    }

    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('<!DOCTYPE html>\n');
    res.write('<meta charset=utf-8><title>inflickr | uri is a tag</title>\n');
 
    flickr.getLoginUrl('read', null, function(err, url, frob) {
        if(flickr.user) {
            res.write('Hi ' + flickr.user.username + ' !<br>');
        } else {    
            //res.write('<a href=' + url + '>connect on flickr</a><br>');
        }
        if(uri.pathname.length > 1) {
            tags = uri.pathname.substring(1);
        }
        var size = 50;
        // Search for photos with some tags
        flickr.photos.search({tags: tags, per_page: size, safe_search: 3},  function(err, results) {
            if(!err) {
                var photos = results.photo;
                for (var i = 0; i < photos.length; i++) {
                    var src = 'http://farm' + photos[i].farm + '.static.flickr.com/'+ photos[i].server +'/' + photos[i].id + '_' + photos[i].secret + '_m.jpg';
                    var href = 'http://www.flickr.com/photos/' + photos[i].owner + '/' + photos[i].id + '/';
                    link = '<a href=' + href + ' target=_BLANK><img src=\'' + src+ '\' border=\'0\'/></a>';
                    res.write(link);
                }
                res.end('<p class=c>(ɔ) 2011 flickstream. Some rights reserved. - by <a href=http://about.me/emmanuel.boudrant>emmanuel.boudrant</a>');
            } else {
                fail(err);
                res.end(err.code + ' -  ' + err.message);
            }
        });
    });
    
});

app.listen(port);

console.log("Audience is listening "+ port +"...");

/**
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en" manifest="cache.appcache">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  	<title>Lazy Loader - Load HTML and Images on Window Scroll | jQuery Plugins</title>
  	<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
	<script type="text/javascript" src="lib/jquery-1.6.1.js"></script> 
	<script type="text/javascript" src="lib/jquery.lazyloader.js"></script> 
	<script type="text/javascript" > 
		$(document).ready( function() {
			$('pre.loadme').lazyLoad();
			$('pre.morestuff').lazyLoad();
		} );
	</script> 
</head>
<body><li class="friend"><pre class="loadme" ><!-- <div class="friend_rec"><img src="" /></div> --></pre></li> 
</body>
</html>
*/
