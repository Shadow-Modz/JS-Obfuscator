Welcome to the **JS Obfuscator** project by Shadow Byte Development. This tool allows you to encrypt or obfuscate your JavaScript files, helping you protect your code from unauthorized access or tampering.

## Features

- **Encryption**: Secure your JavaScript files using advanced encryption algorithms.
- **Obfuscation**: Transform your JavaScript code into a more complex version, making it harder to read and understand.
- **Backup**: Automatically backs up original files before processing.
- **Configuration**: Easy configuration using a YAML file.
- **Cross-Platform**: Works on any platform with Node.js support.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ShadowBytedev/js-obfuscator.git
   cd js-obfuscator
Install the required dependencies:


npm install
Create a configuration file named config.yml in the project root.

Configuration
Your config.yml file should contain the following settings:

algorithm: 'aes-256-cbc' # Encryption algorithm
directoryPath: './src'    # Directory containing the JavaScript files to process
copyright: 'Copyright © Your Name' # Copyright notice
key: 'your-32-byte-hex-key' # 32-byte key for encryption (in hexadecimal)
iv: 'your-16-byte-hex-iv'   # 16-byte IV for encryption (in hexadecimal)
Make sure to replace the values with appropriate settings for your use case.

Usage
Start the obfuscation or encryption process by running:


node index.js
Follow the prompts to confirm your settings and choose the desired processing method (Encrypt or Obfuscate).

The tool will process all .js files in the specified directory and its subdirectories.

How It Works
The program starts by displaying a welcome banner and loading the configuration settings from config.yml.
It verifies the settings, including the existence of the target directory and the validity of the encryption key and IV.
The user is prompted to confirm the settings and choose between encryption or obfuscation.
The tool processes each .js file, creating a backup before making changes.
After processing, it verifies the output for potential errors and allows for restoration of the original files if needed.

License
This project is licensed under the MIT License. See the LICENSE file for details.
