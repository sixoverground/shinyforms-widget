// Timer
// =====

// Create the timer.
Timer = function() {};

// Define parameters.
Timer.prototype.paused = false;
Timer.prototype.interval = null;
Timer.prototype.startTime = 0;
Timer.prototype.currentTime = 0;
Timer.prototype.elapsedTime = 0;
Timer.prototype.time = '00:00:00';
Timer.prototype.listeners = [];

// Start the timer.
Timer.prototype.start = function() {
	if (this.paused) {
		var now = new Date().getTime();
		var pausedTime = now - this.currentTime;
		this.startTime = this.startTime + pausedTime;
		this.currentTime = now;
	} else {
		this.startTime = new Date().getTime();
		this.currentTime = this.startTime;
	}
	this.paused = false;
	this.update();
	var self = this;
	if (this.interval) clearInterval(this.interval);
	this.interval = setInterval(function(){self.update();}, 1000);
};

// Pause the timer.
Timer.prototype.pause = function() {
	if (this.interval) {
		clearInterval(this.interval);
		this.interval = null;
		this.paused = true;
		this.currentTime = new Date().getTime();
		this.update();
	}
};

// Reset the timer.
Timer.prototype.reset = function() {
	if (this.interval) {
		clearInterval(this.interval);
		this.interval = null;
	}
	this.paused = false;
	this.startTime = new Date().getTime();
	this.currentTime = this.startTime;
	this.update();
};

// Update the timer and dispatch event.
Timer.prototype.update = function() {
	this.currentTime = new Date().getTime();
	this.elapsedTime = this.currentTime - this.startTime;

	var modH = this.elapsedTime % 3600000;
	var timerHours = (this.elapsedTime - modH) / 3600000;
	var modM = modH % 60000;
	var timerMinutes = (modH -  modM) / 60000;
	var timerSeconds = Math.floor(modM / 1000);	
	
	var h = parseInt(timerHours, 10);
	var m = parseInt(timerMinutes, 10);
	var s = parseInt(timerSeconds, 10);
	
	if (h < 10) h = '0' + h;	
	if (m < 10) m = '0' + m;	
	if (s < 10) s = '0' + s;
    
	this.time = h + ':' + m + ':' + s;
	this.trigger('update', { time: this.time });    
};

// Add an event listener that waits for dispatched events.
Timer.prototype.addEventListener = function(type, callback) {
	if (this.listeners[type]) this.listeners[type].push(callback);
	else this.listeners[type] = [callback];
};

// Dispatch a timer event.
Timer.prototype.trigger = function(type, args) {
	var numListeners = this.listeners[type].length;
	for (var i = 0; i < numListeners; i++) {
		this.listeners[type][i](args);
	}    
};
