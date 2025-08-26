# MRlookup - MathSciNet BibTeX Standardization Tool

[![Greasy Fork](https://img.shields.io/badge/Greasy%20Fork-v3.0.5-brightgreen.svg)](https://greasyfork.org/zh-CN/scripts/35116-mrlookup)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

MRlookup is a powerful userscript that automatically standardizes BibTeX citation keys from MathSciNet articles. It supports both the classic MathSciNet site and the new AMS MathSciNet platform.

## ✨ Features

### 🔄 **Automatic BibTeX Standardization**
- **Smart Key Generation**: Automatically generates standardized citation keys in `AUTHOR_YEAR_TITLE` format
- **Real-time Processing**: Works instantly when BibTeX format is selected
- **Intelligent Parsing**: Extracts author, title, journal, year, and other metadata
- **Format Preservation**: Maintains all original BibTeX fields while standardizing the key
- **Cross-Platform**: Works on MathSciNet, arXiv, and other academic platforms

### 🌐 **Multi-Platform Support**
- **Classic MathSciNet**: Full support for the original MathSciNet site
- **New AMS MathSciNet**: Complete support for the new platform at `mathscinet.ams.org`
- **arXiv**: Support for arXiv BibTeX data standardization
- **MRlookup.org**: Support for the dedicated MRlookup platform
- **Automatic Detection**: Automatically detects which site you're using
- **Seamless Experience**: Same functionality across all platforms

### 🎯 **Enhanced User Experience**
- **One-Click Standardization**: No manual intervention required
- **Visual Feedback**: Success messages and status indicators
- **Debug Mode**: Advanced debugging and testing capabilities
- **Responsive Design**: Optimized button layout and positioning

### 🛠️ **Advanced Features**
- **Mode Toggle**: Switch between Journal and Article citation modes
- **Test Data**: Built-in test data for development and debugging
- **Clipboard Integration**: Automatic copying of standardized BibTeX
- **Error Handling**: Robust error handling with user-friendly messages

## 🚀 Quick Start

### Installation
1. Install a userscript manager (Tampermonkey, Greasemonkey, etc.)
2. Install the script from [Greasy Fork](https://greasyfork.org/zh-CN/scripts/35116-mrlookup)
3. Navigate to any supported site (MathSciNet, arXiv, MRlookup.org)
4. Click "Cite" and select "BibTeX" format
5. The citation key will be automatically standardized!

### Usage Examples

#### Classic MathSciNet
```
Original: @article{MR1234567, ...}
Standardized: @article{Smith2023QuantumComputing, ...}
```

#### New AMS MathSciNet
```
Original: @article{MR9876543, ...}
Standardized: @article{Johnson2024AdvancedAlgorithms, ...}
```

#### arXiv
```
Original: @article{arXiv:2301.12345, ...}
Standardized: @article{Smith2023QuantumComputing, ...}
```

## 🔧 Technical Details

### Supported Sites
- **Classic MathSciNet**: `mathscinet.ams.org` (legacy)
- **New AMS MathSciNet**: `mathscinet.ams.org/mathscinet/`
- **MathSciNet Publications Search**: `mathscinet.ams.org/mathscinet/publications-search`
- **MathSciNet 2006 Version**: `mathscinet.ams.org/mathscinet/2006/mathscinet?version=2`
- **MRlookup.org**: `http://mrlookup.org`
- **arXiv**: `arxiv.org` (BibTeX standardization)

### BibTeX Key Format
```
AUTHOR_YEAR_TITLE
```
- **AUTHOR**: First author's last name (cleaned)
- **YEAR**: Publication year  
- **TITLE**: First few words of title (cleaned, no spaces or special characters)

### Citation Modes
- **Journal Mode**: Uses journal abbreviation as identifier
- **Title Mode**: Uses title keywords as identifier
- **Toggle**: Switch between modes using the mode indicator button

### Browser Compatibility
- Chrome/Chromium (with Tampermonkey)
- Firefox (with Greasemonkey)
- Safari (with Userscripts)
- Edge (with Tampermonkey)

## 🎨 UI Components

### Right-Side Control Panel
```
┌─────────────────┐
│ Mode: Journal   │ ← Mode indicator
├─────────────────┤
│Standardize BibTeX│ ← Manual standardization
├─────────────────┤
│   Debug: OFF    │ ← Debug mode toggle
├─────────────────┤
│   Test Data     │ ← Test data (Debug mode)
└─────────────────┘
```

### Button Styling
- **Font Size**: 12px (optimized for readability)
- **Positioning**: Fixed positioning with consistent spacing
- **Colors**: Semantic color coding (green for actions, red for debug)
- **Responsiveness**: Optimized for various screen sizes

## 🔍 Debug Mode

Enable debug mode to access advanced features:

- **Test Data**: Load sample BibTeX data for testing
- **Console Logging**: Detailed logging for troubleshooting
- **Manual Standardization**: Test standardization manually
- **Position Information**: Button positioning details

## 🧪 Testing

### Local Testing
1. Open any MathSciNet article page
2. The script will automatically enhance citation modals
3. Test BibTeX standardization and button functionality

### Real Site Testing
1. Navigate to any MathSciNet article
2. Click "Cite" and select "BibTeX"
3. Verify automatic standardization works
4. Test debug mode and other features

## 📝 Changelog

### v3.0.5 (Current)
- ✅ **New AMS MathSciNet Support**: Complete support for the new platform
- ✅ **Automatic Standardization**: No manual intervention required
- ✅ **Button Optimization**: Improved button styling and positioning
- ✅ **Enhanced Modal Detection**: Robust detection of citation modals
- ✅ **Debug Mode**: Advanced debugging and testing capabilities

### v3.0.4
- Fixed citation key update issues
- Improved mode toggle functionality
- Enhanced formatting and error handling

### v3.0.0
- Major rewrite with improved BibTeX parsing
- Added debug mode and testing features
- Enhanced user interface and experience

## 🤝 Contributing

### Development Setup
1. Clone the repository
2. Install a userscript manager
3. Load `mrlookup.js` as a userscript
4. Test on MathSciNet sites
5. Submit pull requests with improvements

### Testing Guidelines
- Test on both classic and new AMS MathSciNet sites
- Verify BibTeX standardization accuracy
- Check button positioning and styling
- Ensure error handling works correctly

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **MathSciNet**: For providing the mathematical literature database
- **AMS**: For the new MathSciNet platform
- **UserScript Community**: For continuous feedback and improvements
- **Open Source Contributors**: For bug reports and feature suggestions

## 📞 Support

- **Issues**: Report bugs on GitHub
- **Feature Requests**: Suggest new features via GitHub issues
- **Documentation**: Check the README for detailed guides
- **Testing**: Test on real MathSciNet sites

---

**MRlookup** - Making MathSciNet citations consistent and professional since 2023.
