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

, get: function (url, callback) {
        AJAX.call("GET", url, null, callback);
    }

,post: function(url, data, callback) {
        AJAX.call("POST", url, data, callback);
    }

, call:function(method, url, data, callback) {

        if (typeof callback !== 'function') {
            throw('callback must be fn(err,data)');
        }

        try {
            //me comunico con el server que sirvio esta pagina
            var xmlhttp = new_XMLHttpRequest();
            xmlhttp.onreadystatechange = function() {
                if (xmlhttp.readyState === 4) {
                    if (xmlhttp.status !== 200) {
                        return callback(new Error("onreadystatechange: status:" + xmlhttp.status + " " + xmlhttp.statusText));
                    }
                    return callback(null, xmlhttp.responseText); // data OK
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
    get:function(params, callback) {
        var url=document.location.href+"/webService";
        if (params) {
            if (typeof params !== 'string') params=JSON.stringify(params);
            url += '?q='+ params;
        }
        AJAX.get(url, function(err,data){
                if (err) return callback(err);
                try {
                    var response = JSON.parse(data); // parseo json
                } catch (ex) {
                    return callback(new Error("JSON.parse: " + ex.message + '\n' + data.substr(0, 600))); // data no era JSON
                }
                if (response.err) return callback(new Error("server: "+ response.err)); // err on server
                return callback(null, response.data);
        });
    }

    , getFile:function(file, callback) {
        var url=document.location.href+"/"+file;
        AJAX.get(url, callback);
    }

};
