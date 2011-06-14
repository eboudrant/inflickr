var Tags= function Tags(request) {
    this._request= request;
};

Tags.prototype.getHotList= function(arguments, callback) {
    this._request.executeRequest("flickr.tags.getHotList", arguments, false, null, callback);
};

exports.Tags= Tags;