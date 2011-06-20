var autoScroll = false;
var counter = 0;
var page = 1;

function gup(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.href);
    if (results == null) return "";
    else return results[1];
}
var tunneling = '';

function init() {
    var q = gup('q');
    if (q) {
        document.getElementById('tags').value = q;
        currentSearch++;
        document.getElementById('loader').innerHTML = 'Loading...';
        document.getElementById('idzone').innerHTML = '';
        page = 1;
        loadNext(document.getElementById('tags').value);
        autoScroll = true;
    }
    var t = gup('t');
    if (t) {
        tunneling = '&tunneling=true';
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
    console.log('cleanning ' + image);
    image = image - 40;
    for (i = 0; i < 4; i++) {
        var pclass = '.i' + image;
        if (image >= 0) {
            console.log('remove ' + pclass);
            $(pclass).remove();
        }
        image++;
    }
}