var hiragana = /[\u3040-\u309f]/;
var katakana = /[\u30a0-\u30ff]/;
var kanji = /[\u4e00-\u9faf]/;
var replacements = {};
chrome.storage.local.get('replacements', (data) => {
  replacements = data.replacements;
});

console.log('DeepL monitoring started');

(() => {
  const processMessage = (msg) => {
    var maxLineLength = msg.options.maxLength;
    var characterToIgnoreTest = msg.options.ignore;
    var inputLanguage = msg.options.inputLanguage;
    var outputLanguage = msg.options.outputLanguage;

    switch (msg.action) {
      case 'insert':
        // Do nothing if text starts with special character
        if (msg.text.startsWith(characterToIgnoreTest)) break;
        // Get current Japanese text from URL
        var currentJapaneseText = decodeURIComponent(
          document.URL.replace('https://www.deepl.com/translator#' + inputLanguage + '/' + outputLanguage + '/', '')
        );
        // If the Japanese text in the URL and the text in your clipboard is different...
        if (currentJapaneseText !== msg.text) {
          // Check length
          if (maxLineLength >= msg.text.length) {
            // Check if the text is japanese, but only if the input language is set to jp
            if ((inputLanguage === 'ja' && (hiragana.test(msg.text) || katakana.test(msg.text) || kanji.test(msg.text))) || inputLanguage !== 'ja') {
              let text = msg.text;

              // Process replacements
              for (const item of replacements) {
                let replacement = item.replacement;
                // If replacement is a function and not plain text, parse it
                if(item.function) replacement = new Function('...args', replacement);
                  text = text.replace(item.pattern, replacement);
              }

              // Then change the URL to your clipboard's content, starting the translation process.
              //document.location.href = 'https://www.deepl.com/translator#' + inputLanguage + '/' + outputLanguage + '/' + text;
              window.location.hash = '#' + inputLanguage + '/' + outputLanguage + '/' + text;
            }
          }
        }
        break;

      case 'uninject':
        chrome.runtime.onMessage.removeListener(processMessage);
        break;
    }
  };
  chrome.runtime.onMessage.addListener(processMessage);
})();
