console.log("DeepL Clipboard Catcher extension started");

let previousContent = "";
let listeningTabs = [];
let timer = null;
let options = defaultOptions;

// Set configuration options (Currently not used for nothing)	
chrome.storage.local.get(defaultOptions, o => options = o);
chrome.storage.onChanged.addListener((changes, area) => {
	try{
		if(area === "local") {
			const optionKeys = Object.keys(options);
			for(key of Object.keys(changes)) {
				if(optionKeys.indexOf(key) >= 0) {
					options[key] = changes[key].newValue;
				}
			}
			updateTimer()
		}
	}catch(ex){
		console.log('Error on options onChangeListener', ex);
	}
})

// Add listener to enable/disable button
chrome.browserAction.onClicked.addListener(() => {
	try{
		chrome.tabs.query(
			{ active: true, currentWindow: true }, 
			([t]) => toggleTab(t.id)
		);
	}catch(ex){
		console.log('Error on toggleTab Listener', ex);
	}
})

// Enable/disable extension
function toggleTab(id) {
	try{
		const index = listeningTabs.indexOf(id);
		if(index >= 0) {
			uninject(id);
			listeningTabs.splice(index, 1);
			updateTimer();
			chrome.browserAction.setBadgeText({ text: "", tabId: id });
		} else {
			chrome.tabs.executeScript({file: "/fg/insert.js"});
			listeningTabs.push(id);
			updateTimer();
			chrome.browserAction.setBadgeBackgroundColor({ color: "green", tabId: id });
			chrome.browserAction.setBadgeText({ text: "ON", tabId: id });
			chrome.browserAction.setBadgeTextColor({ color: "red" });
		}
	}catch(ex){
		console.log('Error on toggleTab', ex);
	}
}

// Send clipboard text to insert.js
function notifyForeground(id, text) {
	try{
		chrome.tabs.sendMessage(id, {
			action: "insert", text, options
		});
	}catch(ex){
		console.log('Error on notifyForeground', ex);
	}
}

// Stop extension for current tab (if it was active)
function uninject(id) {
	try{
		chrome.tabs.sendMessage(id, { action: "uninject" });
	}catch(ex){
		console.log('Error on uninject', ex);
	}
}

// Get text from clipboard
function checkClipboard(){
	navigator.clipboard
		.readText()
		.then((content) => {
			if(content.trim() !== previousContent.trim() && content != "") {
				listeningTabs.forEach(id => notifyForeground(id, content))
				previousContent = content
			}
		})
		.catch(err => console.log('Error getting clipboard', err));
}

// Regularly check the clipboard for new text
function updateTimer() {
	try{
		function stop() {
			clearInterval(timer.id);
			timer = null;
		}
		function start() {
			const id = setInterval(checkClipboard, options.monitorInterval);
			timer = { id, interval: options.monitorInterval };
		}
		if(listeningTabs.length > 0) {
			if(timer === null) {
				start();
			} else if(timer.interval !== options.monitorInterval) {
				stop();
				start();
			}
		} else {
			stop();
		}
	}catch(ex){
		console.log('Error on timer', ex);
	}
}
