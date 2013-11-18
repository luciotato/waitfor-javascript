[BETA Version] *Not Ready* -Wait.for-
========
Sequential programming for javascript async function, on the browser, end of callback hell.

Wait.for allows you to create "Tasks" and launch them.
A "Task" can "wait.for" any standard async function, pausing the task, waiting for result data,
without blocking javascript ui, and without using webworkers.

A "Task" is basically an array of functions, executed sequentially.

Advantages:
* Avoid callback hell / pyramid of doom
* Simpler, sequential programming when required, without blocking javascript ui
* a Task can have an "onError" function, aloowing a try-catch exception programming, with resume.
* You can also launch multiple parallel non-concurrent Tasks.
* No multi-threaded debugging nightmares, only one Task running at a given time.
* Can use any standard async function with callback(err,data) as last parameter.
* Plays along with async programming style. Write your async functions with callback(err,data), but use them in sequential/SYNC mode when required.

--- Other Versions ---
-
* Wait.for: ***a version for node.js based on node-fibers***
[Wait.for:](https://github.com/luciotato/waitfor)

* Wait.for-ES6: ***a version based on JavaScript upcoming ES6-Harmony generators***
[Wait.for-ES6:](https://github.com/luciotato/waitfor-ES6)

Examples:
-
Using **jquery** (sequential):
```javascript
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
```

Using **wait.for** (sequential):
```javascript
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

//----------------------
// ajax get with standard callback(err,data)
function std_$get(url,callback){
    $.get(url,function(data) { callback(null,data); })
        .fail(function(err){callback(err);});
}
```

Database example (pseudocode)
--
```javascript
var db = require("some-db-abstraction");

function handleWithdrawal(req,res){
	try {
		var amount=req.param("amount");
		db.select("* from sessions where session_id=?",req.param("session_id"),function(err,sessiondata) {
			if (err) throw err;
			db.select("* from accounts where user_id=?",sessiondata.user_ID),function(err,accountdata) {
				if (err) throw err;
					if (accountdata.balance < amount) throw new Error('insufficient funds');
					db.execute("withdrawal(?,?)",accountdata.ID,req.param("amount"), function(err,data) {
						if (err) throw err;
						res.write("withdrawal OK, amount: "+ req.param("amount"));
						db.select("balance from accounts where account_id=?", accountdata.ID,function(err,balance) {
							if (err) throw err;
							res.end("your current balance is "  + balance.amount);
						});
    				});
				});
			});
		}
		catch(err) {
			res.end("Withdrawal error: "  + err.message);
	}
}
```
Note: The above code, although it looks like it will catch the exceptions, **it will not**.
Catching exceptions with callback hell adds a lot of pain, and i'm not sure if you will have the 'res' parameter
to respond to the user. If somebody like to fix this example... be my guest.


Now using **wait.for** (sequential logic - sequential programming):
```javascript
var db = require("some-db-abstraction"), wait=require('wait.for');

 var handleWithdrawal = new Task( [ function(wait){
		wait.stack.amount=wait.args.req.param("amount");
		return wait.forMethod("sessiondata",db,"select","* from session where session_id=?",req.param("session_id"));},{function(wait){
		return wait.forMethod("accountData", db,"select","* from accounts where user_id=?",wait.stack.sessiondata.user_ID);},{function(wait){
		if (wait.stack.accountdata.balance < wait.stack.amount) throw new Error('insufficient funds');
		return wait.forMethod(db,"execute","withdrawal(?,?)",wait.stack.accountdata.ID, wait.args.req.param("amount"));},{function(wait){
		wait.args.res.write("withdrawal OK, amount: "+ wait.args.req.param("amount"));
		return wait.forMethod("balance", db,"select","balance from accounts where account_id=?", wait.stack.accountdata.ID);},{function(wait){
		wait.args.res.end("your current balance is "  + wait.stack.balance);
		}
	catch(err) {
		res.end("Withdrawal error: "  + err.message);
}
```


Note: Exceptions will be catched as expected.
db methods (db.select, db.execute) will be called with this=db

(see tests.js for more examples)

