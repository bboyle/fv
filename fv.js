/*
 * date:	2003-05-04
 * info:	http://inspire.server101.com/js/fv/
 */


/*

RATHER than add so many onchange/onkeyup handlers...
write a single function, add this to all relevant elements

this function will perform checks by looking at the element.

eg. if the element has a maxlength, count down the characters remaining
how do we know an element has a maxlength?
- check attribute
- check in associative array (for textareas)

for data type checks, look at class on element

for required field checks, look at class on containing div

this is more dynamic (change the class, change the validation ;)

*/


// validation functions
var fvFunction = [];
// status of form
var fvStatus = [];

// labels
var fvLabels = [];

// maxlength counters
var fvTextareaMaxlengthCounter = [];

// validator messages
var fvErrorList = [];
var fvErrors = [];


// setup form validation
function fvSet(id) {
if (document.getElementById && document.createElement && document.createTextNode) {
	form = document.getElementById(id);

	// onsubmit checking
	if (!fvFunction['submit']) {
		fvFunction['submit'] = new Function('return fvSubmit(this);')
	}
	form.onsubmit = fvRegisterEvent(form, 'onsubmit', fvFunction['submit']);

	// onreset must call onchange handlers
	if (!fvFunction['reset']) {
		fvFunction['reset'] = new Function('fvReset(\'' + id + '\');')
	}
	form.onreset = fvRegisterEvent(form, 'onreset', fvFunction['reset']);

	// process form elements
	for (var i = 0; i < form.elements.length; i++) {
		if (form.elements[i].id) {
			if (form.elements[i].tagName == 'INPUT') {
				// maxlength on input text fields
				if (form.elements[i].getAttribute('maxlength') < 1000) {
					fvSetElementMaxlength(form.elements[i], form.elements[i].getAttribute('maxlength'));
				}

				// data type validation
				if (form.elements[i].className == 'int') {
					fvSetElementInt(form.elements[i]);
				} else if (form.elements[i].className == 'percent') {
					fvSetElementPercent(form.elements[i]);
				} else if (form.elements[i].className == 'email') {
					fvSetElementEmail(form.elements[i]);
				}
			}

			// required fields
			if (form.elements[i].parentNode.className == 'required') {
				fvSetElementRequired(form.elements[i]);
			}
		}
	}
}}

// set required value handling
function fvSetElementRequired(element) {
	if (!fvFunction['required']) {
		fvFunction['required'] = new Function('fvRequired(this);');
	}
	element.onchange = fvRegisterEvent(element, 'onchange', fvFunction['required']);
}

// check required
function fvRequired(element) {
	if (element.value) {
		fvClearError(element, 'value required');
	} else {
		fvRaiseError(element, 'value required');
	}
}

// setup maxlength handling
function fvSetMaxlength() {
if (document.getElementById && document.createElement && document.createTextNode) {
	for (var i = 0; i < arguments.length; i += 2) {
		fvSetElementMaxlength(document.getElementById(arguments[i]), arguments[i+1]);
	}
}}

// setup maxlength handling
function fvSetElementMaxlength(element, maxlength) {
	// create visible counter
	var span = document.createElement('span');
	span.appendChild(document.createTextNode(maxlength));
	// track reference to counter
	fvTextareaMaxlengthCounter[element.id] = span;

	// create counter
	var em = document.createElement('em');
	em.appendChild(document.createTextNode(' ['));
	em.appendChild(span);
	em.appendChild(document.createTextNode(']'));
	em.className = 'maxlength';
	// insert counter
	element.parentNode.insertBefore(em, element.nextSibling);

	// functions to maintain counter
	var f = new Function('fvMaxlength(this,' + maxlength + ');');
	element.onchange = fvRegisterEvent(element, 'onchange', f);
	element.onkeyup = fvRegisterEvent(element, 'onkeyup', f);
	// set initial
	fvMaxlength(element, maxlength);
}

// check maxlength
function fvMaxlength(element, maxlength) {
	var remaining = maxlength - element.value.length;
	if (remaining < 0) {
		// trim content
		element.value = element.value.substring(0, maxlength);
		remaining = 0;
	}
	// display remaining characters
	var counter = fvTextareaMaxlengthCounter[element.id];
	counter.replaceChild(document.createTextNode(remaining), counter.firstChild);
}

// setup integer validation
function fvSetElementInt(element) {
	if (!fvFunction['int']) {
		fvFunction['int'] = new Function('return fvInt(this);');
	}
	element.onchange = fvRegisterEvent(element, 'onchange', fvFunction['int']);
}

// integer validation
function fvInt(element) {
	// remove all non digit characters
	element.value = element.value.replace(/[^0-9]/g, '');
}

// setup percentage validation
function fvSetElementPercent(element) {
	if (!fvFunction['int']) {
		fvFunction['int'] = new Function('return fvInt(this);');
	}
	element.onchange = fvRegisterEvent(element, 'onchange', fvFunction['int']);
}

// setup email validation
function fvSetElementEmail(element) {
	if (!fvFunction['email']) {
		fvFunction['email'] = new Function('fvEmail(this);');
	}
	element.onchange = fvRegisterEvent(element, 'onchange', fvFunction['email']);
}

// email validation
function fvEmail(element) {
	if (element.value && !element.value.match(/^\w+@\w+(\.\w+)+$/)) {
		fvRaiseError(element, 'invalid email address');
	} else {
		fvClearError(element, 'invalid email address');
	}
}

// form is about to be submitted
function fvSubmit(form) {
	var submitOK = true;

	// process form elements
	for (var i = 0; i < form.elements.length; i++) {
		// required
		if (form.elements[i].parentNode.className == 'required') {
			if (form.elements[i].value) {
				fvClearError(form.elements[i], 'value required');
			} else {
				fvRaiseError(form.elements[i], 'value required');
				submitOK = false;
			}
		}
	}

	// debugging?
	if (form.className == 'debug') {
		if (submitOK) {
			fvDebug('Form "' + form.id + '" data validated.', form);
		}
		return false;
	}
	
	return submitOK;
}

// form is about to be reset
function fvReset(form) {
	// trigger onchange handlers AFTER reset occurs
	setTimeout('fvResetChange(\'' + form + '\');', 1);
}

// called AFTER a reset event
function fvResetChange(form) {
	var status = fvStatus[form];
	fvStatus[form] = 'reset';
	form = document.getElementById(form);

	for (var i = 0; i < form.elements.length; i++) {
		if (form.elements[i].onchange) {
			form.elements[i].onchange();
		}
	}
	// restore status
	fvStatus[form.id] = status;
}

// raise an error
function fvRaiseError(element, message) {
	if (fvStatus[element.form.id] == 'reset') {
		fvClearError(element, message);
		return;
	}

	// class on element and label
	var label = fvGetLabel(element.id);
	label.className = element.className = 'error';


	// append to list of errors for control
	var id = element.id;
	var ol = fvErrorList[id];
	if (!ol) {
		fvErrorList[id] = ol = document.createElement('ol');
		ol.className = 'error';
	}
	element.parentNode.insertBefore(ol, label);

	var li = fvErrors[id+message];
	if (!li) {
		li = fvErrors[id+message] = document.createElement('li');
		li.appendChild(document.createTextNode(message));
	}
	ol.appendChild(li);

	// append to list of errors for form
	ol = fvErrorList[element.form.id];
	if (!ol) {
		fvErrorList[element.form.id] = ol = document.createElement('ol');
		ol.className = 'error';
	}
	element.form.insertBefore(ol, element.form.lastChild);
	li = fvErrors[element.form.id+id+message];
	if (!li) {
		li = fvErrors[element.form.id+id+message] = document.createElement('li');
		li.appendChild(document.createTextNode(label.firstChild.data + ': ' + message));
	}
	ol.appendChild(li);
}

// clear an error
function fvClearError(element, message) {
	// clear message
	var id = element.id;
	if (fvErrors[id+message]) {
		// remove the message/s
		fvErrors[id+message].parentNode.removeChild(fvErrors[id+message]);
		fvErrors[element.form.id+id+message].parentNode.removeChild(fvErrors[element.form.id+id+message]);
		// remove the control messages list
		if (!fvErrorList[id].firstChild) {
			fvErrorList[id].parentNode.removeChild(fvErrorList[id]);
			// class on element and label
			element.parentNode.firstChild.className = element.className = null;
		}
		// remove the form messages list
		id = element.form.id;
		if (!fvErrorList[id].firstChild) {
			fvErrorList[id].parentNode.removeChild(fvErrorList[id]);
			// class on element and label
			element.parentNode.firstChild.className = element.className = null;
		}
	}
}

// get associated label
function fvGetLabel(id) {
	if (!fvLabels[id]) {
		labels = document.getElementsByTagName('label');
		var i = 0;
		while (i < labels.length && labels[i].htmlFor != id) {
			i++;
		}
		fvLabels[id] = labels[i];
	}
	return fvLabels[id];
}

// modifying event handlers
function fvRegisterEvent(element, handler, newFunction, append) {
	var oldFunction = eval('element.' + handler)

	if (oldFunction) {
		// remove 'function blah(blah) { ... }' wrapper code
		oldFunction = fvFunctionCode(oldFunction);
      
	    // prepend or append?
		newFunction = fvFunctionCode(newFunction);
		if (append) {
			newFunction = new Function(oldFunction + newFunction);
		} else {
			newFunction = new Function(newFunction + oldFunction);
		}
	}

	return newFunction;
}

// get the code of a function
function fvFunctionCode(f) {
	f = f.toString();
	return f.substring(f.indexOf('{') + 1, f.lastIndexOf(';') + 1);
}

// debugging
function fvDebug(message, form) {
	if (form.className == 'debug') {
		alert(message);
		if (!confirm('Continue debugging?')) {
			form.className = null;
		}
	}
}
