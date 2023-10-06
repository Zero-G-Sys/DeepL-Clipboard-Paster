document.addEventListener('DOMContentLoaded', () => {
  const monitorInterval = document.querySelector('#monitor-interval');
  const maxLength = document.querySelector('#max-length');
  const ignore = document.querySelector('#ignore');
  const inputLanguage = document.querySelector('#input-language');
  const outputLanguage = document.querySelector('#output-language');

  const storage = chrome.storage.local;

  storage.get(defaultOptions, (o) => {
    monitorInterval.value = o.monitorInterval;
	maxLength.value = o.maxLength;
	ignore.value = o.ignore;
	inputLanguage.value = o.inputLanguage;
	outputLanguage.value = o.outputLanguage;
  });
  monitorInterval.onchange = () => {
    const newVal = monitorInterval.value;
    if (newVal >= 100) {
      storage.set({ monitorInterval: monitorInterval.value });
    }
  };
  maxLength.onchange = () => storage.set({ maxLength: maxLength.value });
  ignore.onchange = () => storage.set({ ignore: ignore.value });
  inputLanguage.onchange = () => storage.set({ inputLanguage: inputLanguage.value });
  outputLanguage.onchange = () => storage.set({ outputLanguage: outputLanguage.value });

  /*---------------------------------------------------------------------------------*/
  /* Replacements */
  /*-------------*/
  // Function to generate the HTML for the three fields
  function getFieldGroupHTML() {
    return `
		<div class="pure-control-group replacements">
			<label for="text-to-be-replaced">Replace (regex)</label>
			<span style="color:red">/</span>
			<input type="text" class="key" id="text-to-be-replaced" placeholder="Enter a regex pattern" />
			<span style="color:red">/</span>
			<input type="text" class="flags" id="regex-flags" placeholder="Flags" style="width: 50px;" pattern="^(?!.*(.).*\\1)[gimus]*$" title="Incorrect RegExp flag(s)" />
			<br><div id="regex-validation-message" style="color: red;display: none;margin-left:4em"></div>
			<br>
			<label for="text-replacement">Replacement</label>
			<input type="text" class="value" id="text-replacement" placeholder="Enter a replacement" />
			<label for="is-function">Function</label>
			<input type="checkbox" class="function" id="is-function" />
			<button type="button" class="removeButton">Remove</button>
			<div class="error"></div>
			<hr>
		</div>
	`;
  }

  // Function to add a new text field group
  function addField() {
    const container = document.getElementById('replacementInputs');

    // Create a div for the new field group
    const newFieldGroup = document.createElement('div');
    newFieldGroup.innerHTML = getFieldGroupHTML();

    // Append the new field group to the container
    container.appendChild(newFieldGroup);

    // Attach a click event handler to the Remove button for this field group
    const removeButton = newFieldGroup.querySelector('.removeButton');
    removeButton.addEventListener('click', () => {
      container.removeChild(newFieldGroup);
      updateRemoveButtonsVisibility();
    });

    // Show the Remove button for all but the first line
    updateRemoveButtonsVisibility();

	// Attach an onChange event handler to the regex input
	const regexInput = newFieldGroup.querySelector('.key');
    regexInput.addEventListener('change', () => {
		validateRegexInput(newFieldGroup);
    });

    // Attach an onChange event handler to the flags input
    const flagsInput = newFieldGroup.querySelector('.flags');
    flagsInput.addEventListener('change', () => {
      validateFlagsInput(flagsInput);
    });

    // Attach an onChange event handler to the function checkbox
    const functionCheckbox = newFieldGroup.querySelector('.function');
    functionCheckbox.addEventListener('change', () => {
      toggleReplacementField(newFieldGroup);
    });

	return newFieldGroup;
  }

  // Function to validate the input text as a regular expression
  function validateRegexInput(newFieldGroup) {
	const regexInput = newFieldGroup.querySelector("#text-to-be-replaced");
	const validationMessage = newFieldGroup.querySelector("#regex-validation-message");
	const regexText = regexInput.value;

	try {
		// Attempt to create a RegExp object from the input text
		new RegExp(regexText);
		validationMessage.style.display = 'none';
	} catch (error) {
		// If an error is thrown, it's not a valid regular expression
		validationMessage.textContent = "Invalid regex: " + error.message;
		validationMessage.style.display = 'inline-block';
	}
}

  // Function to update the visibility of Remove buttons
  function updateRemoveButtonsVisibility() {
    const removeButtons = document.querySelectorAll('.removeButton');
    if (removeButtons.length > 1) {
      removeButtons.forEach((button, index) => {
        // Show the Remove button for all but the first line
        button.style.display = index === 0 ? 'none' : 'inline-block';
      });
    } else {
      // Hide all Remove buttons if there's only one line
      removeButtons.forEach((button) => {
        button.style.display = 'none';
      });
    }
  }

  // Function to validate the flags input
  function validateFlagsInput(input) {
    const pattern = /^(?!.*(.).*\1)[gimus]*$/;
    const value = input.value;
    const errorDiv = input.parentElement.querySelector('.error');

    if (!pattern.test(value)) {
      errorDiv.textContent = 'Incorrect RegExp flag(s)';
      input.setCustomValidity('Incorrect RegExp flag(s)');
    } else {
      errorDiv.textContent = '';
      input.setCustomValidity('');
    }
  }

  // Function to toggle the Replacement field between input and textarea
  function toggleReplacementField(fieldGroup) {
    const replacementInput = fieldGroup.querySelector('.value');
    const isFunctionCheckbox = fieldGroup.querySelector('.function');
    const tooltipText = 'Input a function to be processed in the JavaScript replace function. Only add the body of the function and use the variable args to get all its arguments';

    if (isFunctionCheckbox.checked) {
      // Replace the input with a textarea
      const textarea = document.createElement('textarea');
      textarea.className = 'value';
      textarea.id = 'text-replacement';
      textarea.placeholder = 'Enter a function\nExample:\nreturn args[1] + \'added text\'';
      textarea.title = tooltipText;
      replacementInput.parentElement.replaceChild(textarea, replacementInput);
    } else {
      // Replace the textarea with an input
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'value';
      input.id = 'text-replacement';
      input.placeholder = 'Enter a replacement';
      replacementInput.parentElement.replaceChild(input, replacementInput);
    }
  }

  // Function to get the key-value pairs as an object array
  function getFieldsData() {
    const fieldGroups = document.querySelectorAll('.pure-control-group.replacements');
    const fieldsData = [];

    fieldGroups.forEach((group) => {
      const key = group.querySelector('.key').value;
      const flags = group.querySelector('.flags').value;
      const value = group.querySelector('.value').value;
      const isFunction = group.querySelector('.function').checked;

      if (key) {
        fieldsData.push({ pattern: new RegExp(key, flags), replacement: value, function: isFunction });
      }
    });

    return fieldsData;
  }

  // Attach a click event handler to the Add Field button
  const addButton = document.getElementById('addButton');
  addButton.addEventListener('click', addField);

  // Function to save data to chrome.storage.local
  function saveToStorage(data) {
    chrome.storage.local.set({ replacements: data }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error saving data to storage:', chrome.runtime.lastError);
      } else {
        console.log('Data saved successfully.');
      }
    });
  }

  // Attach a click event handler to the Save Replacements button
  const saveButton = document.getElementById('saveButton');
  saveButton.addEventListener('click', () => {
    const fieldsData = getFieldsData();
    saveToStorage(fieldsData);
    console.log('Data saved:', fieldsData);
  });

  // Function to set default values based on data from chrome.storage.local
  function setDefaultValues() {
    chrome.storage.local.get('replacements', (data) => {
      if (data.replacements && Array.isArray(data.replacements)) {
		if(data.replacements.length === 0) addField();
		else{
			data.replacements.forEach((replacement) => {
			const newFieldGroup = addField();

			// Set values from storage
			const keyInput = newFieldGroup.querySelector('.key');
			const flagsInput = newFieldGroup.querySelector('.flags');
			const valueInput = newFieldGroup.querySelector('.value');
			const functionCheckbox = newFieldGroup.querySelector('.function');

			keyInput.value = replacement.pattern.source;
			flagsInput.value = replacement.pattern.flags;
			valueInput.value = replacement.replacement;
			functionCheckbox.checked = replacement.function;
			});
		}
      } else{
		console.log('Error getting replacements data');
		addField();
	  }
    })
  }

  // Call setDefaultValues to populate fields on page load
  setDefaultValues();
});
