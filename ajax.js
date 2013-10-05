//---------------------------------
var AJAX={
    new_XMLHttpRequest: function() {
        var ref = null;
        if (window.XMLHttpRequest) {
            ref = new XMLHttpRequest();
        } else if (window.ActiveXObject) { // Older IE.
            ref = new ActiveXObject("MSXML2.XMLHTTP.3.0");
        }
        if (!ref) {
            throw {status: 505, responseText: 'Failure to create XMLHttpRequest'};
        }
        return ref;
    }

, get: function (url, params, callback) {
        if (params && typeof params !== 'string') {
            url += '?q='+ JSON.stringify(params);
        }
        AJAX.call("GET", url, null, callback);
    }

,post: function(url, json_data, callback) {
        AJAX.call("POST", url, json_data, callback);
    }

, call:function(method, url, json_data, callback) {

        if (typeof callback !== 'function') {
            throw('callback must be fn(err,data)');
        }

        try {
            //me comunico con el server que sirvio esta pagina
            //ese server redireccionará el query a la base
            var xmlhttp = new_XMLHttpRequest();
            xmlhttp.onreadystatechange = function() {
                if (xmlhttp.readyState === 4) {
                    if (xmlhttp.status !== 200) {
                        return callback(new Error("onreadystatechange: status:" + xmlhttp.status + " " + xmlhttp.statusText));
                    }
                    try {
                        var response = JSON.parse(xmlhttp.responseText); // parseo json
                    } catch (ex) {
                        return callback(new Error("JSON.parse: " + ex.message + '\n' + xmlhttp.responseText.substr(0, 600))); // data no era JSON
                    }
                    if (response.err) return callback(new Error("server: "+ response.err)); // err on server
                    return callback(null, response.data); // data OK
                }
                ;
            };

            xmlhttp.open(method, url, true); //async
            xmlhttp.setRequestHeader('content-type', 'applicattion/json');
            if (json_data && typeof json_data !== 'string') {
                json_data = JSON.stringify(json_data);
            }
            xmlhttp.send(json_data);
            return xmlhttp;
        }
        catch (e) {
            callback(e);
        }
    }
};

var server={
    //---------------------------------
    //server.get({module:dns, fn:reverse, args:[addr]}, callback);
    //--------------------------------
    get:function(options, callback) {
        AJAX.get(location.hostname,options, callback);
    }

};
