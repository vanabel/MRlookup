// ==UserScript==
// @namespace         vanabeljs
// @name              MRLookup
// @description       Extract BibTeX data automatically and modify BibTeX Key to AUTHOR_YEAR_TITLE.
// @description:ZH-CN 自动提取BibTeX数据并修改BibTeX关键字为AUTHOR_YEAR_TITLE的形式.
// @copyright         2017, Van Abel (https://home.vanabel.cn)
// @license           OSI-SPDX-Short-Identifier
// @version           1.5.1
// @include           http://www.ams.org/mrlookup
// @include           https://mathscinet.ams.org/mrlookup
// @include           http://www.ams.org/mathscinet/search/publications.html?fmt=bibtex*
// @include           https://mathscinet.ams.org/mathscinet/search/publications.html?fmt=bibtex*
// @grant             GM_setClipboard
// ==/UserScript==

// ==OpenUserJS==
// @author Van Abel
// ==/OpenUserJS==

/**
  *
  * Please begin typing or paste your Userscript now.
  *
  */

/*The first word to ignore in title*/
var IgnoreStringInTitle = [
  'a',
  'an',
  'on',
  'the',
  'another'
];
function IgnoreStringToRegExp(arr) {
  var regexp = '^(';
  var arrlen = arr.length;
  for (var i = 0; i < arrlen; i++) {
    if (i == arrlen - 1) {
      regexp += '(' + arr[i] + ')';
    } else {
      regexp += '(' + arr[i] + ')|';
    }
  }
  regexp += ')\\s*';
  return regexp;
}//console.log(IgnoreStringToRegExp(IgnoreStringInTitle));
/*split bibdata*/

function parseBibTexLine(text) {
  var m = text.match(/^\s*(\S+)\s*=\s*/);
  if (!m) {
    console.log('line: "' + text + '"');
    throw new Error('Unrecogonised line format');
  }
  var name = m[1];
  var search = text.slice(m[0].length);
  var re = /[\n\r,{}]/g;
  var braceCount = 0;
  var length = m[0].length;
  do {
    m = re.exec(search);
    if (m[0] === '{') {
      braceCount++;
    } else if (m[0] === '}') {
      if (braceCount === 0) {
        throw new Error('Unexpected closing brace: "}"');
      }
      braceCount--;
    }
  } while (braceCount > 0);
  return {
    field: name,
    value: search.slice(0, re.lastIndex),
    length: length + re.lastIndex + m[0].length
  };
}
function parseBibTex(text) {
  var m = text.match(/^\s*@([^{]+){([^,\n]+)[,\n]/);
  if (!m) {
    throw new Error('Unrecogonised header format');
  }
  var result = {
    typeName: m[1].trim(),
    citationKey: m[2].trim()
  };
  text = text.slice(m[0].length).trim();
  while (text[0] !== '}') {
    var pair = parseBibTexLine(text);
    result[pair.field] = pair.value;
    text = text.slice(pair.length).trim();
  }
  return result;
}
var els = document.getElementsByTagName('pre');
for (var i = 0, l = els.length; i < l; i++) {
  var el = els[i];
  var bibdata = parseBibTex(el.innerHTML);
  /*Extract author*/
  //var aureg = new RegExp('(?:(\\w+),(?:[^,}](?!and))+)+', 'g');
  //console.log(audata.match(aureg));
  var audata = bibdata.AUTHOR;
  //clean author include \v+space and $\cmd$
  audata = audata.replace(/\\[a-z]\s|(\$.*?\$)|(\\")/gi, '');
  //console.log(audata);
  //remove doublw , in one name
  audata = audata.replace(/(?:(?:and)?(\w+,\s*\w+\.)(,.*?)?)+/g, '$1');
  //console.log(audata);
  //extract first name
  audata = audata.replace(/(?:(\w+),(?:[^,}](?!and))+)+/g, '$1');
  //console.log(audata);
  var cleanreg = new RegExp('\\s*and\\s*|[{}\\\\\'\\\\\\"]', 'g');
  //console.log(cleanreg);
  var au = audata.replace(cleanreg, '');
  //console.log(au);
  /*Extract Year*/
  var year = bibdata.YEAR.replace(cleanreg, '');
  //console.log(year);
  /*Extract Title*/
  var title = bibdata.TITLE;
  //clean \cmd+space
  title = title.replace(/\\\w+\s*/g, '');
  var titleclean = new RegExp(IgnoreStringToRegExp(IgnoreStringInTitle), 'gi');
  //we don't need to clean and, but we need to clean -,{,},: and ,
  //var cleanreg = new RegExp('[{}:-]|,|(\\r\\s*)|(\\n\\s*)', 'g');
  title = title.replace(/[\\\'\"{}:-]|,|(\r\s*)|(\n\s*)/g, '');
  //var cleandollar = new RegExp('\\$.*?\\$', 'g');
  title = title.replace(/\$.*?\$/g, '');
  var titlefinal = title.replace(titleclean, '');
  while (title != titlefinal) {
    //recursively remove the ignore word
    title = titlefinal;
    titlefinal = title.replace(titleclean, '');
  } //var titlereg = new RegExp('(\\w+)(\\s*\\w+)*', 'gi');

  title = title.replace(/(\w+).*$/gi, '$1').replace(/\s*/g, '');
  var bibkey = au + year + title;
  //console.log(bibkey);
  var bibkeyreg = new RegExp('MR\\d+', 'gi');
  el.innerHTML = el.innerHTML.replace(bibkeyreg, bibkey);
  /*click to copy to clipboard*/
  el.addEventListener('click', function () {
    //Actual new line break
    //var linebreakreg = new RegExp('\\r|\\n', 'g');
    var bibdata_lb = this.innerHTML.replace(/\r|\n/g, '\r\n').replace(/^\r\n/g, '').replace(/\s*$/g, '\r\n').replace(/\r\n\r\n/g, '\r\n');
    GM_setClipboard(bibdata_lb);
  });
}
