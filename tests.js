"use strict";
var console={
    log: function(){
        $("#console").append("<li>"+Array.prototype.slice.call(arguments).join(' ')+"</li>");
    }
};

// ----------------------
// DNS TESTS -----------
// ----------------------
var dns={
    reverse: function(addr,callback){
        server.get({module:"dns", fn:"reverse", arg:[addr]}, callback);
    }
    ,resolve4: function(addr,callback){
        server.get({module:"dns", fn:"resolve4", arg:[addr]}, callback);
    }
};

var showReverse=new Task( [ function(wait){
    return wait.for(dns.reverse, wait.args.addr); } , function(wait, result){
    console.log("reverse for " + wait.args.addr + ": " + JSON.stringify(result));
}]);

var sequential_resolve_parallel_reverse = new Task( [ function(wait){
        console.log('dns.resolve4 ',wait.args.hostname);
        return wait.for(dns.resolve4, wait.args.hostname); }, function(wait, addresses){
        console.log("addresses: ",JSON.stringify(addresses));
        for (var i = 0; i < addresses.length; i++) {
            showReverse.launch({addr:addresses[i]});
        };
}]);


var sequential_resolve_sequential_reverse = new Task( [ function(wait){
        console.log('dns.resolve4 ',wait.args.hostname);
        return wait.for("addresses",dns.resolve4, wait.args.hostname); }, function(wait){
        console.log("addresses: ",JSON.stringify(wait.stack.addresses));
        console.log("addresses.length: ",wait.stack.addresses.length);
        for (var i = 0; i < wait.stack.addresses.length; i++) {
            wait.insertStep(showReverse, {addr:wait.stack.addresses[i]} );
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
        ,1000);
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
var testTask=new Task( [ function(wait){

    console.log('--------------------------------');
    console.log('DNS Resolve, then sequential DNS Reverse');
    console.log('--------------------------------');
    return wait.execute(sequential_resolve_sequential_reverse);},function(wait){
    console.log('--------------------------------');

    console.log('--------------------------------');
    console.log('DNS Resolve, then parallel async DNS Reverse');
    console.log('--------------------------------');
    return wait.execute(sequential_resolve_parallel_reverse);},function(wait){
    console.log('--------------------------------');

    console.log('--------------------------------');
    console.log('METHOD TEST (passing "this" to method.function');
    console.log('--------------------------------');

    return wait.forMethod("result",theAnswer,'think');},function(wait){
    console.log(wait.stack.result);
    return wait.forMethod("wrongAnswer",theWrongAnswer,'think');},function(wait){
    console.log(wait.stack.wrongAnswer);
    return wait.forMethod(theAnswer,'pingPong','tomato');},function(wait, result){
    console.log(result);
    return wait.forMethod(theWrongAnswer,'pingPong','pera');},function(wait, result){
    console.log(result);
}]
, function(on,err){
    console.log("Error: " + err.message + ", on Task.steps["+on.activeStep+"], "+ err.stack);
}
);

function runTests(){
    $("#console").html("");
    try{
        testTask.launch({hostname:"google.com"});
    }
    catch(err){
        console.log("Error: " + err.message + ", on runTests() catch");
    };
}

 function jQuery_Test1(){
            var
            aj1 = $.get('404'),
            aj2 = $.getJSON('resolve4.json'),
            aj3 = $.getJSON('reverse.json');

            $.when(aj1,aj2,aj3).done(function(a,b,c){
                console.log(a[0]);
                console.log(b[0]);
                console.log(c[0]);
            })
            .fail(function(err){console.log('one of the three failed '+err.stack);});
 }

//------------------------
//-----SEQUENTIAL --
//------------------------
 function jQuery_Test2(){
 console.log("start of sequential_get");
 $.getJSON("resolve4.json",function(data) {
		console.log(data);
		$.getJSON("404",function (data) {
			console.log(data);
			$.get("reverse.json",function(data) {
				console.log(data);
                console.log("end of sequential_get");
			}).fail(function(err){console.log(err.status+" "+err.statusText+' 3rd failed '+err.stack);});
		}).fail(function(err){console.log(err.status+" "+err.statusText+' 2nd failed '+err.stack);});
            }).fail(function(err){console.log(err.status+" "+err.statusText+' 1st failed '+err.stack);});
 }

//----------------------
// ajax get with standard callback(err,data)
function std_$get(url,callback){
    $.get(url,function(data) { callback(null,data); })
        .fail(function(err){callback(err);});
}

function waitFor_Test2(){
 var sequential_get = new Task( [ function(wait){
        console.log("start of sequential_get");
        return wait.for(std_$get, "resolve4.json"); }, function(wait,data){
        console.log(data);
        return wait.for(std_$get,"404"); }, function(wait,data){
        console.log(data);
        return wait.for(std_$get, "reverse.json"); }, function(wait,data){
        console.log(data);
        console.log("end of sequential_get");
}], function(on,err){
    console.log(err.status+" "+err.statusText+ " on step "+on.activeStep+ ", "+err.stack);
});

sequential_get.launch();
};

function waitFor_Test3(){
 var sequential_get = new Task( [ function(wait){
        console.log("start of sequential_get");
        return wait.for(std_$get, wait.args.file[0]); }, function(wait,data){
        console.log(data);
        return wait.for(std_$get, wait.args.file[1]); }, function(wait,data){
        console.log(data);
        return wait.for(std_$get, wait.args.file[2]); }, function(wait,data){
        console.log(data);
        console.log("end of sequential_get");
}], function(on,err){
    console.log(err.message+" on step "+on.activeStep+ ", "+err.stack);
});

sequential_get.launch();
};


/*

 function waitFor_Test1(){
 var sequential_get = new Task( [ function(wait){
        console.log('dns.resolve4 ',wait.args.hostname);
        return wait.for(std_$get, wait.args.hostname); }, function(wait,addresses){
        console.log("addresses: ",JSON.stringify(addresses));
        console.log("addresses.length: ",addresses.length);
        for (var i = 0; i < addresses.length; i++) {
            wait.insertStep(showReverse, {addr:addresses[i]} );
        };
        return; } , function(wait){
        console.log("end of sequential_resolve");
}]);
           var
            aj1 = $.get('404'),
            aj2 = $.getJSON('resolve4.json'),
            aj3 = $.getJSON('reverse.json');

            $.when(aj1,aj2,aj3).done(function(a,b,c){
                console.log(a[0]);
                console.log(b[0]);
                console.log(c[0]);
            })
            .fail(function(err){console.log('one of the three failed '+err.stack);});
 }
*/
