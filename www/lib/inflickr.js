var autoScroll = false;
var counter = 0;
var page = 1;
var gaAccount = 'UA-13124995-3';
var _gaq = _gaq || [];
_gaq.push(['_setAccount', gaAccount]);
_gaq.push(['_trackPageview']);
(function() {
    var ga = document.createElement('script');
    ga.type = 'text/javascript';
    ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ga, s);
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

function gup(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.href);
    if (results == null) return "";
    else return results[1];
}
var tunneling = '';

function updateSocialByTags(tags) {
    var url = 'http://infli.kr%3Fq%3D' + tags.replace(/ /g,'+') + '';
    console.log(url);
    var text = ('%23' + tags + ' on infli·kr').replace(/ /g,'%20');
    document.getElementById('social').innerHTML = '<iframe allowtransparency="true" frameborder="0" scrolling="no" src="http://platform.twitter.com/widgets/tweet_button.html?count=horizontal&via=inflickr&text='+text+'&url='+url+'" style="width:130px; height:50px;"></iframe>';
}

function updateSocial() {
    var url = 'http://infli.kr';
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
        document.getElementById('tags').value = q.replace(/%20/g, ' ');
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

function scroll(sid) {
    if (currentSearch == sid) {
        $(document).scrollTo('100%', 2000);
    }
}

function randomTag() {
    track(page, 'random');
    if(page == 1) updateSocial();
    var vurl = "/popular";
    $.ajax({
        url: vurl,
        dataType: 'text',
        context: document.body,
        error: function(data) {
            document.getElementById('tags').value = data;
        },
        success: function(data) {
            document.getElementById('tags').value = data;
            page = 1;
            loadNext(document.getElementById('tags').value);
            autoScroll = true;
        }
    });
}

function interestingness() {
    track(page, 'interestingness');
    if(page == 1) updateSocial();
    var vurl = "/ajax?method=photos&interestingness=true&page=" + (page++) + "&sid=" + currentSearch + tunneling;
    $.ajax({
        url: vurl,
        context: document.body,
        error: function(data) {
            console.log("error: " + data);
        },
        success: function(data) {
            document.getElementById('tags').value = '';
            $('.zone').append(data);
            $('pre.loadme').lazyLoad();
        }
    });
}

function loadNext(tags) {
    track(page, tags);
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
var currentSearch = 0;
var lat = 0;
var lon = 0;

function getPosition(position) {
    track(page, 'location');
    if(page == 1) updateSocial();
    var infoposition = " (" + position.coords.latitude + ", ";
    infoposition += position.coords.longitude + ")";
    document.getElementById('tags').value = infoposition;
    lat = position.coords.latitude;
    lon = position.coords.longitude;
    page = 2;
    $.ajax({
        url: "/ajax?method=photos&plon=" + lon + "&plat=" + lat + "&page=1&sid=" + currentSearch + tunneling,
        context: document.body,
        error: function(data) {
            console.log("error : " + data);
        },
        success: function(data) {
            $('.zone').append(data);
            $('pre.loadme').lazyLoad();
        }
    });
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