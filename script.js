function RealTask(name, isAdditional, isDone) {
	Task.apply(this, [].slice.call(arguments));
	
	var el = document.createElement('LI')
	el.draggable = true;
	
	//<div class='checkbox'><span>&#x2713;<span></div>
	var checkbox = document.createElement('DIV');
	checkbox.classList.add('checkbox');
	var check = document.createElement('SPAN');
	check.innerText = '✓'
	checkbox.append(check);
	el.append(checkbox);
	
	//div class='additionalpoint
	var checkbox = document.createElement('DIV');
	checkbox.classList.add('additionalbox');
	//var check = document.createElement('SPAN');
	checkbox.innerText = '+';
	//checkbox.append(check);
	el.append(checkbox);
	
	var span = document.createElement('INPUT');
	span.value = name;
	span.spellcheck = "false";
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

function RealTaskGroup(name /*,tasks...*/) {
	TaskGroup.apply(this, [].slice.call(arguments));
	
	this._createElement();
	
	this.renderProgress();
	
	return this;
}

RealTaskGroup.prototype = Object.create(TaskGroup.prototype);
RealTaskGroup.prototype._createElement = function() {
	var container = document.createElement('SECTION');
	
	//<div class='deletepoint'>&#x274C;</div>
	var deletebox = document.createElement('DIV');
	deletebox.innerText = '❌';
	deletebox.classList.add('deletebox');
	container.append(deletebox);
	
		
	var header = document.createElement('H1');
	
	var hid = document.createElement('SPAN');
	hid.innerText = '>';
	hid.classList.add('hider');
	header.append(hid);
	
	var name = document.createElement('INPUT');
	name.value = this.name;
	header.append(name);
	container.append(header);
	this.progressElement = document.createElement('PROGRESS');
	this.progressElement.value = 0;
	
	container.append(this.progressElement);
	var ul = document.createElement('UL');
	this.child.forEach(function(e) { 
		if(e.element.tagName == 'LI') ul.append(e.element);
		else {
			var li = document.createElement('LI');
			li.draggable = true;
			li.append(e.element);
			ul.append(li)
		}});
	plus = document.createElement('LI');
	plus.classList.add('plus');
	var task = document.createElement('SPAN');
	var group = document.createElement('SPAN');
	task.innerHTML = 'new Task';
	group.innerHTML = 'new Group';
	pluss = document.createElement('SPAN');
	pluss.classList.add('spec');
	group.classList.add('newgroup');
	task.classList.add('newtask');
	pluss.innerHTML = '+';
	plus.append(group);
	plus.append(pluss);
	plus.append(task);
	ul.append(plus);
	container.append(ul);
	container.taskgroup = this;
	this.element = container;
	this.element.ul = ul;
}

RealTaskGroup.prototype.addTask = function (t, index) {
		var res = TaskGroup.prototype.addTask.apply(this, arguments);
		if(this.element) {
			if(index !== undefined && index.inRange(-this.child.length, this.child.length)) this.element.ul.insertBefore(t.element, this.child[index].element);
			else this.element.ul.append(t.element);
		}
		return res;
}
RealTaskGroup.prototype._ChangeHandler = function(value) {
	this.renderProgress();
	TaskGroup.prototype._ChangeHandler.call(this, value);
};
RealTaskGroup.prototype._StateChangeHandler = function(value) {
	this.renderProgress();
	TaskGroup.prototype._StateChangeHandler.call(this, value);
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
	fireEvent(this, 'onchange', undefined);
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
		if(liel.task)s.taskgroup.deleteTaskObj(liel.task);
		if(liel.taskgroup) s.taskgroup.deleteTaskObj(liel.taskgroup);
		liel.hidden = true;
		liel.style.display = 'none';
		return;
	}
	
	if(e.target.classList.contains('hider')) liel = e.target.parentNode.parentNode;
	if(liel) {
		console.log(liel);
		liel.classList.toggle('hidden');
		return;
	}
	
	//if(e.target.parentNode.classList.contains('additionalbox'))  liel = e.target.parentNode.parentNode;
	if(e.target.classList.contains('additionalbox')) liel = e.target.parentNode;
	if(liel) {
		liel.classList.toggle('additional');
		liel.task.toggleAdditional();
		return;
	}
	
	if(e.target.closest('.plus')) {
		if(e.target.classList.contains('newtask')) {
			var p = e.target.parentNode.parentNode;
			var z = e.target.parentNode;
			letUserPlay(p.parentNode);
			p.append(z);
			return;
		}
		if(e.target.classList.contains('newgroup')) {
			var p = e.target.parentNode.parentNode;
			var z = e.target.parentNode;
			letUserPlayGroup(p.parentNode);
			p.append(z);
			return;
		}
	}
});

document.body.addEventListener('change', function(e) {
	if(e.target.parentNode.task) e.target.parentNode.task.newName(e.target.value);
	if(e.target.parentNode.parentNode.taskgroup) e.target.parentNode.parentNode.taskgroup.newName(e.target.value);
});

function loadSavedData(str) {
	var obj = JSON.parse(str);
	return run(obj);
}

function run(obj) {
		return Object.keys(obj).reduce(function(p, e) {
			var r = new RealTaskGroup(false, e);
			var buf = obj[e].map(function(e1) {
				if(Array.isArray(e1)) return new RealTask(e1[0], e1[1], e1[2]);
				else return (run(e1));
			});
			buf.forEach(function(e2) { r.addTask(e2); });
			return r;
		}, 0);
	}
	
function letUserPlay(node) {
	var task = new RealTask('Task', 0, 0);
	node.taskgroup.addTask(task);
}
function letUserPlayGroup(node) {
	var task = new RealTaskGroup('Group');
	node.taskgroup.addTask(task);
}