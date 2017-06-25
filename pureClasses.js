function Task(name, isAdditional, done) {
	if(name) this.name = name;
	else throw Error('Syntax Error: name is required');
	
	this.onchange = [];
	
	Object.defineProperty(this, 'done', { set: setBoolProp(this, '_isDone', 'onchange'), get: getProp(this, '_isDone')});
	this._isDone = false;
	setBoolProp(this, '_isDone', 'onchange')(done);
	
	this.onstateChange = [];
	Object.defineProperty(this, 'isAdditional', { set: setBoolProp(this, '_isAdditional', 'onstateChange'), get: getProp(this, '_isAdditional')});
	this.isAdditional = false;
	if(isAdditional) this.isAdditional = true;
	
	Object.defineProperty(this, 'progress', { get: function() { if(this.isAdditional) return 0; else return Number(this.done); }});
	return this;
}

Task.prototype.toggleDone = function() {
	if(this.done) this.done = false;
	else this.done = true;
};

function TaskGroup(name) {
	if(name) this.name = name;
	else throw Error('Syntax Error: name is required');
	
	this.onchange = [];
	this.onstateChange = [];
	
	Object.defineProperty(this, 'progress', { get: this.getProgress });
	Object.defineProperty(this, 'done', { get: this.getDone });
	Object.defineProperty(this, 'length', { get: function() { return this.child.length + this.child.reduce(function(p, e) { if(e.length) return p + e.length - 1; else return p; }, 0); }});
	
	this.additionalLength = 0;
	this.child = [].slice.call(arguments, 1).map(this.addTask, this);
}

TaskGroup.prototype.addTask = function (t) {
		t.onchange.push(this._ChangeHandler(this));
		t.onstateChange.push(this._StateChangeHandler(this));
		if(t.isAdditional) this.additionalLength++
		if(t.additionalLength) this.additionalLength = this.additionalLength ? this.additionalLength - 1 : 0 + t.additionalLength;
		return t;
}
TaskGroup.prototype.getProgress = function() { 
	return this.child.reduce(function(p, e) { 
		return p + e.progress;
	}, 0);
}
TaskGroup.prototype.getDone = function() { 
	return this.progress == this.length - this.additionalLength; 
}
TaskGroup.prototype._ChangeHandler = function(obj) { return function(i) { obj.onchange.forEach(function(e) { e(i); }); }};
TaskGroup.prototype._StateChangeHandler = function(obj) { return function(state) { 
	if(state) obj.additionalLength++;
	else obj.additionalLength--;
	obj.onstateChange.forEach(function(e) { e(state); });
}};
TaskGroup.prototype.deleteTask = function(index) {
	if(!index.inRange(-(this.child.length), this.child.length)) throw Error('Out of range');
	findItemAndDelete(this.child[index].onchange, this._ChangeHandler(this));
	findItemAndDelete(this.child[index].onstateChange, this._StateChangeHandler(this));
	return this.child.splice(index, 1)[0];
}
TaskGroup.prototype.deleteTaskObj = function(task) {
	var i = this.child.findIndex(function(e) { return e == task; });
	this.deleteTask(i);
}

function setBoolProp(obj, propname, eventName) {
	return function(value) {
		var b = obj[propname] != Boolean(value)
		obj[propname] = Boolean(value);
		if(eventName)
			if(b) 
				obj[eventName].forEach(function(e) { e(Boolean(value)); });
	};
}

function getProp(obj, propname) {
	return function() { 
		return obj[propname]
	}
};

function findItemAndDelete(array, item) {
	array.splice(array.findIndex(function(e) { return e == item; }), 1);
}

Number.prototype.inRange = function(start, end) {
	if(this > start && this < end) return true;
	else return false;
}