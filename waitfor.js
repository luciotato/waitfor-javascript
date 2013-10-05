/* browser wait.for
 - Sequential programming for javascript - Version for browser without ES6-Generators
 - Copyright 2013 Lucio Tato
*/
"use strict";
function Task(stepsArray){
    this.steps = stepsArray;
}

Task.prototype = {

    launch:function(arg){ //launch this task
        this.arg = arg;
        this.activeStep=0;
        this.step();
    }

    ,launchFiber:function(task, arg){ //launch other task
        task.launch(arg);
        }

    ,step : function(){
        var self=this;
        var item=self.steps[self.activeStep];
        if (item) {
            var fn;
            if (typeof item === 'object') {
                if (item.arg) self.arg=item.arg;
                fn=item.fn;
            }
            else fn=item;

            if (typeof fn !== 'function') throw new Error('steps['+n+'] must be a function or {fn:xx, arg:yy}');
            if (self.activeStep===0) self.data=self.arg; //first 'data' is arg

            //call step n
            var yielded = fn.call(null, self, self.data); //wat.data is the second parameter
            if (yielded instanceof Task.forCalled) { //if return wait.for(...
                    // call async fn
                    yielded.async.apply(yielded.async_this, yielded.async_args, function(err,data){
                            // when done
                            self.err = err;
                            self.data = data;
                            if (err) {
                                if (self.onErr) {
                                            if (self.onErr(err)!==true) { //! true => exit,   true => continue
                                                self.onEnd && self.onEnd(err);
                                                return; //end execution
                                            }
                                }
                                else { //no onErr defined -> throw
                                    if (self.onEnd) self.onEnd(err); else throw err;
                                }
                            };
                            // call next step
                            self.activeStep++;
                            return self.step();
                    });
            }
            else { //step returned other than "wait.for(..."
                self.onEnd && self.onEnd(null,yielded);
                return yielded;
            }
        }
        else { //no more steps
            self.onEnd && self.onEnd(null,self.data);
            return self.data; //return last data from last async
        }
    }

    ,forCalled: function(thisValue,fn,args){ // CONSTRUCTOR
        this.async_this = thisValue;
        this.async = fn;
        this.async_args = args;
    }

    ,for: function(fn){ // return wait.for(fn,arg1,arg2,...) } ] , [ function(wait) {....

        if (typeof fn !== 'function') throw new Error('wait.for: first argument must be an async function');

        var newargs=Array.prototype.slice.call(arguments,1); // remove function from arg

        return new Task.forCalled(null,fn,newargs); //return instance of Task.forCalled
    }

    ,insert: function (fn, arg){
        if (typeof fn !== 'function') throw new Error('insert: first argument must be a function. or use insertStep()');
        if (!this.insertPoint) this.insertPoint=this.activeStep+1;
        this.steps.splice(this.insertPoint++,0,{fn:fn,arg:arg});
    }

    ,insertStep: function (task_or_steps, arg){
        var steps = (task_or_steps instanceof Task) ? task_or_steps.steps : task_or_steps;
        for(var n=0;n<steps.length;n++){
            this.insert(steps[n],arg);
        }
    }

    ,execute: Task.prototype.insertStep // return wait.execute(task,arg) } ] , [ function(wait) {....
        //alias for insertStep, solo que se usa con "return wait.execute...

};


var wait = {

    launchFiber : function (syncTask, arg){
        syncTask.fiber={
              arg: arg // fiber.arg = arg (object)
              ,task:syncTask
        };
        wait.doStep(0,syncTask);
    }

    ,insertSteps: function (fiber,steps){
        for(var n=0;n<Tasks.length;n++){
            var  syncTask=Tasks[n].task;
            syncTask.fiber={
                  arg: Tasks[n].arg // fiber.arg = arg (object)
            };
            wait.doStep(0,syncTask);
        }


    }

    ,doStep : function(n,syncTask){
        syncTask.fiber.activeStep = n;
        var fn=syncTask.steps[n];
        if (fn) {
            if (typeof fn !== 'function') throw new Error('syncTask.steps['+n+'] must be a function');
            //call step n
            var yielded = fn.apply(null, syncTask.fiber);
            if (yielded instanceof wait.forCalled) { //if return Wait.for(...
                    // call async fn
                    yielded.async.apply(yielded.async_this, yielded.async_args, function(err,data){
                            // when done
                            syncTask.fiber.err = err;
                            syncTask.fiber.data = data;
                            if (err) {
                                if (syncTask.onErr) {
                                            if (syncTask.onErr(err)!==true) { //! true => exit,   true => continue
                                                syncTask.onEnd && syncTask.onEnd(err);
                                                return; //end execution
                                            }
                                }
                                else { //no onErr defined -> throw
                                    if (syncTask.onEnd) syncTask.onEnd(err); else throw err;
                                }
                            };
                            // call next step
                            return wait.doStep(n+1,syncTask);
                    });
            }
            else { //step returned other than "wait.for(..."
                syncTask.onEnd && syncTask.onEnd(null,yielded);
                return yielded;
            }
        }
        else { //no more steps
            syncTask.onEnd && syncTask.onEnd(null,syncTask.fiber.data);
            return syncTask.fiber.data; //return last data from last async
        }
    }

    ,forCalled: function(thisValue,fn,arg){ // CONSTRUCTOR
        this.async = fn;
        this.async_this = thisValue;
        this.async_args = arg;
    }

    ,for: function(fn){ // return wait.for(fn,arg1,arg2,...) } ] , [ function(fiber) {....

        if (typeof fn !== 'function') throw new Error('wait.for: first argument must be an async function');

        var newargs=Array.prototype.slice.call(arguments,1); // remove function from arg

        return new wait.forCalled(null,fn,newargs); //return instance of Wait.forCalled
    }

    ,forMethod: function(obj,methodName){ // return wait.forMethod(MyObj,'select',....)

        var method=obj[methodName];
        if (!method) throw new Error('wait.forMethod: second argument must be the async method name (string)');

        var newargs=Array.prototype.slice.call(arguments,2); // remove obj and method name from arg
        return new wait.forCalled(obj,method,newargs);
    }

};

//-----------------------------
var parallel = {
    timeout_callback : function(ms,callback){
        setTimeout(callback,ms); //call callback(null,null) in ms miliseconds
        }

//    miliseconds: function(ms){
//    return wait.for(wait.launch.timeout_callback,ms);
//    }

    ,callItemAsyncFn : function(asyncItemFn, array, index, result,finalCallback){
        asyncItemFn(array[index], index, array
            ,function(err,data){
                if (err) callback(err,null);
                result.arr[index]=data;
                result.count++;
                if (result.count>=result.expected) { // all results arrived
                    finalCallback(null,result.arr) ; // final callback, returns result array
                }
            }
        );
    }

    ,asyncMap : function(arr,asyncItemFn,callback){
        //
        // asyncItemFn = function(item,index,arr,callback)
        //
        var result={arr:[],count:0,expected:arr.length};
        if (result.expected===0) return result.arr;

        for (var propName in arr) {
            if ( arr.hasOwnProperty(propName) && arr[propName]) {
                wait.launch.callItemAsyncFn(asyncItemFn,arr,propName,result,callback);
            };
        }
    }

    ,filter : function(arr,asyncItemTestFn){
        //
        // asyncItemFn = function(item,callback) - callback(err,data) return data=true/false
        //
        // must be in a Task
        //
        var testResults = wait.parallel.map(arr,asyncItemTestFn);

        // create an array for each item where asyncItemTestFn returned true
        var filteredArr=[];
        for (var i = 0; i < arr.length; i++)
            if (testResults[i]) filteredArr.push(arr[i]);

        return filteredArr;
    }

};

