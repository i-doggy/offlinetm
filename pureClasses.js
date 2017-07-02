function Task(name, isAdditional, done) {
	if(name) this.name = name;
	else throw Error('Syntax Error: name is required');
	
	this.onchange = [];
	
	var setIsDone = setBoolProp(this, '_isDone', 'onchange');
	Object.defineProperty(this, 'done', { set: setIsDone, get: getProp(this, '_isDone')});
	this._isDone = false;
	setIsDone(done);
	
	this.onstateChange = [];
	
	var setIsAdditional = setBoolProp(this, '_isAdditional', 'onstateChange');
	Object.defineProperty(this, 'isAdditional', { set: setIsAdditional, get: getProp(this, '_isAdditional')});
	this.isAdditional = false;
	setIsAdditional(isAdditional);
	
	var getProgress = function() {
		if(this.isAdditional) return 0;
		else return Number(this.done);
	}
	
	Object.defineProperty(this, 'progress', { get: getProgress });
	return this;
}

Task.prototype.toggleDone = function() {
	if(this.done) this.done = false;
	else this.done = true;
	return this.done;
};
Task.prototype.toggleAdditional = function() {
	if(this.isAdditional) this.isAdditional = false;
	else this.isAdditional = true;
	return this.isAdditional;
};
Task.prototype.newName = function(newName) {
	if(nameIsValid(name)) this.name = newName;
}

function nameIsValid(name) { if(name.toUpperCase) return true; }

function TaskGroup(name) {
	if(name) this.name = name;
	else throw Error('Syntax Error: name is required');
	
	this.onchange = [];
	this.onstateChange = [];
	
	Object.defineProperty(this, 'progress', { get: this.getProgress });
	Object.defineProperty(this, 'done', { get: this.getDone });
	
	var getLength = function() { //should not return tasks marked as additional
		return this.child.reduce(function(p, e) { 
					if(e.length !== undefined) return p + e.length; 
					else {
						if(!e.isAdditional)return ++p;
						else return p;
					}
				}, 0); 
			};
	
	Object.defineProperty(this, 'length', { get: getLength });
	
	this._ChangeHandler = this._ChangeHandler.bind(this);
	this._StateChangeHandler = this._StateChangeHandler.bind(this);
	
	this.additionalLength = 0;
	this.child = [];
	[].slice.call(arguments, 1).map(this.addTask, this);
}

TaskGroup.prototype.addTask = function (t, index) {
		//Add event listeners
		t.onchange.push(this._ChangeHandler);
		t.onstateChange.push(this._StateChangeHandler);
		//Manage additional length
		if(t.isAdditional) this.additionalLength++;
		if(t.additionalLength) this.additionalLength = this.additionalLength + t.additionalLength;
		//Actually add
		if(index !== undefined) {
			if(index.inRange(-(this.child.length), this.child.length)) this.child.splice(index, 0, t);
			else throw Error('Out of range');
		}
		else this.child.push(t);
		//Return added
		return t;
}
TaskGroup.prototype.getProgress = function() { //returns number of done not additional tasks in group
	return this.child.reduce(function(p, e) {
		return p + e.progress;
	}, 0);
}
TaskGroup.prototype.getDone = function() { //return true if all not additional tasks is done
	return this.progress == this.length; 
}
TaskGroup.prototype._ChangeHandler = function(value) { //only bubbles event
	fireEvent(this, 'onchange', value);
};
TaskGroup.prototype._StateChangeHandler = function(state) {
	//Manage additional length
	if(state) this.additionalLength++;
	else this.additionalLength--;
	//Bubble this event
	fireEvent(this, 'onstateChange', state);
};
TaskGroup.prototype._deleteObjecto = function(task, index) { //underscore deleting method
	//Manage additional length
	if(task.isAdditional) this.additionalLength--;
	if(task.additionalLength) this.additionalLength = this.additionalLength - task.additionalLength;
	//Remove event listeners
	findItemAndDelete(task.onchange, this._ChangeHandler);
	findItemAndDelete(task.onstateChange, this._StateChangeHandler);
	//Return deleted
	return this.child.splice(index, 1)[0];
}
TaskGroup.prototype.deleteTaskByIndex = function(index) {
	if(!index.inRange(-(this.child.length), this.child.length)) throw Error('Out of range');
	
	return this._deleteObjecto(this.child[index], index);
}
TaskGroup.prototype.deleteTaskObj = function(task) {
	var i = this.child.findIndex(function(e) { return e == task; });
	if(i != -1) return this._deleteObjecto(task, i);
	else return false;
}

function setBoolProp(obj, propname, eventName) {
	return function(value) {
		var changed = obj[propname] != Boolean(value);
		obj[propname] = Boolean(value);
		if(eventName)
			if(changed)
				fireEvent(obj, eventName, Boolean(value));
	};
}

function fireEvent(obj, eventName, value) {
	obj[eventName].forEach(function(handler) { handler(value); });
}

function getProp(obj, propname) {
	return function() { 
		return obj[propname]
	}
};

function findItemAndDelete(array, item) {
	var i = array.findIndex(function(e) { return e == item; })
	if(i != -1) return array.splice(i, 1)[0];
	else return false;
}

Number.prototype.inRange = function(start, end) {
	if(this > start && this < end) return true;
	else return false;
}

Task.prototype.getSaveData = function() {
	var c = [this.name, this.done, this.isAdditional];
	return c;
}

TaskGroup.prototype.getSaveData = function() {
	var c = {}
	c[this.name] = this.child.map(function(e) { return e.getSaveData(); });
	return c;
}

TaskGroup.prototype.newName = function(newName) {
	if(nameIsValid(name)) this.name = newName;
}