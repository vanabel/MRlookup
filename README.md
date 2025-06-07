# MRLookup
Extract BibTeX data automatically and modify BibTeX Key to AUTHOR_YEAR_TITLE/JOURNAL

### Introduction
This script will acts on [mrlookup](http://www.ams.org/mrlookup) and [mathscinet](http://www.ams.org/mathscinet), which will change the bibtex key to AuthorsNames+Year+JournalAbbrev/FirstWordofTitle. With the following features:

* Toggle between journal abbreviation and title word mode
* Smart journal abbreviation:
  - For single word journals: use first three letters (e.g., "Topology" -> "TOP")
  - For multi-word journals: use capital letters (e.g., "Journal of Differential Geometry" -> "JDG")
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
* Visual indicator showing current mode (Journal/Title)

### How to install?

Just follow the guide at [Greasy Fork](https://greasyfork.org/zh-CN)

### How to feedback?
If you have any suggestion, you can contact me at van141.abel(at)gmail.com. Also, you can initial an [issue](https://github.com/vanabel/mrlookup/issues)

### Update Log
#### Version 3.0.0

* Version bump to 3.0.0.
* Improved BibTeX parsing: now handles missing matches and converts field names to lowercase for consistency.
* Added debug mode with test data support.
* Added a Standardize BibTeX button for manual standardization.
* Added a debug toggle button to enable/disable debug mode.
* Added a test data button to fill the dialog with test data when debug mode is on.
* Added a debug result display to show standardized BibTeX in a popup instead of copying to clipboard when in debug mode.
* Fixed the mode indicator overlap issue: only one indicator is shown at a time, even after toggling modes.

#### Version 2.0.1

* Fixed compound surname handling to correctly extract the last part of compound surnames
* Improved author name extraction for cases like "Mundet i Riera" to use "Riera" instead of "Mundet"

#### Version 2.0.0

* Added journal abbreviation mode as an alternative to title mode
* Implemented smart journal abbreviation system
* Added user interface for mode switching
* Added visual mode indicator
* Improved author name handling to include all authors
* Enhanced error handling and logging

#### Version 1.5.5

* Improved author name handling to include all authors' last names
* Enhanced title word processing with better capitalization
* Improved year extraction to handle complex formats
* Added better error handling and logging
* Fixed URL checking logic

#### Version 1.5.4

* Fix data clean in author field

#### Version 1.5.3

* Modify the rule for active url
* Add automatical select bibtex item for site with mrlookup in url

#### Version 1.5.2

* Fix the first word ignore rule, change `\s*` to `\s+`

#### Version 1.5.1

* Add `https://mathscinet.ams.org/mathscinet/search/publications.html?fmt=bibtex*`

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
