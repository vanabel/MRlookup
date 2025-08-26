// 测试MRlookup在新AMS MathSciNet网站上的功能
// 这个脚本模拟MRlookup的核心功能，用于测试新网站支持

// 配置
const CONFIG = {
    useJournal: true,  // 默认使用期刊缩写
    debug: true        // 启用调试模式
};

// 测试数据
const TEST_BIBTEX = `@article{MR1925341,
    AUTHOR = {Smith, John and Johnson, Mary},
    TITLE = {On the properties of mathematical structures},
    JOURNAL = {Journal of Mathematics},
    VOLUME = {45},
    YEAR = {2008},
    NUMBER = {3},
    PAGES = {123--145},
    ISSN = {1234-5678},
    DOI = {10.1234/jm.2008.45.123},
    MRCLASS = {Primary 11G05; Secondary 14G25},
    MRNUMBER = {1925341}
}`;

// 忽略的标题词汇
const IgnoreStringInTitle = ['a', 'an', 'on', 'the', 'another'];

// 清理作者姓名
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

// 清理标题
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

// 获取期刊缩写
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

// 解析BibTeX
function parseBibTex(text) {
    try {
        const m = text.match(/^\s*@([^{]+){([^,\n]+)[,\n]/);
        if (!m) {
            throw new Error('Unrecognised header format');
        }
        
        const result = {
            typeName: m[1].trim(),
            citationKey: m[2].trim()
        };
        
        text = text.slice(m[0].length).trim();
        
        // 简单的字段解析（简化版本）
        const fieldRegex = /(\w+)\s*=\s*\{([^}]*)\}/g;
        let match;
        
        while ((match = fieldRegex.exec(text)) !== null) {
            result[match[1].toLowerCase()] = match[2];
        }
        
        return result;
    } catch (error) {
        console.error('解析BibTeX时出错:', error);
        return null;
    }
}

// 生成标准化的BibTeX
function generateStandardizedBibTeX(bibdata) {
    if (!bibdata) return null;
    
    // 提取作者
    const author = cleanAuthorName(bibdata.author);
    
    // 提取年份
    let year = '';
    if (bibdata.year) {
        let yearMatch = bibdata.year.match(/\d{4}/);
        if (yearMatch) {
            year = yearMatch[0];
        }
    }
    
    // 获取标识符
    let identifier = '';
    if (CONFIG.useJournal && bibdata.journal) {
        identifier = getJournalAbbrev(bibdata.journal);
        if (!identifier) {
            identifier = cleanTitle(bibdata.title);
        }
    } else {
        identifier = cleanTitle(bibdata.title);
    }
    
    // 创建新的引用键
    const bibkey = author + year + identifier;
    
    // 清理值
    const cleanValue = (value) => {
        if (!value) return '';
        return value.replace(/^{|}$/g, '');
    };
    
    // 获取所有字段名
    const fieldNames = Object.keys(bibdata).filter(key => 
        key !== 'typeName' && key !== 'citationKey'
    ).map(key => key.toUpperCase());
    
    // 找到最长的字段名用于对齐
    const maxLength = Math.max(...fieldNames.map(name => name.length));
    
    // 格式化字段
    const formatField = (name, value) => {
        const padding = ' '.repeat(maxLength - name.length);
        const cleanedValue = cleanValue(value);
        return `    ${name}${padding} = {${cleanedValue}},\n`;
    };
    
    // 标准化格式
    let standardized = `@${bibdata.typeName} {${bibkey},\n`;
    
    // 添加所有字段
    for (const field of fieldNames) {
        const value = bibdata[field.toLowerCase()];
        if (value) {
            standardized += formatField(field, value);
        }
    }
    
    // 移除尾随逗号并添加闭合括号
    standardized = standardized.replace(/,\n$/, '\n}');
    
    return standardized;
}

// 增强引用格式弹窗
function enhanceCitationModal(modal) {
	if (modal.hasAttribute('data-enhanced')) return;
	modal.setAttribute('data-enhanced', 'true');
	
	console.log('增强引用格式弹窗:', modal);
	
	// 查找引用文本区域
	const citationTextarea = modal.querySelector('#citationText');
	if (!citationTextarea) {
		console.log('未找到引用文本区域');
		return;
	}
	
	// 监听引用格式变化（自动标准化）
	observeCitationFormatChange(modal);
	
	// 监听文本区域内容变化（实时标准化）
	observeTextareaContentChange(modal, citationTextarea);
	
	console.log('弹窗已增强，自动标准化模式已启用');
}

// 在引用格式弹窗中添加标准化按钮（已移除，改为自动标准化）
function addStandardizeButtonToModal(modal, textarea) {
	// 此函数已不再使用，保留以避免引用错误
	console.log('自动标准化模式已启用，无需手动按钮');
}

// 监听引用格式变化
function observeCitationFormatChange(modal) {
	const formatSelect = modal.querySelector('select[name="Select citation format"]');
	if (formatSelect) {
		formatSelect.addEventListener('change', function() {
			console.log('引用格式已改变:', this.value);
			
			// 当格式改变时，等待内容加载完成
			setTimeout(function() {
				const textarea = modal.querySelector('#citationText');
				if (textarea && textarea.value.trim()) {
					// 如果选择了BibTeX格式，自动标准化
					if (this.value === 'bibtex') {
						setTimeout(function() {
							try {
								const bibdata = parseBibTex(textarea.value.trim());
								if (bibdata) {
									const newBibtex = generateStandardizedBibTeX(bibdata);
									if (newBibtex && newBibtex !== textarea.value.trim()) {
										textarea.value = newBibtex;
										console.log('自动标准化完成');
										// 显示成功消息
										showSuccessMessage(modal, 'BibTeX已自动标准化！');
									}
								}
							} catch (error) {
								console.error('自动标准化BibTeX时出错:', error);
							}
						}, 500); // 等待内容加载
					}
				}
			}, 100);
		});
	}
}

// 监听文本区域内容变化，实现实时标准化
function observeTextareaContentChange(modal, textarea) {
	console.log('开始监听文本区域内容变化...');
	
	// 使用MutationObserver监听内容变化
	const observer = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			if (mutation.type === 'childList' || mutation.type === 'characterData') {
				// 检查是否包含有效的BibTeX内容
				const content = textarea.value.trim();
				if (content && content.startsWith('@') && content.includes('{') && content.includes('}')) {
					// 延迟执行，避免频繁触发
					setTimeout(function() {
						autoStandardizeIfNeeded(modal, textarea, content);
					}, 300);
				}
			}
		});
	});
	
	// 监听文本区域的变化
	observer.observe(textarea, {
		childList: true,
		characterData: true,
		subtree: true
	});
	
	// 也监听input事件（用户输入）
	textarea.addEventListener('input', function() {
		const content = this.value.trim();
		if (content && content.startsWith('@') && content.includes('{') && content.includes('}')) {
			// 延迟执行，避免频繁触发
			setTimeout(function() {
				autoStandardizeIfNeeded(modal, textarea, content);
			}, 500);
		}
	});
	
	console.log('文本区域内容变化监听已设置');
}

// 自动标准化检查
function autoStandardizeIfNeeded(modal, textarea, content) {
	try {
		console.log('检查是否需要自动标准化...');
		
		// 检查是否已经是标准化格式
		const bibdata = parseBibTex(content);
		if (bibdata && bibdata.author && bibdata.year) {
			// 检查引用键是否已经是标准格式
			const expectedKey = generateExpectedKey(bibdata);
			if (bibdata.citationKey !== expectedKey) {
				console.log('检测到非标准引用键，开始标准化...');
				// 需要标准化
				const newBibtex = generateStandardizedBibTeX(bibdata);
				if (newBibtex && newBibtex !== content) {
					textarea.value = newBibtex;
					console.log('自动标准化完成');
					// 显示成功消息
					showSuccessMessage(modal, 'BibTeX已自动标准化！');
				}
			} else {
				console.log('引用键已经是标准格式，无需标准化');
			}
		}
	} catch (error) {
		console.error('自动标准化检查时出错:', error);
	}
}

// 生成期望的引用键（用于检查是否需要标准化）
function generateExpectedKey(bibdata) {
	// 提取作者
	const author = cleanAuthorName(bibdata.author);
	
	// 提取年份
	let year = '';
	if (bibdata.year) {
		let yearMatch = bibdata.year.match(/\d{4}/);
		if (yearMatch) {
			year = yearMatch[0];
		}
	}
	
	// 获取标识符
	let identifier = '';
	if (CONFIG.useJournal && bibdata.journal) {
		identifier = getJournalAbbrev(bibdata.journal);
		if (!identifier) {
			identifier = cleanTitle(bibdata.title);
		}
	} else {
		identifier = cleanTitle(bibdata.title);
	}
	
	// 创建期望的引用键
	return author + year + identifier;
}

// 显示成功消息
function showSuccessMessage(modal, message) {
    showMessage(modal, message, 'success');
}

// 显示错误消息
function showErrorMessage(modal, message) {
    showMessage(modal, message, 'error');
}

// 显示消息
function showMessage(modal, message, type) {
    // 移除现有消息
    const existingMessage = modal.querySelector('.mrlookup-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // 创建消息元素
    const messageDiv = document.createElement('div');
    messageDiv.className = 'mrlookup-message';
    messageDiv.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
        z-index: 1000;
        ${type === 'success' ? 
            'background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb;' : 
            'background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;'
        }
    `;
    messageDiv.textContent = message;
    
    // 添加到模态框
    modal.style.position = 'relative';
    modal.appendChild(messageDiv);
    
    // 3秒后自动移除
    setTimeout(function() {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 3000);
}

// 监听引用格式弹窗的出现
function observeCitationModal() {
	console.log('开始监听引用格式弹窗...');
	
	const observer = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			if (mutation.type === 'childList') {
				mutation.addedNodes.forEach(function(node) {
					if (node.nodeType === Node.ELEMENT_NODE) {
						// 检查是否包含引用格式弹窗
						if (node.querySelector && node.querySelector('#citationText')) {
							console.log('检测到新的引用格式弹窗');
							enhanceCitationModal(node);
						}
						// 检查子元素
						const citationTextarea = node.querySelector('#citationText');
						if (citationTextarea) {
							console.log('检测到引用文本区域');
							enhanceCitationModal(node);
						}
						
						// 检查是否是新添加的弹窗容器
						if (node.classList && node.classList.contains('modal-content')) {
							console.log('检测到新的弹窗容器');
							// 延迟检查，等待内容加载
							setTimeout(() => {
								const textarea = node.querySelector('#citationText');
								if (textarea) {
									console.log('弹窗容器中找到文本区域');
									enhanceCitationModal(node);
								}
							}, 100);
						}
					}
				});
			}
		});
	});
	
	observer.observe(document.body, {
		childList: true,
		subtree: true
	});
	
	// 也监听属性变化，因为弹窗可能通过显示/隐藏来工作
	const attributeObserver = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			if (mutation.type === 'attributes' && 
				(mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
				
				const target = mutation.target;
				// 检查是否是弹窗相关的元素
				if (target.id && target.id.includes('modal') || 
					target.classList && target.classList.contains('modal-content')) {
					
					console.log('检测到弹窗属性变化:', mutation.attributeName);
					
					// 延迟检查，等待内容完全加载
					setTimeout(() => {
						const textarea = target.querySelector('#citationText');
						if (textarea && !target.hasAttribute('data-enhanced')) {
							console.log('属性变化后找到文本区域');
							enhanceCitationModal(target);
						}
					}, 200);
				}
			}
		});
	});
	
	attributeObserver.observe(document.body, {
		attributes: true,
		subtree: true,
		attributeFilter: ['style', 'class']
	});
}

// 增强现有的引用格式弹窗
function enhanceExistingCitationModals() {
	console.log('增强现有的引用格式弹窗...');
	
	// 查找所有可能的弹窗容器
	const possibleModals = document.querySelectorAll('.modal-content, [id*="modal"], [class*="modal"]');
	console.log('找到可能的弹窗数量:', possibleModals.length);
	
	possibleModals.forEach(function(modal) {
		const citationTextareas = modal.querySelectorAll('#citationText');
		console.log('弹窗中的文本区域数量:', citationTextareas.length);
		
		citationTextareas.forEach(function(textarea) {
			if (modal && !modal.hasAttribute('data-enhanced')) {
				console.log('增强现有弹窗:', modal);
				enhanceCitationModal(modal);
			}
		});
	});
	
	// 也直接查找文本区域
	const citationTextareas = document.querySelectorAll('#citationText');
	console.log('直接找到的引用文本区域数量:', citationTextareas.length);
	
	citationTextareas.forEach(function(textarea) {
		const modal = textarea.closest('.modal-content, [id*="modal"], [class*="modal"]');
		if (modal && !modal.hasAttribute('data-enhanced')) {
			console.log('通过文本区域找到弹窗:', modal);
			enhanceCitationModal(modal);
		}
	});
}

// 处理新AMS MathSciNet网站
function handleNewAMSSite() {
	console.log('处理新AMS MathSciNet网站...');
	
	// 监听引用格式弹窗的出现
	observeCitationModal();
	
	// 为现有的引用格式弹窗添加功能
	enhanceExistingCitationModals();
	
	// 添加定期检查机制，确保捕获到动态创建的弹窗
	setupPeriodicCheck();
}

// 设置定期检查机制
function setupPeriodicCheck() {
	console.log('设置定期检查机制...');
	
	// 每2秒检查一次是否有新的弹窗
	const checkInterval = setInterval(function() {
		// 查找所有未增强的弹窗
		const unenhancedModals = document.querySelectorAll('.modal-content:not([data-enhanced]), [id*="modal"]:not([data-enhanced])');
		
		if (unenhancedModals.length > 0) {
			console.log('定期检查发现未增强的弹窗数量:', unenhancedModals.length);
			
			unenhancedModals.forEach(function(modal) {
				const textarea = modal.querySelector('#citationText');
				if (textarea) {
					console.log('定期检查发现包含文本区域的弹窗，开始增强');
					enhanceCitationModal(modal);
				}
			});
		}
		
		// 也检查是否有新的文本区域
		const allTextareas = document.querySelectorAll('#citationText');
		allTextareas.forEach(function(textarea) {
			const modal = textarea.closest('.modal-content, [id*="modal"], [class*="modal"]');
			if (modal && !modal.hasAttribute('data-enhanced')) {
				console.log('定期检查发现新的文本区域，开始增强弹窗');
				enhanceCitationModal(modal);
			}
		});
	}, 2000);
	
	// 存储interval ID，以便后续清理
	window._mrlookupCheckInterval = checkInterval;
	
	console.log('定期检查机制已设置，每2秒检查一次');
}

// 主函数
function initMRlookup() {
    console.log('MRlookup初始化开始...');
    
    // 检测是否为新AMS MathSciNet网站
    const isNewAMSSite = window.location.hostname === 'mathscinet.ams.org' && 
                         window.location.pathname.includes('/mathscinet/');
    
    console.log('是否为新AMS网站:', isNewAMSSite);
    
    if (isNewAMSSite) {
        // 处理新AMS MathSciNet网站
        handleNewAMSSite();
    } else {
        console.log('不是新AMS网站，跳过新功能');
    }
    
    console.log('MRlookup初始化完成');
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMRlookup);
} else {
    initMRlookup();
}

// 导出函数供测试使用
window.MRlookupTest = {
    parseBibTex,
    generateStandardizedBibTeX,
    cleanAuthorName,
    cleanTitle,
    getJournalAbbrev,
    enhanceCitationModal,
    TEST_BIBTEX
};
