var autoScroll = false;
var stopScrolling = false;
var counter = 0;
var page = 1;
var gaAccount = 'UA-13124995-3';

  var _gaq = _gaq || [];
  _gaq.push(['_setAccount', 'UA-13124995-3']);
  _gaq.push(['_trackPageview']);

  (function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  })();

function trackImage() {
    _gaq.push(['_trackEvent', 'image', 'view']);
}

function track(page, action) {
    if(page==1) {
        _gaq.push(['_trackEvent', 'click', action]);
    }
    _gaq.push(['_trackPageview']);
}

function trackLocation(page, action) {
    if(page==1) {
        _gaq.push(['_trackEvent', 'location', action]);
    }
    _gaq.push(['_trackPageview']);
}

function trackRandom(page, action) {
    if(page==1) {
        _gaq.push(['_trackEvent', 'random', action]);
    }
    _gaq.push(['_trackPageview']);
}

function trackInterestingness(page) {
    if(page==1) {
        _gaq.push(['_trackEvent', 'interestingness']);
    }
    _gaq.push(['_trackPageview']);
}

function gup(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.href);
    if (results == null) return "";
    else return results[1];
}
var tunneling = '';

function connect() {
    document.getElementById('connect').innerHTML = "<b>Hello</b>";
}

function updateSocialByTags(tags) {
    var url = 'http://inflickr.cloudfoundry.com%3Fq%3D' + tags.replace(/ /g,'+') + '';
    console.log(url);
    var text = ('%23' + tags + ' on infli·kr').replace(/ /g,'%20');
    document.getElementById('social').innerHTML = '<iframe allowtransparency="true" frameborder="0" scrolling="no" src="http://platform.twitter.com/widgets/tweet_button.html?count=horizontal&via=inflickr&text='+text+'&url='+url+'" style="width:130px; height:50px;"></iframe>';
}

function updateSocial() {
    var url = 'http://inflickr.cloudfoundry.com';
    var text = ('infli·kr... %23flickr for lazy people').replace(/ /g,'%20');
    document.getElementById('social').innerHTML = '<iframe allowtransparency="true" frameborder="0" scrolling="no" src="http://platform.twitter.com/widgets/tweet_button.html?count=horizontal&via=inflickr&text='+text+'&url='+url+'" style="width:130px; height:50px;"></iframe>';
}

function init() {
    var t = gup('t');
    if (t) {
        tunneling = '&tunneling=true';
    }
    var q = gup('q');
    if (q) {
        document.getElementById('tags').value = q.replace(/%20/g, ' ').replace(/%23/g, '#').replace(/%3C/g, '<').replace(/%3E/g, '>');
        currentSearch++;
        document.getElementById('loader').innerHTML = 'Loading...';
        document.getElementById('idzone').innerHTML = '';
        page = 1;
        loadNext(document.getElementById('tags').value);
        autoScroll = true;
    }
    var u = gup('u');
    if (u) {
        document.getElementById('tags').value = 'u:' + u.replace(/%20/g, ' ');
        currentSearch++;
        document.getElementById('loader').innerHTML = 'Loading...';
        document.getElementById('idzone').innerHTML = '';
        page = 1;
        loadNext(document.getElementById('tags').value);
        autoScroll = true;
    }
}

$(document).ready(function() {
    $('pre.loadme').lazyLoad();
    $('pre.morestuff').lazyLoad();
});



function randomTag() {
    if(page == 1) updateSocial();
    var vurl = "/popular";
    $.ajax({
        url: vurl,
        dataType: 'text',
        context: document.body,
        error: function(data) {
            document.getElementById('tags').value = '#' + data;
        },
        success: function(data) {
            document.getElementById('tags').value = '#' + data;
            page = 1;
            trackRandom(page, '#' + data);
            loadNextInternal(document.getElementById('tags').value);
            autoScroll = true;
        }
    });
}

function loadNextInternal(tags) {
    tags = tags.replace(/#/g, '$')
    if(page == 1) updateSocialByTags(tags);
    var vurl = "/ajax";
    if (tags) {
        vurl = "/ajax?method=photos&tags=" + tags + "&page=" + (page++) + "&sid=" + currentSearch + tunneling;
    }
    else {
        vurl = "/ajax?method=photos&plon=" + lon + "&plat=" + lat + "&page=" + (page++) + "&sid=" + currentSearch + tunneling;
    }
    $.ajax({
        url: vurl,
        context: document.body,
        error: function(data) {
            console.log("error: " + data);
        },
        success: function(data) {
            $('.zone').append(data);
            $('pre.loadme').lazyLoad();
        }
    });
}

function loadNext(tags) {
    track(page, tags);
    loadNextInternal(tags);
}
var currentSearch = 0;
var lat = 0;
var lon = 0;

function getPosition(position) {
    var geo = position.coords.latitude + ',' + position.coords.longitude;
    document.getElementById('tags').value = geo;
    trackLocation(page, 'location', geo);
    loadNextInternal(geo);
}

function myPosition() {
    navigator.geolocation.getCurrentPosition(getPosition);
}

Date.prototype.getDOY = function() {
    var onejan = new Date(this.getFullYear(), 0, 1);
    return Math.ceil((this - onejan) / 86400000);
};

function remove(image) {
    image = image - 40;
    for (i = 0; i < 4; i++) {
        var pclass = '.i' + image;
        if (image >= 0) {
            $(pclass).remove();
        }
        image++;
    }
}
var initialized = false;

function scroll(sid, percent, duration) {
    if(!initialized) {
        initialized = true;
        console.log('Hook the scroller');
        setInterval(function()  {
            if(stopScrolling == false) {
                $(document).scrollTo('+=440px', 3000);
            }
        }, 3000);
    }
}

function zoom(imgSrc) {
    stopScrolling = true;
    $(document).scrollTo('+=1px', 0 );
    console.log('stop');
}

function dezoom() {
    stopScrolling = false;
    console.log('resume');
}