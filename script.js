//Количество простыней кода в этом файле зашкаливает//



function RealTask(name, isAdditional, isDone) {
	Task.apply(this, [].slice.call(arguments));
	//Creating element;
		var el = mkElement('LI', 'task');
		el.draggable = true;
		
			//<div class='checkbox'><span>&#x2713;<span></div>
			var checkbox = mkElement('DIV', 'checkbox', false, el)
			checkbox.append(mkElement('SPAN', false, '✓', checkbox));
		
			//<div class='additionalpoint'></div>
			mkElement('DIV', 'additionalbox', '+', el);
		
			//<input value=$name$ spellcheck=false>
			var span = mkElement('INPUT', false, false, el);
			span.value = name;
			span.spellcheck = "false";
		
			//<div class='deletepoint'>&#x274C;</div>
			mkElement('DIV', 'deletebox', '❌', el);
		
		el.task = this;
		this.element = el;

		if(this.isAdditional) this.element.classList.add('additional');
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
	var container = mkElement('SECTION');
	
	//<div class='deletepoint'>&#x274C;</div>
		mkElement('DIV', 'deletebox', '❌', container);
	
	//Making header
		var header = mkElement('H1', false, false, container);
		
		mkElement('SPAN', 'hider', '>', header);
		
		var name = mkElement('INPUT', false, false, header);
		name.value = this.name;
	
	//Adding progress element
		this.progressElement = mkElement('PROGRESS', false, false, container);
		
		this.progressElement.value = 0;
	
	//Adding UL and inner tasks
		var ul = mkElement('UL', false, false, container);
		
		this.child.forEach(function(e) { 
			if(e.element.tagName == 'LI') ul.append(e.element);
			else {
				var li = mkElement('LI', false, false, ul);
				li.draggable = true;
				li.append(e.element);
			}
		});
		
		//Adding add element
			var plus = mkElement('LI', 'plus', false, ul);
			mkElement('SPAN', 'newtask', 'new Task', plus);
			pluss = mkElement('SPAN', 'spec', '+', plus);
			mkElement('SPAN', 'newgroup', 'new Group', plus)
	
	container.taskgroup = this;
	this.element = container;
	this.element.ul = ul;
}

RealTaskGroup.prototype.addTask = function (t, index) {
		var res = TaskGroup.prototype.addTask.apply(this, arguments);
		if(this.element) {
			if(index !== undefined && index.inRange(-this.child.length, this.child.length)) this.element.ul.insertBefore(t.element, this.child[index].element);
			else this.element.ul.append(t.element);
			this.renderProgress();
			fireEvent(this, 'onchange', t.done);
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
	
	if(e.target.closest('.checkbox')) liel = e.target.closest('.checkbox').parentNode;
	if(liel) {
		liel.classList.toggle('checked');
		liel.task.toggleDone();
		return;
	}
	
	if(e.target.classList.contains('deletebox')) liel = e.target.parentNode;
	if(liel) {
		if(!liel.taskgroup) {
			var s = liel.closest('SECTION')
			if(liel.task) s.taskgroup.deleteTaskObj(liel.task);
		}
		else {
			var s = liel.parentNode.closest('SECTION');
			if(s)
				if(liel.taskgroup) s.taskgroup.deleteTaskObj(liel.taskgroup);
		}
		liel.remove();
		return;
	}
	
	if(e.target.classList.contains('hider')) liel = e.target.parentNode.parentNode;
	if(liel) {
		liel.classList.toggle('hidden');
		return;
	}
	
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
			var task = new RealTask('Task', 0, 0);
			p.parentNode.taskgroup.addTask(task);
			task.element.querySelector('INPUT').focus();
			p.append(z);
			return;
		}
		if(e.target.classList.contains('newgroup')) {
			var p = e.target.parentNode.parentNode;
			var z = e.target.parentNode;
			var task = new RealTaskGroup('Group');
			p.parentNode.taskgroup.addTask(task);
			p.append(z);
			return;
		}
		return;
	}
	if(e.target.classList.contains('newlist')) {
		var z = e.target;
		var t = new RealTaskGroup('List');
		document.body.append(t.element);
		document.body.append(z);
		return;
	}
});

//Update names on change input's value
document.body.addEventListener('change', function(e) {
	if(e.target.parentNode.task) e.target.parentNode.task.newName(e.target.value);
	if(e.target.parentNode.parentNode.taskgroup) e.target.parentNode.parentNode.taskgroup.newName(e.target.value);
});

RealTaskGroup.loadSavedData = function loadSavedData(str) {
	var obj = JSON.parse(str);
	return RealTaskGroup._run(obj);
}

RealTaskGroup._run = function run(obj) {
		return Object.keys(obj).reduce(function(p, e) {
			var r = new RealTaskGroup(e);
			var buf = obj[e].map(function(e1) {
				if(Array.isArray(e1)) return new RealTask(e1[0], e1[1], e1[2]);
				else return (run(e1));
			});
			buf.forEach(function(e2) { r.addTask(e2); });
			r._createElement();
			return r;
		}, 0);
	}
	
function letUserPlay(node) {
	var task = new RealTask('Task', 0, 0);
	node.taskgroup.addTask(task);
	task.element.querySelector('INPUT').focus();
}
function letUserPlayGroup(node) {
	var task = new RealTaskGroup('Group');
	node.taskgroup.addTask(task);
}

//Managing Drag'n'drop
document.body.addEventListener('dragstart', function(e) {
	e.target.id = '__drag__';
	//e.dataTransfer.setData('text', '__drag__');
});
document.body.addEventListener('dragover', function(e) {
	if(e.target.closest('UL')) e.preventDefault();
});
document.body.addEventListener('drop', function(e) {
	if(e.target.tagName == 'UL') {
		e.preventDefault();
		e.target.append(document.getElementById('__drag__'));
	}
	var z = e.target.closest('li');
	if(z) {
		e.preventDefault();
		z.parentNode.insertBefore(document.getElementById('__drag__'), z);
	}
	document.getElementById('__drag__').id='';
});

//On press 'enter' go to next task(if any) or create new if has not
document.body.addEventListener("keyup", function(event) {
	if(event.target.tagName == 'INPUT')
	if (event.keyCode == 13) {
		event.target.blur();
		var n = event.target.parentNode.nextSibling.querySelector('INPUT');
		if(n) n.focus();
		else {
			n = event.target.closest('UL');
			s = n.querySelector('.newtask');
			s.click();
		}
	}
});

function mkElement(tag, classN, content, par) {
	e = document.createElement(tag);
	if(classN) e.classList.add(classN);
	if(content) e.innerText = content;
	if(par)
		if(par.append) par.append(e);
		else throw Error('par is not an HTML element(has no append method)');
	return e;
}