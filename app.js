
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

var staticFiles = {};

function loadStaticFile(name, path, uri) {
    var header = null;
    if(process.env.VMC_APP_PORT) {
        path = process.env.HOME + '/' + path;
    }
    fs.readFile(path, function(err, data) {
        if (err) throw err;
        staticFiles[name] = data;
        console.log(path + ' in cache, length is ' + data.length);
    });
    if (uri) {
        app.get(uri, function(req, res) {
            res.writeHead(200, {
                'Content-Type': 'text/html'
            });
            res.end(staticFiles[name]);
        });
    }
}

loadStaticFile('footer', 'www/fragments/footer.html');
loadStaticFile('header', 'www/fragments/header.html');
loadStaticFile('css', 'www/lib/default.css', '/lib/style.css');
loadStaticFile('jquery','www/lib/jquery-1.6.1.min.js', '/lib/jquery-1.6.1.min.js');
loadStaticFile('lazyloader','www/lib/jquery.lazyloader.min.js', '/lib/jquery.lazyloader.min.js');
loadStaticFile('scrollTo','www/lib/jquery.scrollTo.js', '/lib/jquery.scrollTo.js');

app.get('/favicon.ico', function(req, res) {
    res.writeHead(404, "Not found", {
        'Content-Type': 'text/html'
    });
    res.end();
});
app.get('/cache.appcache', function(req, res) {
    res.writeHead(404, "Not found", {
        'Content-Type': 'text/html'
    });
    res.end();
});
/*
app.get('/cache.appcache', function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/cache-manifest'
    });
    res.write('CACHE MANIFEST\n');
    res.write('# version 0.0.4\n');
    res.write('\n');
    res.write('CACHE:\n');
    res.write('/lib/jquery-1.6.1.min.js\n');
    res.write('/lib/jquery.lazyloader.min.js\n');
    res.write('/lib/jquery.scrollTo.js\n');
    res.write('/lib/style.css\n');
    res.end();
});*/

app.get('/ajax', function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/html'
    });
    if (req.query.method == 'photos') {
        if (req.session.user) {
            console.log('[' + req.client.remoteAddress + '] [' + new Date() + '] ' + flickr.user.username + ' more photos for ' + req.query.tags + '/' + req.query.plat + '/' + req.query.plon + ' (page ' + req.query.page + ')');
        }
        else {
            console.log('[' + req.client.remoteAddress + '] [' + new Date() + '] more photos for ' + req.query.tags + '/' + req.query.plat + '/' + req.query.plon + ' (page ' + req.query.page + ')');
        }
        var tags = req.query.tags;
        var lat = req.query.lat;
        var lon = req.query.lon;
        if (!tags) {
            tags = 'cloud';
        }
        var parameters = {
            tags: tags,
            per_page: size,
            safe_search: 3,
            page: req.query.page
        };
        if (req.query.plat && req.query.plon) {
            parameters = {
                lat: req.query.plat,
                lon: req.query.plon,
                per_page: size,
                safe_search: 3,
                page: req.query.page
            };
        }
        var preLoad = '\n<pre class=\'loadme\'><!-- ';
        var postLoad = '</script>--></pre>\n';
        if (req.query.page == 1) {
            preLoad = '';
            postLoad = '';
        }
        flickr.photos.search(parameters, function(err, results) {
            if (!err) {
                var photos = results.photo;
                console.log('got ' + photos.length + ' photos');
                for (var i = 0; i < photos.length;) {
                    link = preLoad + '<span id=\'s_'+i+'\'style="display:block;width:' + (270 * perStrip) + 'px;height:240px;background-color:#000;vertical-align: middle;">';
                    for (var j = 0; j < perStrip; j++) {
                        if (i == 10) {
                            if (req.query.plat && req.query.plon) {
                                res.write(preLoad + '\n<script type="text/javascript">loadNext();</script>' + postLoad);
                            } else {
                                res.write(preLoad + '\n<script type="text/javascript">loadNext("' + tags + '");</script>' + postLoad);
                            }
                        }
                        var src = 'http://farm' + photos[i].farm + '.static.flickr.com/' + photos[i].server + '/' + photos[i].id + '_' + photos[i].secret + '_m.jpg';
                        var href = 'http://www.flickr.com/photos/' + photos[i].owner + '/' + photos[i].id + '/';
                        link += '\n\t<a id="p_' + i + '" href=' + href + ' target=_BLANK><img src=\'' + src + '\' border=\'0\'/></a>';
                        i++;
                        if (i >= photos.length) {
                            break;
                        }
                    }
                    link += '</span> <script type="text/javascript">if(autoScroll) $(document).scrollTo( \'100%\', 2000); counter += 4;</script>' + postLoad;
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
        console.log('[' + req.client.remoteAddress + '] [' + new Date() + '] ' + flickr.user.username + ' here');
    }
    else {
        console.log('[' + req.client.remoteAddress + '] [' + new Date() + '] someone look for here');
    }
    if (!tags) {
        tags = 'cloud';
    }
    res.writeHead(200, {
        'Content-Type': 'text/html'
    });
    res.write(staticFiles.header);
    flickr.getLoginUrl('read', null, function(err, url, frob) {
        if (req.session.user) {
            res.write('Hi ' + req.session.user.username + ' !<br>');
        }
        else {
            //res.write('<a href=' + url + '>Connect on flickr</a>');
            res.write('<a href="#" onclick="page = 1;loadNext(\'street\'); return false;">Search</a>');
            res.write(' | <a href="#" onclick="$(document).scrollTo( \'100%\', 3000); autoScroll = true; return false;">Run</a>');
            res.write(' | <a href="#" onClick="myPosition(); return false;">Near my place</a><div id="myposition"></div><br>');
        }
        if (uri.pathname.length > 1) {
            tags = uri.pathname.substring(1);
        }
        res.write("<div class='zone'></div>");
        res.end(staticFiles.footer);
    });
});
app.listen(port);
console.log("Audience is listening " + port + "...");