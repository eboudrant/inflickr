// inflickr.js
require.paths.unshift('./flickrnode');
require.paths.unshift('./node_modules/express/lib');
var FlickrAPI = require('flickr').FlickrAPI;
var express = require("express");
var url = require("url");
var fs = require("fs");
var FlickrKeys = function FlickrKeys() {
        this._configure(process.env.API_KEY || "17f1d14ee2c43e10b94ebfd62915869d", process.env.SECRET || "2d965f23923aaebb");
    };
FlickrKeys.prototype._configure = function(api_key, shared_secret) {
    this.api_key = api_key;
    this.shared_secret = shared_secret;
};
var keys = new FlickrKeys();
var flickr = new FlickrAPI(keys.api_key, keys.shared_secret);
var port = process.env.VMC_APP_PORT || process.env.C9_PORT || 8001;
var size = 52;
var perStrip = 4;

console.log("Using " + keys.api_key + "/" + keys.shared_secret );
console.log(process.env);

function fail(err) {
    console.log('processing request...error: ERR: ' + err.code + ' -  ' + err.message);
} 
var app = express.createServer();
app.use(express.cookieParser());
app.use(express.session({
    secret: "dexboys why not"
}));
app.get('/auth/', function(req, res) {
    flickr.auth.getToken(req.query.frob, function(err, results) {
        if (err) {
            console.log(err.code + " " + err.message);
        }
        req.session.authenticationToken(results.token);
        req.session.user(results.user);
        res.redirect('back');
    });
});

var header = null;
fs.readFile(process.env.HOME + '/www/fragments/header.html', function(err, data) {
    if (err) throw err;
    header = data;
    console.log('www/fragments/header.html in cache\n' + data);
});
var footer = null;
fs.readFile('/www/fragments/footer.html', function(err, data) {
    if (err) throw err;
    footer = data;
    console.log('www/fragments/footer.html in cache\n' + data);
});
var css = null;
fs.readFile('www/lib/default.css', function(err, data) {
    if (err) throw err;
    css = data;
    console.log('www/lib/default.css in cache\n' + data);
});
app.get('/lib/style.css', function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/stylesheet'
    });
    res.end(css);
});
var jquery = null;
fs.readFile('www/lib/jquery-1.6.1.min.js', function(err, data) {
    if (err) throw err;
    jquery = data;
    console.log('www/lib/jquery-1.6.1.min.js in cache\n' + data);
});
app.get('/lib/jquery-1.6.1.min.js', function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/javascript'
    });
    res.end(jquery);
});
var scrollTo = null;
fs.readFile('www/lib/jquery.scrollTo.js', function(err, data) {
    if (err) throw err;
    scrollTo = data;
    console.log('www/lib/jquery.scrollTo.js in cache\n' + data);
});
app.get('/lib/jquery.scrollTo.js', function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/javascript'
    });
    res.end(scrollTo);
});
var lazyloader = null;
fs.readFile('www/lib/jquery.lazyloader.js', function(err, data) {
    if (err) throw err;
    lazyloader = data;
    console.log('www/lib/jquery.lazyloader.js in cache\n' + data);
});
app.get('/lib/jquery.lazyloader.min.js', function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/javascript'
    });
    res.end(lazyloader);
});
app.get('/favicon.ico', function(req, res) {
    res.writeHead(404, "Not found", {
        'Content-Type': 'text/html'
    });
    res.end();
});
app.get('/ajax', function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/html'
    });
    if (req.query.method == 'photos') {
        if (req.session.user) {
            console.log('[' + req.client.remoteAddress + '] [' + new Date() + '] ' + flickr.user.username + ' more photos for ' + req.query.tags + ' (page ' + req.query.page + ')');
        }
        else {
            console.log('[' + req.client.remoteAddress + '] [' + new Date() + '] more photos for ' + req.query.tags + ' (page ' + req.query.page + ')');
        }
        var tags = req.query.tags;
        if (!tags) {
            tags = 'cloud';
        }
        flickr.photos.search({
            tags: tags,
            per_page: size,
            safe_search: 3,
            page: req.query.page
        }, function(err, results) {
            if (!err) {
                var photos = results.photo;
                for (var i = 0; i < photos.length; i++) {
                    link = '\n<pre class=\'loadme\'><!-- <span style="display:block;width:' + (270 * perStrip) + 'px;height:240px;background-color:#000;vertical-align: middle;">';
                    for (var j = 0; j < perStrip; j++) {
                        if (i == 15) {
                            res.write('<pre class=\'loadme\'><!-- \n<script type="text/javascript">loadNext("'+tags+'");</script>--></pre>\n');
                        }
                        var src = 'http://farm' + photos[i].farm + '.static.flickr.com/' + photos[i].server + '/' + photos[i].id + '_' + photos[i].secret + '_m.jpg';
                        var href = 'http://www.flickr.com/photos/' + photos[i].owner + '/' + photos[i].id + '/';
                        link += '\n\t<a href=' + href + ' target=_BLANK><img src=\'' + src + '\' border=\'0\'/></a>';
                        i++;
                        if (i >= photos.length) {
                            break;
                        }
                    }
                    link += '</span> <script type="text/javascript">if(autoScroll) $(document).scrollTo( \'100%\', 2000); counter += 4;</script>--></pre>\n';
                    res.write(link);
                }
                res.end();
            }
            else {
                fail(err);
                res.end(err.code + ' -  ' + err.message);
            }
        });
    }
});
app.get('/:tags?', function(req, res) {
    if (req.headers.host == 'flickstream.cloudfoundry.com') {
        res.redirect('http://inflickr.cloudfoundry.com/');
        return;
    }
    var uri = url.parse(req.url);
    var tags = req.params.tags;
    if (req.session.user) {
        console.log('[' + req.client.remoteAddress + '] [' + new Date() + '] ' + flickr.user.username + ' look for ' + tags);
    }
    else {
        console.log('[' + req.client.remoteAddress + '] [' + new Date() + '] someone look for ' + tags);
    }
    if (!tags) {
        tags = 'cloud';
    }
    res.writeHead(200, {
        'Content-Type': 'text/html'
    });
    res.write(header);
    flickr.getLoginUrl('read', null, function(err, url, frob) {
        if (req.session.user) {
            res.write('Hi ' + req.session.user.username + ' !<br>');
        }
        else {
            //res.write('<a href=' + url + '>connect on flickr</a> | ');
            res.write('<a href="#" onclick="$(document).scrollTo( \'100%\', 3000); autoScroll = true; return false;">automatic scrolling</a><br>');
        }
        if (uri.pathname.length > 1) {
            tags = uri.pathname.substring(1);
        }
        // Search for photos with some tags
        flickr.photos.search({
            tags: tags,
            per_page: size,
            safe_search: 3
        }, function(err, results) {
            if (!err) {
                var photos = results.photo;
                res.write("<div class='zone'>");
                for (var i = 0; i < photos.length; i++) {
                    link = '\n<pre class=\'loadme\'><!-- <span style="display:block;width:' + (270 * perStrip) + 'px;height:240px;background-color:#000;vertical-align: middle;">';
                    for (var j = 0; j < perStrip; j++) {
                        if (i == 15) {
                            res.write('<script type="text/javascript">loadNext("'+tags+'");</script>');
                        }
                        var src = 'http://farm' + photos[i].farm + '.static.flickr.com/' + photos[i].server + '/' + photos[i].id + '_' + photos[i].secret + '_m.jpg';
                        var href = 'http://www.flickr.com/photos/' + photos[i].owner + '/' + photos[i].id + '/';
                        link += '\n\t<a href=' + href + ' target=_BLANK><img src=\'' + src + '\' border=\'0\'/></a>';
                        i++;
                        if (i >= photos.length) {
                            break;
                        }
                    }
                    link += '</span> <script type="text/javascript">if(autoScroll) $(document).scrollTo( \'100%\', 2000); counter += 4;</script>--></pre>\n';
                    res.write(link);
                }
                res.write("</div>");
                res.end(footer);
                console.log('request ended');
            }
            else {
                fail(err);
                res.end(err.code + ' -  ' + err.message);
            }
        });
    });
});
app.listen(port);
console.log("Audience is listening " + port + "...");