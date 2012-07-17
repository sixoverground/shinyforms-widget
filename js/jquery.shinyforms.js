// Shinyforms API
// ==============

// Create the Shinyforms API.
Shinyforms = function() {};

// Set defaults.
Shinyforms.secure = true; // use https
Shinyforms.domain = 'shinyforms.com'; // web server
Shinyforms.format = 'json'; // data format
Shinyforms.timeout = 30000; // amount of time to wait for response

// Initialize Shinyforms with preset options.
Shinyforms.init = function(options) {
	this.subdomain = options.subdomain;
	this.auth_token = options.auth_token;
};

// The universal API function.
Shinyforms.api = function() {

	// Organize the passed arguments.
	var args = arguments;
	var path = args[0]; // path to api method
	var method = 'get'; // request method
	var params = null; // parameters to pass
	var cb = function() {}; // callback method
	if (args.length == 2) cb = args[1];
	else if (args.length == 3) {
		method = args[1];
		cb = args[2];
	} else if (args.length == 4) {
		method = args[1];
		params = args[2];
		cb = args[3];
	}

	// Generate the URL.
	var url = Shinyforms.getProtocol() + Shinyforms.subdomain + '.' + Shinyforms.domain + path + '.' + Shinyforms.format + '?auth_token=' + Shinyforms.auth_token;   
    
	// Convert data parameters to JSON.
	if (params != null) params = JSON.stringify(params);
    
	// Call the method through AJAX.
	$.ajax({
		url: url,
		type: method,
		data: params,
		success: cb,
		error: cb,
		contentType: 'application/json',
		timeout: Shinyforms.timeout
	});

};

// Determine the protocol.
Shinyforms.getProtocol = function() {
	if (Shinyforms.secure) return 'https://';
	else return 'http://';
}

// Construct a valid URL to a daily timesheet.
Shinyforms.dailyTimesheetURL = function() {
	return Shinyforms.getProtocol() + Shinyforms.subdomain + '.' + Shinyforms.domain + '/timesheets/daily/' + Shinyforms.timesheet.user_id + '/' + Shinyforms.timesheet.date;
};

// Properties
Shinyforms.clients = [];
Shinyforms.timesheet = null;
Shinyforms.timer = new Timer();
