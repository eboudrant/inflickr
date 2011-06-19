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
app.use(express.static(__dirname + '/www'));
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

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

var popular = null;
setInterval(function() {
    var parameters = {
        count: 40,
        period: 'day'
    };
    flickr.tags.getHotList(parameters, function(err, results) {
        popular = results.tag;
    });
}, 1000 * 60);

app.get('/popular', function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/html',
        'Cache-control': 'no-store'
    });
    var randomNumber = Math.floor(Math.random()*21);
    if(randomNumber < 0) {
        randomNumber = 0;
    }
    if(randomNumber > 39) {
        randomNumber = 39;
    }
    if (!popular) {
        console.log('load popular tags');
        var parameters = {
            count: 40,
            period: 'day'
        };
        flickr.tags.getHotList(parameters, function(err, results) {
            popular = results.tag;
            console.log(randomNumber);
            res.end(popular[randomNumber]._content);
        });
    } else {
        console.log(randomNumber);
        res.end(popular[randomNumber]._content);
    }
});

var managePages = function(err, results, req, res, tags) {
        if (req.query.page == 1) {
            preLoad = '';
            postLoad = '';
        } else {
            preLoad = '\n<pre class=\'loadme\'><!-- ';
            postLoad = '</script>--></pre>\n';
        }
        if (!err) {
            var photos = results.photo;
            
            for (var i = 0; i < photos.length;) {
                if (i > 16 && preLoad == '') {
                    preLoad = '\n<pre class=\'loadme\'><!-- ';
                    postLoad = '</script>--></pre>\n';
                    res.write('<script type="text/javascript">if(autoScroll) scroll('+ req.query.sid +');</script>');
                }
                link = preLoad + '<span style="display:block;width:' + (270 * perStrip) + 'px;height:240px;background-color:rgba(255,255,255,1);vertical-align: middle;">';
                var imagePreloading = '';
                for (var j = 0; j < perStrip; j++) {
                    if (i == 8) {
                        if (req.query.interestingness) {
                            res.write(preLoad + '\n<script type="text/javascript">interestingness();</script>' + postLoad);
                        } else if (req.query.plat && req.query.plon) {
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
                    imagePreloading += 'heavyImage = new Image(); heavyImage.src = "'+src+'";\n';
                    if (i >= photos.length) {
                        break;
                    }
                }
                if (preLoad == '') {
                    link += '</span>';
                }
                else {
                    link += '</span> <script type="text/javascript">if(autoScroll) scroll('+ req.query.sid +'); counter += 4;</script>' + postLoad;
                }
                res.write(link);
                res.write('<script type="text/javascript">' + imagePreloading + ' console.log("image preloading...");</script>');
            }
            if (photos.length < size) {
                console.log('the end');
                res.write("<script type='text/javascript'>document.getElementById('loader').innerHTML = 'the <span style=\\'color:rgba(255,0,132,1);\\'>end</span><br/><br/><br/>';</script>");
            }
            res.end();
        }
        else {
            fail(err);
            res.end(err.code + ' -  ' + err.message);
        }
    };
        
app.get('/ajax', function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/html',
        'Cache-control': 'no-store'
    });
    
    if (!req.query.sid) {
        res.end('{"error": "no page sid"}');
        return;
    }
    
    if (!req.query.page) {
        res.end('{"error": "no page defined"}');
        return;
    }
    
    if (!req.query.method) {
        res.end('{"error": "no method defined"}');
        return;
    }
    
    if (req.query.method == 'photos') {
        var tags;
        if(req.query.tags) {
            tags = req.query.tags.replace(/ /g, '+');
        }
        if (req.session.user) {
            console.log('[' + req.client.remoteAddress + '] [' + new Date() + '] ' + flickr.user.username + ' more photos for ' + tags + '/' + req.query.plat + '/' + req.query.plon + '/' + req.query.interestingness + ' (page ' + req.query.page + ')');
        }
        else {
            console.log('[' + req.client.remoteAddress + '] [' + new Date() + '] more photos for ' + tags + '/' + req.query.plat + '/' + req.query.plon + '/' + req.query.interestingness + ' (page ' + req.query.page + ')');
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
        if (req.query.interestingness) {
            var d = new Date ();
            d.setDate(d.getDate()-1);
            var curr_date = d.getDate();
            var curr_month = d.getMonth();
            if(curr_date<10) {
                curr_date = '0' + curr_date;
            }
            if(curr_month<10) {
                curr_month = '0' + curr_month;
            }
            var curr_year = d.getFullYear();
            parameters = {
                date : curr_year + "-" + curr_month + "-" + curr_date,
                per_page: size,
                page: req.query.page
            };
        }
        var preLoad = '\n<pre class=\'loadme\'><!-- ';
        var postLoad = '</script>--></pre>\n';

        var photoSearchCallback = function(err, results) {
            managePages(err, results, req, res, tags);
        }
        if (req.query.interestingness) {
            flickr.interestingness.getList(parameters, photoSearchCallback);
        } else { 
            flickr.photos.search(parameters, photoSearchCallback);
        }
    }
});

console.log("Opening " + port + "...");
app.listen(port);
console.log("Audience is listening " + port + "...");