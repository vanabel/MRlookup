// ==UserScript==
// @name              MRLookup
// @namespace         vanabeljs
// @description       Extract BibTeX data automatically and modify BibTeX Key to AUTHOR_YEAR_TITLE.
// @description:ZH-CN 自动提取BibTeX数据并修改BibTeX关键字为AUTHOR_YEAR_TITLE的形式.
// @copyright         2018, Van Abel (https://home.vanabel.cn)
// @license           OSI-SPDX-Short-Identifier
// @version           1.5.4
// @include           */mathscinet/search/publications.html?fmt=bibtex*
// @include           */mathscinet/clipboard.html
// @include           */mrlookup
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
	regexp += ')\\s+';
	return regexp;
}//console.log(IgnoreStringToRegExp(IgnoreStringInTitle));
/*split bibdata*/

function parseBibTexLine(text) {
	try {
		var m = text.match(/^\s*(\S+)\s*=\s*/);
		if (!m) {
			console.error('Invalid line format:', text);
			return null;
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
	} catch (error) {
		console.error('Error parsing BibTeX line:', error);
		return null;
	}
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

function cleanAuthorName(author) {
	if (!author) return '';
	
	// 分割多个作者
	let authors = author.split(/\s*and\s*/);
	// 获取所有作者的姓
	let lastNames = authors.map(author => {
		// 提取姓（通常是逗号前的部分）
		let lastName = author.split(',')[0];
		// 清理特殊字符
		return lastName.replace(/[{}\\\s\'"`]/g, '');
	});
	// 拼接所有作者的姓
	return lastNames.join('');
}

function cleanTitle(title) {
	if (!title) return '';
	
	// 移除LaTeX命令和数学符号
	title = title.replace(/\\[a-zA-Z]+/g, '')          // 移除LaTeX命令
		  .replace(/\$[^$]*\$/g, '')                   // 移除数学公式
		  .replace(/[{}\\\'"`]/g, '')                  // 移除特殊字符
		  .replace(/\{[^}]*\}/g, '');                  // 移除花括号内容
	
	// 按空格、连字符和标点符号分割成单词
	let words = title.split(/[\s\-,.:;]+/)
		.filter(word => word.length > 0)               // 移除空字符串
		.map(word => word.replace(/[^a-zA-Z]/g, '')); // 只保留字母
	
	// 找到第一个有意义的单词
	for (let word of words) {
		// 转换为小写进行比较
		let lowercaseWord = word.toLowerCase();
		// 检查是否是忽略词或单个字母
		if (!IgnoreStringInTitle.includes(lowercaseWord) && 
			word.length > 1 && 
			!/^\d+$/.test(word)) {  // 排除纯数字
			// 转换为首字母大写
			return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
		}
	}
	
	// 如果没有找到合适的单词，返回空字符串
	return '';
}

var els = document.getElementsByTagName('pre');
for (var i = 0; i < els.length; i++) {
	try {
		var el = els[i];
		var bibdata = parseBibTex(el.innerHTML);
		if (!bibdata) continue;

		// 提取作者
		var author = cleanAuthorName(bibdata.AUTHOR);
		
		// 提取年份 - 简化版本
		var year = '';
		if (bibdata.YEAR) {
			// 匹配第一个四位数字
			let yearMatch = bibdata.YEAR.match(/\d{4}/);
			if (yearMatch) {
				year = yearMatch[0];
			}
		}
		
		// 提取标题
		var title = cleanTitle(bibdata.TITLE);
		
		// 组合BibTeX键
		var bibkey = author + year + title;
		
		// 替换原有的MR号
		el.innerHTML = el.innerHTML.replace(/MR\d+/g, bibkey);
		
		// 添加点击复制功能
		el.addEventListener('click', function() {
			try {
				var bibdata_lb = this.innerHTML
					.replace(/\r|\n/g, '\r\n')
					.replace(/^\r\n/g, '')
					.replace(/\s*$/g, '\r\n')
					.replace(/\r\n\r\n/g, '\r\n');
				GM_setClipboard(bibdata_lb);
			} catch (error) {
				console.error('Error copying to clipboard:', error);
			}
		});
	} catch (error) {
		console.error('Error processing BibTeX entry:', error);
	}
}

/**
 * auto set bibtex item checked for mrlookup site
 */
var url = location.pathname;
if (url.includes('mrlookup')) {
	document.getElementsByName('format')[1].checked = true;
}
