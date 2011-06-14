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
var size = 32;
var perStrip = 4;
console.log("Using " + keys.api_key + "/" + keys.shared_secret);
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
    if (process.env.VMC_APP_PORT) {
        path = process.env.HOME + '/app/' + path;
    }
    fs.readFile(path, function(err, data) {
        if (err) throw err;
        staticFiles[name] = data;
        console.log(path + ' in cache, length is ' + data.length);
        if (uri) {
            app.get(uri, function(req, res) {
                res.writeHead(200, {
                    'Content-Type': mime(path)
                });
                console.log('serve ' + path + ', length is ' + staticFiles[name].length);
                res.end(staticFiles[name]);
            });
            console.log(uri + ' mounted');
        }
    });
}
String.prototype.endsWith = function(str) {
    return (this.match(str + "$") == str);
};

function mime(file) {
    if (file.endsWith('.js')) return 'application/javascript';
    if (file.endsWith('.html')) return 'text/html';
    if (file.endsWith('.css')) return 'text/css';
}
loadStaticFile('footer', 'www/fragments/footer.html');
loadStaticFile('header', 'www/fragments/header.html');
loadStaticFile('css', 'www/lib/default.css', '/lib/style.css');
loadStaticFile('jquery', 'www/lib/jquery-1.6.1.min.js', '/lib/jquery-1.6.1.min.js');
loadStaticFile('lazyloader', 'www/lib/jquery.lazyloader.min.js', '/lib/jquery.lazyloader.min.js');
loadStaticFile('scrollTo', 'www/lib/jquery.scrollTo.js', '/lib/jquery.scrollTo.js');
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
var popular = null;
setInterval(function() {
    console.log('reload popular tags');
    var parameters = {
        count: 20,
        period: 'week'
    };
    flickr.tags.getHotList(parameters, function(err, results) {
        popular = results.tag;
    });
}, 1000 * 60);

app.get('/popular', function(req, res) {
    var randomNumber = Math.floor(Math.random()*21);
        res.writeHead(200, {
        'Content-Type': 'application/json'
    });
    if (!popular) {
        console.log('load popular tags');
        var parameters = {
            count: 20,
            period: 'week'
        };
        flickr.tags.getHotList(parameters, function(err, results) {
            popular = results.tag;
            console.log(randomNumber);
            res.end(popular[randomNumber-1]._content);
        });
    } else {
        console.log(randomNumber);
        res.end(popular[randomNumber-1]._content);
    }
});

/*app.get('/cache.appcache', function(req, res) {
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
    res.write('NETWORK\n');
    res.write('http://*\n');
    res.write('http://ajax/*\n');
    res.end();
});*/
app.get('/ajax', function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/html',
        'Cache-control': 'no-store'
    });
    if (req.query.method == 'photos') {
        var tags;
        if(req.query.tags) {
            tags = req.query.tags.replace(/ /g, '+');
        }
        if (req.session.user) {
            console.log('[' + req.client.remoteAddress + '] [' + new Date() + '] ' + flickr.user.username + ' more photos for ' + tags + '/' + req.query.plat + '/' + req.query.plon + ' (page ' + req.query.page + ')');
        }
        else {
            console.log('[' + req.client.remoteAddress + '] [' + new Date() + '] more photos for ' + tags + '/' + req.query.plat + '/' + req.query.plon + ' (page ' + req.query.page + ')');
        }
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
                for (var i = 0; i < photos.length;) {
                    if (i > 16 && preLoad == '') {
                        preLoad = '\n<pre class=\'loadme\'><!-- ';
                        postLoad = '</script>--></pre>\n';
                        res.write('<script type="text/javascript">if(autoScroll) $(document).scrollTo( \'100%\', 2000);</script>');
                    }
                    link = preLoad + '<span style="display:block;width:' + (270 * perStrip) + 'px;height:240px;background-color:rgba(255,255,255,1);vertical-align: middle;">';
                    for (var j = 0; j < perStrip; j++) {
                        if (i == 8) {
                            if (req.query.plat && req.query.plon) {
                                res.write(preLoad + '\n<script type="text/javascript">loadNext();</script>' + postLoad);
                            }
                            else {
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
                    if (preLoad == '') {
                        link += '</span>';
                    } else {
                        link += '</span> <script type="text/javascript">if(autoScroll) $(document).scrollTo( \'100%\', 2000); counter += 4;</script>' + postLoad;
                    }
                    res.write(link);
                }
                if(photos.length < size) {
                    console.log('the end');
                    res.write("<script type='text/javascript'>document.getElementById('loader').innerHTML = 'the <span style=\\'color:rgba(255,0,132,1);\\'>end</span><br/><br/><br/>';</script>");
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
    if (req.session && req.session.user) {
        console.log('[' + req.client.remoteAddress + '] [' + new Date() + '] ' + flickr.user.username + ' here');
    }
    else {
        console.log('[' + req.client.remoteAddress + '] [' + new Date() + '] someone look for here');
    }
    if (!tags) {
        tags = 'cloud';
    }
    res.writeHead(200, {
        'Content-Type': 'text/html',
        'Cache-control': 'no-store'
    });
    res.write(staticFiles.header);
    flickr.getLoginUrl('read', null, function(err, url, frob) {
        //if (req.session.user) {
        //    res.write('Hi ' + req.session.user.username + ' !<br>');
        //}
        res.end(staticFiles.footer);
    });
});
console.log("Opening " + port + "...");
app.listen(port);
console.log("Audience is listening " + port + "...");