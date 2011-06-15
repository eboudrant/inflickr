var Interestingness= function Interestingness(request) {
    this._request= request;
};

Interestingness.prototype.getList= function(arguments, callback) {
    this._request.executeRequest("flickr.interestingness.getList", arguments, false, null, callback);
};

exports.Interestingness= Interestingness;