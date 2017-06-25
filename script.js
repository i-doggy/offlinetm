function RealTask(name, isAdditional, isDone) {
	Task.apply(this, [].slice.call(arguments));
	
	var el = document.createElement('LI')
	
	//<div class='checkbox'><span>&#x2713;<span></div>
	var checkbox = document.createElement('DIV');
	checkbox.classList.add('checkbox');
	var check = document.createElement('SPAN');
	check.innerText = '✓'
	checkbox.append(check);
	el.append(checkbox);
	
	var span = document.createElement('SPAN');
	span.innerText = name;
	span.contentEditable = "true";
	el.append(span);
	
	//<div class='deletepoint'>&#x274C;</div>
	var deletebox = document.createElement('DIV');
	deletebox.innerText = '❌';
	deletebox.classList.add('deletebox');
	el.append(deletebox);
	
	el.task = this;
	this.element = el;

	if(this.isAdditional) this.element.classList.add('additional');
	this.element.classList.add('task');
	if(this.done) this.element.classList.add('checked');
	
	return this;
}

RealTask.prototype = Object.create(Task.prototype);

function RealTaskGroup(isList, name /*,tasks...*/) {
	TaskGroup.apply(this, [].slice.call(arguments, 1));
	
	this._createElement(isList);
	
	this.renderProgress();
	
	return this;
}

RealTaskGroup.prototype = Object.create(TaskGroup.prototype);
RealTaskGroup.prototype._createElement = function(isList) {
	var container = document.createElement(isList ? 'ARTICLE' : 'SECTION');
	var header = document.createElement('H1');
	header.innerText = this.name;
	container.append(header);
	this.progressElement = document.createElement('PROGRESS');
	this.progressElement.value = 0;
	
	container.append(this.progressElement);
	var ul = document.createElement('UL');
	this.child.forEach(function(e) { 
		if(e.element.tagName == 'LI') ul.append(e.element);
		else {
			var li = document.createElement('LI');
			li.append(e.element);
			ul.append(li)
		}});
	container.append(ul);
	container.taskgroup = this;
	this.element = container;
}

RealTaskGroup.prototype.addTask = function (t) {
		//Add event listeners
		t.onchange.push(this._ChangeHandler.bind(this));
		t.onstateChange.push(this._StateChangeHandler);
		//Manage additional length
		if(t.isAdditional) this.additionalLength++;
		if(t.additionalLength) this.additionalLength = this.additionalLength + t.additionalLength;
		//Return added
		return t;
}
RealTaskGroup.prototype._ChangeHandler = function(value) {
	console.log(this);
	this.renderProgress();
	TaskGroup.prototype._ChangeHandler.call(this, value);
	//obj.onchange.forEach(function(e) { e(i); }); 
};
RealTaskGroup.prototype.deleteTaskObj = function(task) {
	var res = TaskGroup.prototype.deleteTaskObj.call(this, task);
	this.renderProgress();
	return res;
}
RealTaskGroup.prototype.renderProgress = function() { 
	this.progressElement.max = this.length;
	if(!this.length) this.progressElement.value = 1;
	else this.progressElement.value = this.progress;
}

document.body.addEventListener('click', function(e) {
	var liel = false;
	if(e.target.classList.contains('checkbox')) liel = e.target.parentNode;
	if(e.target.parentNode.classList.contains('checkbox'))  liel = e.target.parentNode.parentNode;
	if(liel) {
		liel.classList.toggle('checked');
		liel.task.toggleDone();
		return;
	}
	
	if(e.target.classList.contains('deletebox')) liel = e.target.parentNode;
	if(liel) {
		var s = liel.closest('SECTION')
		if(!s) s = liel.closest('ARTICLE');
		s.taskgroup.deleteTaskObj(liel.task);
		liel.hidden = true;
	}
});