/* 
 Shinyforms Dashboard Widget.  
 */

// Globals
var DEBUG = false;

//
// Function: load()
// Called by HTML body element's onload event when the widget is ready to start
//
function load()
{
	if (window.dashcode) {
		dashcode.setupParts();
	}
	
	// Debugging
	if (DEBUG) {
		// Setup local testing parameters
		Shinyforms.secure = false;
		Shinyforms.domain = 'shinyforms.local:3000';
		$('#subdomain').val('test');
		$('#token').val('T51pTb5gKYGDypW8bwU4');
	} else {
		// Load saved preferences
		if (window.widget) {
			$('#subdomain').val(widget.preferenceForKey('subdomain'));
			$('#token').val(widget.preferenceForKey('token'));
		}
	}
	
	// Setup preference buttons.	
	gDoneButton = new AppleGlassButton(document.getElementById("done"), "Done", showFront);
	gInfoButton = new AppleInfoButton(document.getElementById("info"), document.getElementById("front"), "black", "white", showBack);
	
	// Setup Apple styled buttons.
	gEnterTimeButton = new AppleButton(document.getElementById('enterTimeButton'), 'Enter time', 22, 'Images/black-button-left.png', 'Images/black-button-left.png', 10, 'Images/black-button-middle.png', 'Images/black-button-middle.png', 'Images/black-button-right.png', 'Images/black-button-right.png', 10);
	gSubmitTimeButton = new AppleButton(document.getElementById('submitTimeButton'), 'Submit', 22, 'Images/black-button-left.png', 'Images/black-button-left.png', 10, 'Images/black-button-middle.png', 'Images/black-button-middle.png', 'Images/black-button-right.png', 'Images/black-button-right.png', 10); 
	gViewTimesheetButton = new AppleButton(document.getElementById('viewTimesheetButton'), 'View Timesheet', 22, 'Images/black-button-left.png', 'Images/black-button-left.png', 10, 'Images/black-button-middle.png', 'Images/black-button-middle.png', 'Images/black-button-right.png', 'Images/black-button-right.png', 10); 

	// Hide the report panel.
	$('#report').hide();

	// Reset the status text.
	$('#status').text('');
    
	// Initialize Shinyforms.
	Shinyforms.init({
		subdomain: $('#subdomain').val(),
		auth_token: $('#token').val()
	});

	// Update the timer.
	Shinyforms.timer.addEventListener('update', function(e){
		$('#hoursA').text(e.time.substr(0,1));
		$('#hoursB').text(e.time.substr(1,1));
		$('#minutesA').text(e.time.substr(3,1));
		$('#minutesB').text(e.time.substr(4,1));
		$('#secondsA').text(e.time.substr(6,1));
		$('#secondsB').text(e.time.substr(7,1));
	});
    
	// Start the timer.
	$('#startButton').click(function(e){
		Shinyforms.timer.start();
		$('#startButton').hide();
		$('#pauseButton').show();
		hidePanel();
	});
    
	// Pause the timer.
	$('#pauseButton').click(function(e){
		pauseTimer();
	});
  
	// Reset the timer.
	$('#resetButton').click(function(e){
		Shinyforms.timer.reset();
		$('#startButton').show();
		$('#pauseButton').hide();
	});
    
	// Load clients, projects, and tasks from account.
	$('#enterTimeButton').click(function(e){
    
		// Pause the timer.
		pauseTimer();

		// Show the panel if it's hidden.
		if ($('#panel').is(':hidden')) {
			
			// Show the progress button.
			$('#enterTimeButton').hide();
			$('#enterTimeButtonProgress').show();
			
			// Reset the status.
			$('#status').text('');
    
			// Retrieve the clients from the API.
			Shinyforms.api('/clients', function(response){
            
				// Hide the progress button.
				$('#enterTimeButtonProgress').hide();
				$('#enterTimeButton').show();
				
				// Check for an error.
				if (response.statusText == 'timeout') {
					$('#status').text('Response timed out.');
					return;
				} else if (response.statusText == 'Unauthorized') {
					$('#status').text('Unauthorized.');
					return;
				} else if (response.statusText == 'error') {
					$('#status').text('Please provide your subdomain and token.');
					return;
				} else if (response.error) {
					$('#status').text(response.error);
					return;
				} else if (response.status) {
					$('#status').text(response.status + ' ' + response.statusText);
					return;
				}
            
				// Save the data.
				Shinyforms.clients = response;
            
				// Prepare the dropdowns.
				$('#projectMenu').html('<option value>Select a project</option>');
				$('#taskMenu').html('<option value>Select a task</option>');
            
				// Populate the dropdowns.
				var numClients = response.length;                
				for (var i = 0; i < numClients; i++) {
					var client = response[i];                
					var numProjects = client.projects.length;
					if (numProjects > 0) {                
						$('#projectMenu').append('<optgroup label="' + client.name + '">');
						for (var j = 0; j < numProjects; j++) {
							var project = client.projects[j];
							var fullname = project.name;
							if (project.code.length > 0) fullname = project.code + ' - ' + fullname;
							$('#projectMenu').append('<option value="' + project.id + '">&nbsp;&nbsp;' + fullname + '</option>');
						}                
						$('#projectMenu').append('</optgroup>'); 
					}               
				}
	
				// Populate the graphic dropdown.
				$('#projectMenu').removeAttr('disabled');
				$('#projectMenuText').text($("#projectMenu option[value='']").text());
				$('#taskMenu').val('').attr('disabled', 'disabled');
				$('#taskMenuText').text($("#taskMenu option[value='']").text()).addClass('disabled');
	
				// Show the entry form.
				$('#entry').show();
				$('#report').hide();
            
				// Populate the hours input.
				var hours = Shinyforms.timer.elapsedTime / 3600000;
				$('#hours').val(formatHours(hours));
	
				// Empty the notes.
				$('#notes').val('');
            
				// Show the panel.
				$('#frontCollapsedImg').hide();
				$('#status').hide();
				$('#info').hide();
				$('#panel').show().animate({
					height: '132px'
				}, 400, function(){
					$('#panelContent').fadeTo(400, 1);
					$('#info').css('top', '152px').show();
					$('#status').css('top', '152px').show();
				});
            
			}); // Shinyforms.api

		} else { 
			
			// Collapse the panel.
			hidePanel();
			
		} // end if panel is hidden
        
	}); // #enterTime.click
        
	// Load the selected project tasks.
	$('#projectMenu').change(function(e){
    
		// Get the selected project.
		var project_id = $(this).val();
        
		// Prepare the task menu.
		$('#taskMenu').html('<option value>Select a task</option>');  

		// Populate the task menu.
		if (project_id != '') {
			var numClients = Shinyforms.clients.length;
			for (var i = 0; i < numClients; i++) {
				var client = Shinyforms.clients[i];
				var numProjects = client.projects.length;
				for (var j = 0; j < numProjects; j++) {
					var project = client.projects[j];
					if (project.id == project_id) {                    
						var numTasks = project.task_assignments.length;
						for (var k = 0; k < numTasks; k++) {
							var task = project.task_assignments[k].task;
							$('#taskMenu').append('<option value="' + task.id + '">&nbsp;&nbsp;' + task.name + '</option>');
						}
						// found the project, end loop here
						break;
					}
				}
			}    
			$('#taskMenu').removeAttr('disabled');
			$('#taskMenuText').removeClass('disabled');
		} else {
			$('#taskMenu').attr('disabled', 'disabled');
			$('#taskMenuText').addClass('disabled');
		} // if project_id

		// Update the graphic dropdowns.
		$('#projectMenuText').text($("#projectMenu option[value='" + project_id + "']").text());
		$('#taskMenuText').text($("#taskMenu option[value='']").text());
        
	}); // #project_id.change

	// Load the selected project tasks.
	$('#taskMenu').change(function(e){
		var task_id = $(this).val();
		$('#taskMenuText').text($("#taskMenu option[value='" + task_id + "']").text());
	}); // #task_id.change

	// Submit timesheet to account.
	$('#submitTimeButton').click(function(e){
    
		// Grab the inputs.
		var project_id = $('#projectMenu').val();
		var task_id = $('#taskMenu').val();
		var hours = $('#hours').val();
		var notes = $('#notes').val();

		// Validate fields.
		var valid = true;
		if (project_id == '') {
			$('#status').text('Please select a project.');
			valid = false;
		} else if (task_id == '') {
			$('#status').text('Please select a task.');
			valid = false;
		} else if (isNaN(Number(hours))) {
			$('#status').text('Hours need to be a valid number.');
			valid = false;
		} else if (Number(hours) <= 0 || Number(hours) > 24) {
			$('#status').text('Hours need to be between 0 and 24.');
			valid = false;
		}       
		if (!valid) return false;		

		// Create a JSON timesheet.
		var timesheet = {
			project_id: project_id,
			task_id: task_id,
			hours: hours,
			notes: notes
		};

		// Show the progress button.
		$('#submitTimeButton').hide();
		$('#submitTimeButtonProgress').show();

		// Reset the status.
		$('#status').text('');
        
		// Post a new timesheet to the API.
		Shinyforms.api('/timesheets', 'post', timesheet, function(response){

			// Hide the progress button.
			$('#submitTimeButtonProgress').hide();
			$('#submitTimeButton').show();
			
			// Check for an error.
			if (response.error) {
				$('#status').text(response.error);
				return;
			} else if (response.status) {
				$('#status').text(response.status + ' ' + response.statusText);
				return;
			// Check for a timeout.
			} else if (response.statusText == 'timeout') {
				$('#status').text('Response timed out.');
				return;
			}
        
			// Save the data.
			Shinyforms.timesheet = response;

			// Populate the fields.
			$('#clientName').html(response.project.name);
			$('#taskName').text(response.task.name);
			$('#hoursEntered').html(response.hours_entered);

			var pct = 0;
			if (parseFloat(response.budget) > 0) {
				pct = Math.round(parseFloat(response.total_hours) / parseFloat(response.budget) * 100);
			}
			$('#hoursSpent').html('<strong>Hours spent</strong><br>' + response.total_hours + ' (' + pct + '%)');
			if (pct < 0) pct = 0;
			if (pct > 100) pct = 100;
			$('#budget .progress .bar').css('width', pct + '%');

			var hours_left = parseFloat(response.budget) - parseFloat(response.total_hours);
			if (hours_left < 0) hours_left = 0;
			var leftPct = 0;
			if (parseFloat(response.budget) > 0) {
				leftPct = Math.round(parseFloat(hours_left) / parseFloat(response.budget) * 100);
			}
			if (leftPct < 0) leftPct = 0;
			if (leftPct > 100) leftPct = 100;
			$('#hoursLeft').html('<strong>Hours left</strong><br>' + formatHours(hours_left) + ' (' + leftPct + '%)'); 
            
			// Show the report.
			$('#entry').hide();
			$('#report').show();
			
			// Reset the timer.
			Shinyforms.timer.reset();
            
		});
    
	}); // #submit.click
    
	// Cancel the entry.
	$('#cancelButton').click(function(e){
		hidePanel();
	});
    
	// Visit the Shinyforms timesheet.
  $('#viewTimesheetButton').click(function(e){
		if (Shinyforms.timesheet != null) {
			var url = Shinyforms.dailyTimesheetURL();
			if (window.widget) {
				widget.openURL(url);
			} else {
				window.open(url);
			}
		}
	}); // #viewTimeshet.click
    
	// Close the report.
	$('#closeButton').click(function(e){
		hidePanel();
	}); // #close.click   
    
}

//
// Function: remove()
// Called when the widget has been removed from the Dashboard
//
function remove()
{
	// Stop any timers to prevent CPU usage
	// Remove any preferences as needed
	// widget.setPreferenceForKey(null, dashcode.createInstancePreferenceKey("your-key"));
}

//
// Function: hide()
// Called when the widget has been hidden
//
function hide()
{
	// Stop any timers to prevent CPU usage
}

//
// Function: show()
// Called when the widget has been shown
//
function show()
{
	// Restart any timers that were stopped on hide
}

//
// Function: sync()
// Called when the widget has been synchronized with .Mac
//
function sync()
{
	// Retrieve any preference values that you need to be synchronized here
	// Use this for an instance key's value:
	// instancePreferenceValue = widget.preferenceForKey(null, dashcode.createInstancePreferenceKey("your-key"));
	//
	// Or this for global key's value:
	// globalPreferenceValue = widget.preferenceForKey(null, "your-key");
}

//
// Function: showBack(event)
// Called when the info button is clicked to show the back of the widget
//
// event: onClick event from the info button
//
function showBack(event)
{
	var front = document.getElementById("front");
	var back = document.getElementById("back");

	if (window.widget) {
		$('#subdomain').val(widget.preferenceForKey('subdomain'));
		$('#token').val(widget.preferenceForKey('token'));
		widget.prepareForTransition("ToBack");
	}

	front.style.display = "none";
	back.style.display = "block";

	if (window.widget) {
		setTimeout('widget.performTransition();', 0);
	}
}

//
// Function: showFront(event)
// Called when the done button is clicked from the back of the widget
//
// event: onClick event from the done button
//
function showFront(event)
{
	var front = document.getElementById("front");
	var back = document.getElementById("back");

	if (window.widget) {
		widget.setPreferenceForKey($('#subdomain').val(), 'subdomain');
		widget.setPreferenceForKey($('#token').val(), 'token');
		widget.prepareForTransition("ToFront");
	}

	// Initialize Shinyforms.
	Shinyforms.init({
		subdomain: $('#subdomain').val(),
		auth_token: $('#token').val()
	});

	front.style.display="block";
	back.style.display="none";

	if (window.widget) {
		setTimeout('widget.performTransition();', 0);
	}
}

if (window.widget) {
	widget.onremove = remove;
	widget.onhide = hide;
	widget.onshow = show;
	widget.onsync = sync;
}

// Pause the timer.
function pauseTimer() 
{
	Shinyforms.timer.pause();
	$('#startButton').show();
	$('#pauseButton').hide();	
}

// Collapse the panel.
function hidePanel()
{
	// Hide the status bar elements.
	$('#info').hide();
	$('#status').text('');

	// Hide the panel.
	$('#panelContent').fadeTo(400, 0, function(){
		$('#panel').animate({
			height: '34px'
		}, 400, function(){
			$('#panel').hide();
			$('#frontCollapsedImg').show();
			$('#info').css('top', '54px').show();
			$('#status').css('top', '54px');
		});
	});
}

// Helper function to format time in hours.
function formatHours(hours) 
{
	var roundedHours = Math.floor(hours * 100) / 100;
	var hoursString = roundedHours.toString();
	if (roundedHours == 0) hoursString = '0.00';
	if (roundedHours % 1 == 0) hoursString = Math.floor(roundedHours) + '.00';
	else if ((roundedHours * 10) % 1 == 0) hoursString = roundedHours + '0';
	return hoursString;
};
