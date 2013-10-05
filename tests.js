"use strict";

var console={
    log: function(){
        $("console").append("<li>"+Array.prototype.slice.call(arguments).join(' ')+"</li>");
    }
};

// ----------------------
// DNS TESTS -------------
// ----------------------
var dns={
    reverse: function(addr,callback){
        //server.get({module:dns, fn:reverse, arg:[addr]}, callback);
        server.getFile("reverse..txt",callback);
    }
    ,resolve4: function(addr,callback){
        //server.get({module:dns, fn:resolve4, arg:[addr]}, callback);
        server.getFile("resolve4.txt",callback);
    }
};

var showReverse=new Task( [ function(wait){
    return wait.for(dns.reverse, wait.arg); } , function(wait, result){
    console.log("reverse for " + wait.arg + ": " + JSON.stringify(result));
}]);

var sequential_resolve_parallel_reverse = new Task( [ function(wait, hostname){
        console.log('dns.resolve4 ',hostname);
        return wait.for(dns.resolve4,hostname); }, function(wait, addresses){
        console.log("addresses: ",JSON.stringify(addresses));
        for (var i = 0; i < addresses.length; i++) {
            showReverse.launch(addresses[i]);
        };
}]);


var sequential_resolve_sequential_reverse = new Task( [ function(wait, hostname){
        console.log('dns.resolve4 ',hostname);
        return wait.for(dns.resolve4,hostname); }, function(wait,addresses){
        console.log("addresses: ",JSON.stringify(addresses));
        for (var i = 0; i < addresses.length; i++) {
            wait.insertStep(showReverse, addresses[n]);
        };
        return; } /* inserted steps executed here, sequentially */, function(wait){
        console.log("end of sequential_resolve");
}]);

// ----------------------

// OBJECT TESTS ---------
// ----------------------
function Constructor(value,pong){
    this.value = value;
    this.pong = pong;
}

Constructor.prototype.think=function(callback){
  if (!this) {
    var errMsg='ERR: this is null, at: Constructor.prototype.think';
    console.log(errMsg);
    callback(new Error(errMsg));
  }
  else {
    console.log('thinking...');
    var self=this;
    // callback after 1.5 secs
    setTimeout(function(){
        callback(null, 'the answer is: '+self.value);}
        ,1500);
  }
};

Constructor.prototype.pingPong=function(ping,callback){
    // callback before return
    callback(null, ping+'...'+this.pong);
};


var theAnswer = new Constructor(42,'tomeito');
var theWrongAnswer = new Constructor('a thousand','tomatito');


// -------------------
// RUN TESTS (Fiber)--
// -------------------
var testTask=new Task( [ function(wait, hostname){

    console.log('--------------------------------');
    console.log('resolve, then sequential reverse');
    return wait.execute(sequential_resolve_sequential_reverse,hostname);},function(wait){
    console.log('--------------------------------');

    console.log('--------------------------------');
    console.log('resolve, then parallel reverse');
    return wait.execute(sequential_resolve_parallel_reverse,hostname);},function(wait){
    console.log('--------------------------------');

    //METHOD TEST (passing 'this' to the function)
    return wait.forMethod(theAnswer,'think');},function(wait){
    console.log(wait.data);
    return wait.forMethod(theWrongAnswer,'think');},function(wait){
    console.log(wait.data);
    return wait.forMethod(theAnswer,'pingPong','tomato');},function(wait){
    console.log(wait.data);
    return wait.forMethod(theWrongAnswer,'pingPong','pera');},function(wait){
    console.log(wait.data);
}]);


function runTests(){
    try{
        testTask.launch("google.com");
    }
    catch(e){
        console.log("Error: " + e.message);
    };
}
