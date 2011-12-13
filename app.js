require.paths.unshift('./flickrnode');
require.paths.unshift('./node_modules/express/lib');

var INFLICKR_APP = {};
INFLICKR_APP.port = process.env.VMC_APP_PORT || process.env.C9_PORT || 8001;
INFLICKR_APP.api_key = process.env.API_KEY || "17f1d14ee2c43e10b94ebfd62915869d";
INFLICKR_APP.api_secret = process.env.SECRET || "2d965f23923aaebb";
INFLICKR_APP.size = 32;
INFLICKR_APP.perStrip = 4;
INFLICKR_APP.popular = undefined;

var FlickrAPI = require('flickr').FlickrAPI;
var express = require("express");
var http = require("http");
var FlickrKeys = function FlickrKeys() {
    this._configure(INFLICKR_APP.api_key, INFLICKR_APP.api_secret);
};
FlickrKeys.prototype._configure = function(api_key, shared_secret) {
    this.api_key = api_key;
    this.shared_secret = shared_secret;
};

INFLICKR_APP.keys = new FlickrKeys();

var flickr = new FlickrAPI(INFLICKR_APP.keys.api_key, INFLICKR_APP.keys.shared_secret);

console.log("Using " + INFLICKR_APP.keys.api_key + "/" + INFLICKR_APP.keys.shared_secret);
console.log(process.env);

var app = express.createServer();
app.use(express.cookieParser());
app.use(express.session({
    secret: "dexboys why not"
}));
app.use(express.static(__dirname + '/www'));
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

setInterval(function() {
    var parameters = {
        count: 40,
        period: 'day'
    };
    flickr.tags.getHotList(parameters, function(err, results) {
        INFLICKR_APP.popular = results.tag;
    });
}, 1000 * 60);

app.get('/popular', function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/html',
        'Cache-control': 'no-store'
    });
    var randomNumber = Math.floor(Math.random() * 21);
    if (randomNumber < 0) {
        randomNumber = 0;
    }
    if (randomNumber > 39) {
        randomNumber = 39;
    }
    if (!INFLICKR_APP.popular) {
        console.log('load popular tags');
        var parameters = {
            count: 40,
            period: 'day'
        };
        flickr.tags.getHotList(parameters, function(err, results) {
            INFLICKR_APP.popular = results.tag;
            res.end(INFLICKR_APP.popular[randomNumber]._content);
        });
    }
    else {
        res.end(INFLICKR_APP.popular[randomNumber]._content);
    }
});

var managePages = function(err, results, req, res, tags) {
        var preLoad = '\n<pre class=\'loadme\'><!-- ';
        var postLoad = '</script>--></pre>\n';
        if (req.query.page == 1) {
            preLoad = '';
            postLoad = '</script>';
        }
        if (!err) {
            var photos = results.photo;

            for (var i = 0; i < photos.length;) {
                
                var imagePreloading = '\nheavyImage = new Image(); ';
                
                if (i>16 && preLoad === '') {
                    preLoad = '\n<pre class=\'loadme\'><!-- ';
                    postLoad = 'remove(' + ((req.query.page - 1) * INFLICKR_APP.size + i) + ');\n</script>--></pre>\n';
                    if (req.query.page == 1) {
                        res.write('\n<script type="text/javascript">if(autoScroll) scroll(' + req.query.sid + ', 100, 2000);</script>');
                    }
                }
                var link = preLoad + '\n<span style="display:block;width:' + (270 * INFLICKR_APP.perStrip) + 'px;height:240px;background-color:rgba(255,255,255,1);vertical-align: middle;">';
                
                for (var j = 0; j < INFLICKR_APP.perStrip; j++) {
                    
                    
                    var flickrPhoto = photos[i];
                    
                    var preUrl = 'http://farm' + flickrPhoto.farm + '.static.flickr.com/' + flickrPhoto.server + '/' + flickrPhoto.id + '_' + flickrPhoto.secret;
                    if (req.query.tunneling) {
                        preUrl = '/pass?farm=' + flickrPhoto.farm + '&path=/' + flickrPhoto.server + '/' + flickrPhoto.id + '_' + flickrPhoto.secret;
                    }

                    flickrPhoto.medium = preUrl + '_m.jpg';
                    flickrPhoto.big = preUrl + '_m.jpg';
                    flickrPhoto.href = 'http://www.flickr.com/photos/' + flickrPhoto.owner + '/' + flickrPhoto.id + '/';
                    
                    if (i == 8) {
                        if (req.query.interestingness) {
                            res.write(preLoad + '\n<script type="text/javascript">interestingness();' + postLoad);
                        }
                        else if (req.query.plat && req.query.plon) {
                            res.write(preLoad + '\n<script type="text/javascript">loadNext();' + postLoad);
                        }
                        else {
                            res.write(preLoad + '\n<script type="text/javascript">loadNext("' + tags + '");' + postLoad);
                        }
                    }
                    link += '\n\t<a class="i' + ((req.query.page - 1) * INFLICKR_APP.size + i) + '" href=' + flickrPhoto.href + ' onmouseover=\'zoom("' + flickrPhoto.big + '");\' onmouseout=\'dezoom();\' target=_BLANK><img src=\'' + flickrPhoto.medium + '\' border=\'0\'/></a>';
                    if (preLoad !== '') {
                        link += '\n<script type="text/javascript">remove(' + ((req.query.page - 1) * INFLICKR_APP.size + i) + ');</script>';
                    }
                    i++;
                    imagePreloading += '\nheavyImage.src = "' + flickrPhoto.medium + '";trackImage();';
                    if (i >= photos.length) {
                        break;
                    }
                }
                res.write('\n<script type="text/javascript">' + imagePreloading + '\n</script>\n');
                if (preLoad === '') {
                    link += '\n</span>';
                }
                else if ((i%4)===0) {
                    link += '\n</span>\n<script type="text/javascript">counter += 4;' + postLoad;
                }
                res.write(link);
            }
            if (photos.length < INFLICKR_APP.size) {
                res.write("<script type='text/javascript'>document.getElementById('loader').innerHTML = 'the <span style=\\'color:rgba(255,0,132,1);\\'>end</span><br/><br/><br/>';</script>");
            }
            res.end();
        }
        else {
            res.end(err.code + ' -  ' + err.message);
            console.log('ERROR: ' + err.code + ' -  ' + err.message);
            fail(err);
        }
    };
/**
 * Flick farm proxy path
 */
app.get('/pass', function(req, res) {
    if (req.query.path && req.query.farm) {
        var options = {
            port: 80,
            host: 'farm' + req.query.farm + '.static.flickr.com',
            method: 'GET',
            path: req.query.path,
            headers: {
                'Connection': 'keep-alive'
            }
        };
        var request = http.request(options);
        request.on('response', function(response) {
            res.writeHead(200, response.headers);
            response.on('data', function(chunk) {
                res.write(chunk);
            });
            response.on('end', function() {
                res.end();
            });
        });
        request.end();
    }
    else {
        res.writeHead(200, {
            'Content-Type': 'text/html',
            'Cache-control': 'no-store'
        });
        res.end('not found');
    }
});
/**
 * Entry point for jquery/ajax invocations
 */
app.get('/ajax', function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/html',
        'Cache-control': 'no-store'
    });
    if (req.query.connect) {
        return;
    }
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
        if (req.query.tags) {
            tags = req.query.tags.replace(/ /g, '+');
        }
        if (req.session.user) {
            console.log('[' + req.client.remoteAddress + '] [' + new Date() + '] ' + flickr.user.username + ' more photos for ' + tags + '/' + req.query.plat + ',' + req.query.plon + '/' + req.query.interestingness + ' (page ' + req.query.page + ')');
        }
        else {
            console.log('[' + req.client.remoteAddress + '] [' + new Date() + '] more photos for ' + tags + '/' + req.query.plat + ',' + req.query.plon + '/' + req.query.interestingness + ' (page ' + req.query.page + ')');
        }
        if (!tags) {
            tags = 'cloud';
        }
        var parameters = {
            per_page: INFLICKR_APP.size,
            safe_search: 3,
            page: req.query.page,
            sort: 'interestingness-desc'
        };
        if (tags.length > 0 && tags.charAt(0) == '$') {
            parameters.tags = tags.replace(/\+\$/g, ',').replace(/\$/g, '');
            parameters.tag_mode = 'all';
            parameters.sort = 'relevance';
        }
        else {
            parameters.text = tags.replace(/\+/g, '%20');
        }
        if (req.query.plat && req.query.plon) {
            parameters = {
                lat: req.query.plat,
                lon: req.query.plon,
                sort: undefined,
                per_page: INFLICKR_APP.size,
                safe_search: 3,
                page: req.query.page
            };
        }
        if (req.query.tags && req.query.tags.replace(/%20/g, ' ').lastIndexOf('u:', 0) === 0) {
            req.query.tags = req.query.tags.replace(/u:/g, '@');
        }
        if (req.query.tags && req.query.tags.replace(/%20/g, ' ').lastIndexOf('@', 0) === 0) {
            flickr.people.findByUsername(req.query.tags.replace('@', '').replace(/ /g, '+'), function(err, results) {
                var parameters = {
                    tags: req.query.tags.replace(/ /g, '%20'),
                    per_page: INFLICKR_APP.size,
                    safe_search: 3,
                    page: req.query.page
                };
                if (results && results.id) {
                    parameters = {
                        user_id: results.id,
                        per_page: INFLICKR_APP.size,
                        safe_search: 3,
                        page: req.query.page
                    };
                }
                var photoSearchCallback = function(err, results) {
                        managePages(err, results, req, res, tags);
                    };
                flickr.photos.search(parameters, photoSearchCallback);
            });
        }
        else {
            if (req.query.interestingness) {
                var d = new Date();
                d.setDate(d.getDate() - 1);
                var curr_date = d.getDate();
                var curr_month = d.getMonth();
                if (curr_date < 10) {
                    curr_date = '0' + curr_date;
                }
                if (curr_month < 10) {
                    curr_month = '0' + curr_month;
                }
                var curr_year = d.getFullYear();
                parameters = {
                    date: curr_year + "-" + curr_month + "-" + curr_date,
                    per_page: INFLICKR_APP.size,
                    page: req.query.page
                };
            }
            var photoSearchCallback = function(err, results) {
                    managePages(err, results, req, res, tags);
                };
            var matches = req.query.tags.match(/([0-9.\-]+).+?([0-9.\-]+)/);
            if (matches) {
                var parsedLat = parseFloat(matches[1]);
                var parsedLon = parseFloat(matches[2]);
                parameters = {
                    //min_date_taken: '2008-02-02',
                    radius: 20,
                    lat: parsedLat,
                    lon: parsedLon,
                    sort: undefined,
                    per_page: INFLICKR_APP.size,
                    safe_search: 3,
                    page: req.query.page
                };
            }
            if (req.query.tags && req.query.tags == '<recent>') {
                flickr.photos.getRecent(parameters, photoSearchCallback);
            }
            else if (req.query.tags && req.query.tags == '<interestingness>') {
                flickr.interestingness.getList(parameters, photoSearchCallback);
            }
            else {
                flickr.photos.search(parameters, photoSearchCallback);
            }
        }
    }
});
console.log('[' + new Date() + '] Opening ' + INFLICKR_APP.port + '...');
app.listen(INFLICKR_APP.port);
console.log('[' + new Date() + '] Audience is listening ' + INFLICKR_APP.port + '...');

function connect() {
    // Authentication process. get the frob/token
    //var oauth_nonce = '';
    //var oauth_timestamp = '1305583298';
    //var oauth_callback = '';
    //var oauthUrl = 'http://www.flickr.com/services/oauth/request_token' + '?oauth_callback=' + oauth_callback + '&oauth_consumer_key=' + keys.api_key + '&oauth_nonce=' + oauth_nonce + '&oauth_signature_method=HMAC-SHA1' + '&oauth_timestamp=' + oauth_timestamp + '&oauth_version=1.0' + '';
    //var encoded = str_sha1('GET&' + oauthUrl);
}

function fail(err) {
    console.log('processing request...error: ERR: ' + err.code + ' -  ' + err.message);
}