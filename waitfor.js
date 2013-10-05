/* browser wait.for
 - Sequential programming for javascript - Version for browser without ES6-Generators
 - Copyright 2013 Lucio Tato
*/
"use strict";
function Task(stepsArray,onErr){
    this.steps = stepsArray;
    this.onErr = onErr;
}

Task.prototype = {

    clone: function(){
        var cloned=new Task();
        for(var prop in this){
            if (this.hasOwnProperty(prop)){
                var value=this[prop];
                if (Array.isArray(value)){
                    value=value.slice(0);//shallow copy
                }
                cloned[prop]=value;
            }
        }
        return cloned;
    }

    ,launch:function(args){ //launch (a copy of) this task
        var fiber = this.clone();
        fiber.args = args;
        fiber.stack = {};
        fiber.err = undefined;
        fiber.data = args;
        fiber.activeStep=0;
        fiber.step();
    }

    ,launchFiber:function(task, args){ //launch other task
        task.launch(args);
        }

    ,step : function(){

        var self=this;
        self.insertPoint=self.activeStep+1; //reset insert point

        var item=self.steps[self.activeStep];
        if (item) {
            var fn;
            if (typeof item === 'object') {
                if (item.args) self.args=item.args;
                fn=item.fn;
            }
            else fn=item;

            self.activeStepName = fn.name;
            if (typeof fn !== 'function') return self.handleErr('steps['+n+'] must be a function or {fn:xx, data:yy}');

            //call step n
            try { var yielded = fn.call(null, self, self.data); } //wait.data is the second parameter
            catch(err) { if (!self.handleErr(err)) return; } //end execution if not handled
            if (yielded instanceof Task.prototype.forCalled) { //if step ended with: return wait.for(...
                    //add callback
                    yielded.async_args.push( function(err,data){
                            // when async done
                            self.data = data;
                            self.stack[yielded.async_storeOn] = data;
                            if (err && !self.handleErr(err)) return; //end execution if err and not handled
                            // call next step
                            self.activeStep++;
                            return self.step();
                    });
                    // call async fn
                    try { yielded.async.apply(yielded.async_this, yielded.async_args); }
                    catch(err) { if (!self.handleErr(err)) return; } //end execution if not handled
            }
            else { //step returned other than "wait.for(..."
                self.data = yielded;
                // call next step
                self.activeStep++;
                return self.step();
            }
        }
        else { //no more steps
            self.onEnd && self.onEnd(null,self.data);
            return self.data; //return last data from last async
        }
    }

    , handleErr: function(err){
        if (typeof err === "string") err=new Error(err);
        this.err=err;
        if (this.onErr) return this.onErr(this,err);
            else throw err;
    }

    ,forCalled: function(varName, thisValue,fn,args){ // CONSTRUCTOR
        this.async_storeOn= varName;
        this.async_this = thisValue;
        this.async = fn;
        this.async_args = args;
    }

    ,for: function(fn){ // return wait.for([varName],fn,arg1,arg2,...) } ] , [ function(wait) {....

        var newargs=Array.prototype.slice.call(arguments,1); // remove function from data

        var varName="data"; //default storage on wait.stack
        if (typeof fn === 'string') {
                varName=fn;
                fn=newargs.shift(0);
        }
        return new Task.prototype.forCalled(varName,null,fn,newargs); //return instance of Task.prototype.forCalled
    }

    ,forMethod: function(obj,methodName){ // return wait.forMethod(obj,fn,arg1,arg2,...) } ] , [ function(wait) {....

        var newargs=Array.prototype.slice.call(arguments,2); // remove obj and method name from data

        var varName="data"; //default storage on wait.stack
        if (typeof obj === 'string') { //first param is string
                varName=obj;
                obj=methodName;
                methodName=newargs.shift(0);
        }

        var method=obj[methodName];
        if (!method) throw new Error('wait.forMethod: expected method name (string)');

        return new Task.prototype.forCalled(varName, obj,method,newargs);
    }

    ,insert: function (fn, args){
        if (typeof fn !== 'function') return this.handleErr('insert: first argument must be a function. or use insertStep()');
        if (!this.insertPoint) this.insertPoint=this.activeStep+1;
        var newItem={fn:fn, inserted:true};
        if (args!==undefined) newItem.args=args;
        this.steps.splice(this.insertPoint++,0,newItem);
    }

    ,insertStep: function (task_or_steps, args){
        var steps = (task_or_steps instanceof Task) ? task_or_steps.steps : task_or_steps;
        for(var n=0;n<steps.length;n++){
            this.insert(steps[n],args);
            args=undefined; //args param only for first step
        }
    }

    ,removeInsertedSteps: function(){
        for(var n=0;n<this.steps.length;n++){
            if (this.steps[n].inserted) this.steps.splice(n--,1);
        }
    }

};

Task.prototype.execute = Task.prototype.insertStep; //alias for insertStep, solo que se usa con "return wait.execute...
        // return wait.execute(task,data) } ] , [ function(wait) {....


/*
var wait = {

    launchFiber : function (syncTask, data){
        syncTask.fiber={
              data: data // fiber.data = data (object)
              ,task:syncTask
        };
        wait.doStep(0,syncTask);
    }

    ,insertSteps: function (fiber,steps){
        for(var n=0;n<Tasks.length;n++){
            var  syncTask=Tasks[n].task;
            syncTask.fiber={
                  data: Tasks[n].data // fiber.data = data (object)
            };
            wait.doStep(0,syncTask);
        }


    }

    ,doStep : function(n,syncTask){
        syncTask.fiber.activeStep = n;
        var fn=syncTask.steps[n];
        if (fn) {
            if (typeof fn !== 'function') this.handleErr('syncTask.steps['+n+'] must be a function');
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

    ,forCalled: function(thisValue,fn,data){ // CONSTRUCTOR
        this.async = fn;
        this.async_this = thisValue;
        this.async_args = data;
    }

    ,for: function(fn){ // return wait.for(fn,arg1,arg2,...) } ] , [ function(fiber) {....

        if (typeof fn !== 'function') throw new Error('wait.for: first argument must be an async function');

        var newargs=Array.prototype.slice.call(arguments,1); // remove function from data

        return new wait.forCalled(null,fn,newargs); //return instance of Wait.forCalled
    }

    ,forMethod: function(obj,methodName){ // return wait.forMethod(MyObj,'select',....)

        var method=obj[methodName];
        if (!method) throw new Error('wait.forMethod: second argument must be the async method name (string)');

        var newargs=Array.prototype.slice.call(arguments,2); // remove obj and method name from data
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
*/

