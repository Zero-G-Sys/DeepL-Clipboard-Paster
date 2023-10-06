# DeepL-Clipboard-Paster

This extension will let you auto paste the contents of your clipboard into DeepL.

This was originally shared on 4chan, and created by xScruffers, but I can't find any more info.
The instructions.txt is the one it originally came off with.

I actually fixed it as it stopped working, and added some more functions that you can find in the extension options.
Also in the releases you can find a packed xpi for use on Firefox.

### Firefox Install
To install the package on firefox, and prevent from it being uninstalled on restart you need (Not confirmed, may be outdated)
* A dev or esr version
* in `about:config` set `xpinstall.signatures.required` to false
* in `about:addons`, install the addon from file

### Needs a separate script to work
To copy the translated text back to the clipboard you will need a userscript running (Use with tampermonkey or equivalent)
Find the updated version [here](https://greasyfork.org/en/scripts/476033-deepl-auto-vn-translation-extension-helper)