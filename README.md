# MRlookup
Extract BibTeX data automatically and modify BibTeX Key to AUTHOR_YEAR_TITLE

### Introduction
This script will acts on [mrlookup](http://www.ams.org/mrlookup) and [mathscinet](http://www.ams.org/mathscinet), which will change the bibtex key to AuthorsFirstName+Year+FirstWordofTitle. With the following features:

* You can set ignore words for the title, the current setting is:

```javascript
var IgnoreStringInTitle = [
  'a',
  'an',
  'on',
  'the',
  'another'
];
```

* You can copy the bibitem to clipboard by simply click on it

### How to install?
I only use it on [firefox](https://www.mozilla.org/en-US/firefox/products/) with `GreaseMonkey` adds on, the script can be installed by the [guide](https://openuserjs.org/about/Greasemonkey-for-Firefox).

You may also want to have a look on [how to install for other bowsers](https://openuserjs.org/about/Userscript-Beginners-HOWTO), but may face compatibility problem, since the click-to-copy function is based on Greasemonkey's `GM_setClipboard` function.

### How to feedback?
If you have any suggestion, you can contact me at van141.abel(at)gmail.com. Also, you can initial an [issue](https://openuserjs.org/scripts/van141.abelgmail.com/MRLookup/issues)

### Update Log

#### Version 1.5

* Add `https://mathscinet.ams.org/mrlookup`

#### Version 1.4

* Fix the wrong regular expression for extracting the first word of title

#### Version 1.3

* Add rule to clean international character in title and author

#### Version 1.2

* Add rule to filter `'` and `"` in Title

#### Version 1.1

* Add clean rule of title
* Recursively remove ignore words in title

#### Version 1.0

* the initial version
