// ==UserScript==
// @name              MRLookup
// @namespace         vanabeljs
// @description       Extract BibTeX data automatically and modify BibTeX Key to AUTHOR_YEAR_TITLE.
// @description:ZH-CN 自动提取BibTeX数据并修改BibTeX关键字为AUTHOR_YEAR_TITLE的形式.
// @copyright         2018, Van Abel (https://home.vanabel.cn)
// @license           OSI-SPDX-Short-Identifier
// @version           3.0.0
// @include           */mathscinet/search/publications.html?fmt=bibtex*
// @include           */mathscinet/clipboard.html
// @include           */mrlookup
// @grant            GM_setValue
// @grant            GM_getValue
// @grant            GM_registerMenuCommand
// @grant            GM_setClipboard
// @downloadURL      https://greasyfork.org/scripts/35116-mrlookup/code/MRLookup.user.js
// @updateURL        https://greasyfork.org/scripts/35116-mrlookup/code/MRLookup.meta.js
// ==/UserScript==

// ==OpenUserJS==
// @author Van Abel
// ==/OpenUserJS==

/**
 * Webhook test: Testing automatic sync to Greasy Fork
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
			if (!m) break;
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
			length: length + re.lastIndex + (m ? m[0].length : 0)
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
		if (!pair) break;
		// Convert field name to lowercase for consistency
		result[pair.field.toLowerCase()] = pair.value;
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
		// 对于复合姓氏，取最后一部分
		let nameParts = lastName.split(/\s+/);
		let finalLastName = nameParts[nameParts.length - 1];
		// 清理特殊字符
		return finalLastName.replace(/[{}\\\s\'"`]/g, '');
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

// Configuration
const CONFIG = {
	useJournal: GM_getValue('useJournal', true),  // Default use journal abbreviation
	debug: GM_getValue('debug', false)  // Debug mode
};

// Test data for debug mode
const DEFAULT_TEST_DATA = `@misc{chen2014l2modulispacessymplecticvortices,
      title={$L^2$-moduli spaces of symplectic vortices on Riemann surfaces with cylindrical ends}, 
      author={Bohui Chen and Bai-Ling Wang},
      year={2014},
      eprint={1405.6387},
      archivePrefix={arXiv},
      primaryClass={math.SG},
      url={https://arxiv.org/abs/1405.6387}, 
}`;

// Get stored test data or use default
let TEST_DATA = GM_getValue('testData', DEFAULT_TEST_DATA);

// Function to update test data
function updateTestData(newData) {
	TEST_DATA = newData;
	GM_setValue('testData', newData);
}

// 注册菜单命令
GM_registerMenuCommand('Toggle Journal/Title Mode', function() {
	const currentMode = GM_getValue('useJournal', true);
	const newMode = !currentMode;
	GM_setValue('useJournal', newMode);
	CONFIG.useJournal = newMode;
	
	// 显示当前模式
	const modeText = newMode ? 'Journal Mode' : 'Title Mode';
	alert('Switched to ' + modeText);
	
	// 刷新页面以应用新设置
	location.reload();
});

// Add status indicator
function addStatusIndicator() {
	// Remove existing indicator if any
	const existingIndicator = document.getElementById('mode-indicator');
	if (existingIndicator) {
		existingIndicator.remove();
	}

	const indicator = document.createElement('div');
	indicator.id = 'mode-indicator';
	indicator.style.cssText = `
		position: fixed;
		top: 10px;
		right: 10px;
		padding: 5px 10px;
		background: #f0f0f0;
		border: 1px solid #ccc;
		border-radius: 3px;
		font-size: 12px;
		z-index: 9999;
		cursor: pointer;
		user-select: none;
		margin-bottom: 5px;
	`;
	indicator.textContent = CONFIG.useJournal ? 'Mode: Journal' : 'Mode: Title';
	
	// Add click handler to toggle mode
	indicator.addEventListener('click', function() {
		const currentMode = GM_getValue('useJournal', true);
		const newMode = !currentMode;
		GM_setValue('useJournal', newMode);
		CONFIG.useJournal = newMode;
		
		// Update indicator text
		this.textContent = newMode ? 'Mode: Journal' : 'Mode: Title';
		
		// Update all BibTeX entries in place
		updateBibTeXEntries();
	});
	
	document.body.appendChild(indicator);
}

// Function to update all BibTeX entries
function updateBibTeXEntries() {
	const els = document.getElementsByTagName('pre');
	for (let i = 0; i < els.length; i++) {
		try {
			const el = els[i];
			const bibdata = parseBibTex(el.innerHTML);
			if (!bibdata) continue;

			// Extract author
			const author = cleanAuthorName(bibdata.AUTHOR);
			
			// Extract year
			let year = '';
			if (bibdata.YEAR) {
				let yearMatch = bibdata.YEAR.match(/\d{4}/);
				if (yearMatch) {
					year = yearMatch[0];
				}
			}
			
			// Get identifier based on current mode
			let identifier = '';
			if (CONFIG.useJournal && bibdata.JOURNAL) {
				identifier = getJournalAbbrev(bibdata.JOURNAL);
				if (!identifier) {
					identifier = cleanTitle(bibdata.TITLE);
				}
			} else {
				identifier = cleanTitle(bibdata.TITLE);
			}
			
			// Create new BibTeX key
			const bibkey = author + year + identifier;
			
			// Get all field names from the input, preserving their original case
			const fieldNames = Object.keys(bibdata).filter(key => 
				key !== 'typeName' && key !== 'citationKey'
			).map(key => key.toUpperCase());

			// Find the longest field name for alignment
			const maxLength = Math.max(...fieldNames.map(name => name.length));

			// Function to format a field with proper alignment
			const formatField = (name, value) => {
				const padding = ' '.repeat(maxLength - name.length);
				return `    ${name}${padding} = {${value}},\n`;
			};

			// Standardize the format
			let standardized = '@misc {' + bibkey + ',\n';
			
			// Add all fields from the input
			for (const field of fieldNames) {
				const value = cleanValue(bibdata[field.toLowerCase()]);
				if (value) {
					standardized += formatField(field, value);
				}
			}

			// Remove trailing comma and add closing brace
			standardized = standardized.replace(/,\n$/, '\n}');

			// Update both the citation key and MR number
			el.innerHTML = el.innerHTML
				.replace(/@\w+\s*{\s*[^,]+/, `@${bibdata.typeName} {${standardized}`)
				.replace(/MR\d+/g, bibkey);
		} catch (error) {
			console.error('Error updating BibTeX entry:', error);
		}
	}
}

// 在页面加载完成后添加状态指示器
window.addEventListener('load', addStatusIndicator);

// 添加新的期刊处理函数
function getJournalAbbrev(journal) {
	if (!journal) return '';
	
	// 移除LaTeX命令和特殊字符
	journal = journal.replace(/\\[a-zA-Z]+/g, '')     // 移除LaTeX命令
		   .replace(/[{}\\\'"`]/g, '')                // 移除特殊字符
		   .replace(/\([^)]*\)/g, '')                 // 移除括号内容
		   .replace(/\{[^}]*\}/g, '')                 // 移除花括号内容
		   .trim();
	
	// 分割成单词
	let words = journal.split(/[\s.]+/).filter(word => word.length > 0);
	
	if (words.length === 1) {
		// 如果只有一个单词，取前三个字母并转为大写
		return words[0].slice(0, 3).toUpperCase();
	} else {
		// 多个单词时提取大写字母
		let abbrev = journal.match(/[A-Z]/g);
		return abbrev ? abbrev.join('') : '';
	}
}

var els = document.getElementsByTagName('pre');
for (var i = 0; i < els.length; i++) {
	try {
		var el = els[i];
		var bibdata = parseBibTex(el.innerHTML);
		if (!bibdata) continue;

		// 提取作者
		var author = cleanAuthorName(bibdata.AUTHOR);
		
		// 提取年份
		var year = '';
		if (bibdata.YEAR) {
			let yearMatch = bibdata.YEAR.match(/\d{4}/);
			if (yearMatch) {
				year = yearMatch[0];
			}
		}
		
		// 根据配置选择使用期刊缩写还是标题
		var identifier = '';
		if (CONFIG.useJournal && bibdata.JOURNAL) {
			identifier = getJournalAbbrev(bibdata.JOURNAL);
			// 如果没有获取到期刊缩写，回退到使用标题
			if (!identifier) {
				identifier = cleanTitle(bibdata.TITLE);
			}
		} else {
			identifier = cleanTitle(bibdata.TITLE);
		}
		
		// 组合BibTeX键
		var bibkey = author + year + identifier;
		
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

// Add button to standardize BibTeX
function addStandardizeButton() {
	const button = document.createElement('button');
	button.textContent = 'Standardize BibTeX';
	button.style.cssText = `
		position: fixed;
		top: 45px;
		right: 10px;
		padding: 5px 10px;
		background: #4CAF50;
		color: white;
		border: none;
		border-radius: 3px;
		cursor: pointer;
		z-index: 9999;
		margin-bottom: 5px;
	`;
	button.addEventListener('click', standardizeBibTeX);
	document.body.appendChild(button);
}

// Add test data button when debug is on
function addTestDataButton() {
	// Remove existing test button if any
	const existingBtn = document.getElementById('test-data-btn');
	if (existingBtn) {
		existingBtn.remove();
	}
	
	// Only add button if debug mode is on
	if (!CONFIG.debug) return;
	
	const testBtn = document.createElement('button');
	testBtn.id = 'test-data-btn';
	testBtn.textContent = 'Test Data';
	testBtn.style.cssText = `
		position: fixed;
		top: 115px;
		right: 10px;
		padding: 5px 10px;
		background: #4CAF50;
		color: white;
		border: none;
		border-radius: 3px;
		cursor: pointer;
		z-index: 9999;
		margin-bottom: 5px;
	`;
	testBtn.addEventListener('click', () => {
		// First open the dialog
		standardizeBibTeX();
		// Then fill it with test data
		setTimeout(() => {
			const textarea = document.querySelector('textarea');
			if (textarea) {
				textarea.value = TEST_DATA;
			}
		}, 100); // Small delay to ensure dialog is created
	});
	document.body.appendChild(testBtn);
}

// Add debug mode toggle
function addDebugToggle() {
	const debugBtn = document.createElement('button');
	debugBtn.textContent = CONFIG.debug ? 'Debug: ON' : 'Debug: OFF';
	debugBtn.style.cssText = `
		position: fixed;
		top: 80px;
		right: 10px;
		padding: 5px 10px;
		background: ${CONFIG.debug ? '#ff4444' : '#f0f0f0'};
		color: ${CONFIG.debug ? 'white' : 'black'};
		border: 1px solid #ccc;
		border-radius: 3px;
		cursor: pointer;
		z-index: 9999;
		margin-bottom: 5px;
	`;
	debugBtn.addEventListener('click', function() {
		CONFIG.debug = !CONFIG.debug;
		GM_setValue('debug', CONFIG.debug);
		this.textContent = CONFIG.debug ? 'Debug: ON' : 'Debug: OFF';
		this.style.background = CONFIG.debug ? '#ff4444' : '#f0f0f0';
		this.style.color = CONFIG.debug ? 'white' : 'black';
		// Update test data button visibility
		addTestDataButton();
	});
	document.body.appendChild(debugBtn);
}

// Show debug result
function showDebugResult(result) {
	if (!CONFIG.debug) return;
	
	// Remove existing debug result if any
	const existingResult = document.getElementById('debug-result');
	if (existingResult) {
		existingResult.remove();
	}
	
	// Create overlay
	const overlay = document.createElement('div');
	overlay.style.cssText = `
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0,0,0,0.5);
		z-index: 10000;
	`;
	
	const resultDiv = document.createElement('div');
	resultDiv.id = 'debug-result';
	resultDiv.style.cssText = `
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: white;
		padding: 20px;
		border-radius: 5px;
		box-shadow: 0 2px 10px rgba(0,0,0,0.2);
		z-index: 10001;
		width: 80%;
		max-width: 800px;
		max-height: 80vh;
		overflow: auto;
	`;
	
	const pre = document.createElement('pre');
	pre.style.cssText = `
		white-space: pre-wrap;
		word-wrap: break-word;
		font-family: monospace;
		font-size: 14px;
		margin: 0;
		padding: 10px;
		background: #f8f8f8;
		border-radius: 3px;
	`;
	pre.textContent = result;
	
	const closeBtn = document.createElement('button');
	closeBtn.textContent = 'Close';
	closeBtn.style.cssText = `
		position: absolute;
		top: 10px;
		right: 10px;
		padding: 5px 15px;
		background: #f0f0f0;
		border: 1px solid #ccc;
		border-radius: 3px;
		cursor: pointer;
	`;
	closeBtn.onclick = () => {
		document.body.removeChild(overlay);
	};
	
	// Close when clicking outside
	overlay.addEventListener('click', (event) => {
		if (event.target === overlay) {
			document.body.removeChild(overlay);
		}
	});
	
	resultDiv.appendChild(closeBtn);
	resultDiv.appendChild(pre);
	overlay.appendChild(resultDiv);
	document.body.appendChild(overlay);
}

// Modify standardizeBibTeX to handle debug mode
function standardizeBibTeX() {
	// Create dialog container
	const dialog = document.createElement('div');
	dialog.style.cssText = `		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: white;
		padding: 20px;
		border-radius: 5px;
		box-shadow: 0 2px 10px rgba(0,0,0,0.2);
		z-index: 10000;
		width: 80%;
		max-width: 800px;
	`;

	// Create textarea
	const textarea = document.createElement('textarea');
	textarea.style.cssText = `
		width: 100%;
		height: 200px;
		margin: 10px 0;
		padding: 10px;
		border: 1px solid #ccc;
		border-radius: 3px;
		font-family: monospace;
		font-size: 14px;
		resize: vertical;
	`;
	textarea.placeholder = 'Paste your BibTeX entry here...';

	// Create buttons container
	const buttons = document.createElement('div');
	buttons.style.cssText = `
		text-align: right;
		margin-top: 10px;
	`;

	// Create cancel button
	const cancelBtn = document.createElement('button');
	cancelBtn.textContent = 'Cancel';
	cancelBtn.style.cssText = `
		padding: 5px 15px;
		margin-right: 10px;
		background: #f0f0f0;
		border: 1px solid #ccc;
		border-radius: 3px;
		cursor: pointer;
	`;

	// Create submit button
	const submitBtn = document.createElement('button');
	submitBtn.textContent = 'Standardize';
	submitBtn.style.cssText = `
		padding: 5px 15px;
		background: #4CAF50;
		color: white;
		border: none;
		border-radius: 3px;
		cursor: pointer;
	`;

	// Create overlay
	const overlay = document.createElement('div');
	overlay.style.cssText = `
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0,0,0,0.5);
		z-index: 9999;
	`;

	// Add event listeners
	cancelBtn.onclick = () => {
		document.body.removeChild(overlay);
	};

	// Close dialog when clicking outside
	overlay.addEventListener('click', (event) => {
		// Only close if clicking directly on the overlay, not its children
		if (event.target === overlay) {
			document.body.removeChild(overlay);
		}
	});

	submitBtn.onclick = () => {
		const input = textarea.value.trim();
		if (!input) {
			alert('Please enter a BibTeX entry');
			return;
		}

		try {
			// Store the input as test data if in debug mode
			if (CONFIG.debug) {
				updateTestData(input);
			}

			// Parse the input BibTeX
			const bibdata = parseBibTex(input);
			if (!bibdata) {
				alert('Invalid BibTeX format');
				return;
			}

			// Clean up the data by removing extra braces and preserving math
			const cleanValue = (value) => {
				if (!value) return '';
				// Remove only the outermost braces if they exist
				// This preserves all LaTeX commands and math formulas
				return value.replace(/^{|}$/g, '');
			};

			// Extract author
			const author = cleanAuthorName(cleanValue(bibdata.author));
			
			// Extract year
			let year = '';
			if (bibdata.year) {
				let yearMatch = cleanValue(bibdata.year).match(/\d{4}/);
				if (yearMatch) {
					year = yearMatch[0];
				}
			}
			
			// Get identifier based on current mode
			let identifier = '';
			if (CONFIG.useJournal && bibdata.journal) {
				identifier = getJournalAbbrev(cleanValue(bibdata.journal));
				if (!identifier) {
					identifier = cleanTitle(cleanValue(bibdata.title));
				}
			} else {
				identifier = cleanTitle(cleanValue(bibdata.title));
			}
			
			// Create new BibTeX key
			const bibkey = author + year + identifier;

			// Get all field names from the input, preserving their original case
			const fieldNames = Object.keys(bibdata).filter(key => 
				key !== 'typeName' && key !== 'citationKey'
			).map(key => key.toUpperCase());

			// Find the longest field name for alignment
			const maxLength = Math.max(...fieldNames.map(name => name.length));

			// Function to format a field with proper alignment
			const formatField = (name, value) => {
				const padding = ' '.repeat(maxLength - name.length);
				return `    ${name}${padding} = {${value}},\n`;
			};

			// Standardize the format
			let standardized = '@misc {' + bibkey + ',\n';
			
			// Add all fields from the input
			for (const field of fieldNames) {
				const value = cleanValue(bibdata[field.toLowerCase()]);
				if (value) {
					standardized += formatField(field, value);
				}
			}

			// Remove trailing comma and add closing brace
			standardized = standardized.replace(/,\n$/, '\n}');

			if (CONFIG.debug) {
				// Show debug result
				showDebugResult(standardized);
			} else {
				// Copy to clipboard
				GM_setClipboard(standardized);
				alert('Standardized BibTeX has been copied to clipboard!');
			}
			document.body.removeChild(overlay);
		} catch (error) {
			console.error('Error standardizing BibTeX:', error);
			alert('Error standardizing BibTeX. Please check the console for details.');
		}
	};

	// Assemble dialog
	buttons.appendChild(cancelBtn);
	buttons.appendChild(submitBtn);
	dialog.appendChild(textarea);
	dialog.appendChild(buttons);
	overlay.appendChild(dialog);
	document.body.appendChild(overlay);

	// Focus textarea
	textarea.focus();
}

// Add the buttons when the page loads
window.addEventListener('load', function() {
	addStandardizeButton();
	addStatusIndicator();
	addDebugToggle();
	addTestDataButton();
});

