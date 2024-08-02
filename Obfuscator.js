const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const yaml = require('js-yaml');
const colors = require('colors');
const readlineSync = require('readline-sync');
const JavaScriptObfuscator = require('javascript-obfuscator');

function displayBanner() {
        console.log(colors.rainbow('********************************************'));
        console.log(colors.rainbow('*                                          *'));
        console.log(colors.rainbow('*              JS Obfuscator               *'));
        console.log(colors.rainbow('*                                          *'));
        console.log(colors.rainbow('********************************************'));
    
        console.log(colors.cyan('Welcome to the Shadow Byte Development JS Obfuscator'));
        console.log(colors.cyan('Choose between encryption or high-level obfuscation.'));
    
        console.log(colors.rainbow('                                          '));
}

displayBanner();

// Load configuration
const configPath = './config.yml';
if (!fs.existsSync(configPath)) {
    console.error(colors.red('Configuration file not found.'));
    process.exit(1);
}

let config;
try {
    config = yaml.load(fs.readFileSync(configPath, 'utf8'));
} catch (e) {
    console.error(colors.red(`Error reading configuration file: ${e.message}`));
    process.exit(1);
}

const { algorithm, directoryPath, copyright, key, iv } = config;
const restoreDir = './restore';

// Function to generate keys
function generateKeys() {
    try {
        const key = crypto.randomBytes(32).toString('hex');
        const iv = crypto.randomBytes(16).toString('hex');
        return { key, iv };
    } catch (error) {
        console.error(colors.red(`Key generation failed: ${error.message}`));
        return null;
    }
}

// Function to update config file
function updateConfig(newKey, newIv) {
    config.key = newKey;
    config.iv = newIv;
    try {
        fs.writeFileSync(configPath, yaml.dump(config), 'utf8');
        console.log(colors.green('Configuration file updated successfully.'));
    } catch (e) {
        console.error(colors.red(`Error writing to configuration file: ${e.message}`));
    }
}

// Function to create the restore directory
function createRestoreDir() {
    if (!fs.existsSync(restoreDir)) {
        fs.mkdirSync(restoreDir);
    }
}

// Function to backup a file to the restore directory
function backupFile(filePath) {
    const fileName = path.basename(filePath);
    const backupPath = path.join(restoreDir, fileName);
    fs.copyFileSync(filePath, backupPath);
}

// Function to obfuscate a file
function obfuscateFile(filePath) {
    try {
        console.log(colors.blue(`Obfuscating: ${filePath}`));

        const data = fs.readFileSync(filePath, 'utf8');
        const obfuscatedCode = JavaScriptObfuscator.obfuscate(data, {
            compact: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 0.75,
            numbersToExpressions: true,
            simplify: true,
            shuffleStringArray: true,
            splitStrings: true,
            stringArrayThreshold: 0.75,
        }).getObfuscatedCode();

        fs.writeFileSync(filePath, obfuscatedCode + `\n\n${copyright}`, 'utf8');
        console.log(colors.green(`Obfuscated: ${filePath}`));
    } catch (error) {
        console.error(colors.red(`Failed to obfuscate file ${filePath}: ${error.message}`));
    }
}

// Function to encrypt a file
function encryptFile(filePath) {
    try {
        console.log(colors.blue(`Encrypting: ${filePath}`));

        const data = fs.readFileSync(filePath, 'utf8');
        const cipher = crypto.createCipheriv(algorithm, Buffer.from(config.key, 'hex'), Buffer.from(config.iv, 'hex'));
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        fs.writeFileSync(filePath, encrypted + `\n\n${copyright}`, 'utf8');
        console.log(colors.green(`Encrypted: ${filePath}`));
    } catch (error) {
        console.error(colors.red(`Failed to encrypt file ${filePath}: ${error.message}`));
    }
}

// Function to process all .js files in a directory and its subdirectories
function processDirectory(directoryPath, processType) {
    try {
        fs.readdir(directoryPath, (err, files) => {
            if (err) {
                console.error(colors.red(`Error reading directory: ${err.message}`));
                return;
            }

            files.forEach(file => {
                const filePath = path.join(directoryPath, file);
                if (fs.lstatSync(filePath).isDirectory()) {
                    processDirectory(filePath, processType); // Recursively process subdirectory
                } else if (fs.lstatSync(filePath).isFile() && path.extname(file) === '.js') {
                    backupFile(filePath); // Backup file before processing
                    if (processType === 'obfuscate') {
                        obfuscateFile(filePath);
                    } else {
                        encryptFile(filePath);
                    }
                }
            });
        });
    } catch (error) {
        console.error(colors.red(`Failed to process directory: ${error.message}`));
    }
}

// Function to check if processing was successful
function checkProcessing(callback) {
    try {
        let hasErrors = false;
        fs.readdir(directoryPath, (err, files) => {
            if (err) {
                console.error(colors.red(`Error reading directory for verification: ${err.message}`));
                process.exit(1);
            }

            files.forEach(file => {
                const filePath = path.join(directoryPath, file);
                if (fs.lstatSync(filePath).isDirectory()) {
                    checkProcessing(() => { }); // Recursively check subdirectories
                } else if (fs.lstatSync(filePath).isFile() && path.extname(file) === '.js') {
                    try {
                        const data = fs.readFileSync(filePath, 'utf8');
                        if (data.includes('Error:') || data.includes('Exception:')) {
                            console.error(colors.red(`Potential issues found in file: ${filePath}`));
                            hasErrors = true;
                        }
                    } catch (error) {
                        console.error(colors.red(`Failed to read file for verification: ${filePath}`));
                        hasErrors = true;
                    }
                }
            });

            callback(hasErrors);
        });
    } catch (error) {
        console.error(colors.red(`Failed to check processing: ${error.message}`));
        process.exit(1);
    }
}

// Function to undo changes and restore the original configuration
function undoChanges(callback) {
    console.log(colors.yellow('Restoring the original configuration and undoing changes...'));

    // Restore the original configuration file from the backup
    if (fs.existsSync(configPath + '.bak')) {
        fs.copyFileSync(configPath + '.bak', configPath);
        console.log(colors.green('Configuration file restored from backup.'));
    } else {
        console.error(colors.red('No backup configuration file found.'));
    }

    // Restore the original files from the restore directory
    if (fs.existsSync(restoreDir)) {
        fs.readdirSync(restoreDir).forEach(file => {
            const restorePath = path.join(restoreDir, file);
            const originalPath = path.join(directoryPath, file);
            fs.copyFileSync(restorePath, originalPath);
            console.log(colors.green(`Restored: ${originalPath}`));
        });
        fs.rmdirSync(restoreDir, { recursive: true });
        console.log(colors.green('Restore directory cleaned up.'));
    } else {
        console.error(colors.red('No restore directory found.'));
    }

    callback();
}

// Function to confirm settings and directory
function confirmSettings(callback) {
    console.log(colors.cyan('Please confirm the following settings:'));
    console.log(colors.cyan(`Algorithm: ${algorithm}`));
    console.log(colors.cyan(`Key: ${config.key}`));
    console.log(colors.cyan(`IV: ${config.iv}`));
    console.log(colors.cyan(`Directory Path: ${directoryPath}`));
    console.log(colors.cyan(`Copyright: ${copyright}`));

    const answer = readlineSync.question(colors.yellow('Are these settings correct? (yes/no): '));
    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
        callback();
    } else {
        console.log(colors.red('Operation cancelled.'));
        process.exit(0);
    }
}

// Function to run pre-checks
function runPreChecks() {
    console.log(colors.yellow('Running pre-checks...'));

    // Check if directory exists
    if (!fs.existsSync(directoryPath)) {
        console.error(colors.red(`Directory not found: ${directoryPath}`));
        process.exit(1);
    }

    // Check if key and IV are the correct lengths
    if (Buffer.from(config.key, 'hex').length !== 32) {
        console.error(colors.red('Invalid key length. Key must be 32 bytes.'));
        process.exit(1);
    }

    if (Buffer.from(config.iv, 'hex').length !== 16) {
        console.error(colors.red('Invalid IV length. IV must be 16 bytes.'));
        process.exit(1);
    }

    // Check if all necessary settings are present
    if (!algorithm || !directoryPath || !copyright || !key || !iv) {
        console.error(colors.red('One or more required settings are missing in the configuration file.'));
        console.error(colors.red('Ensure that the following settings are specified: algorithm, directoryPath, copyright, key, iv'));
        process.exit(1);
    }

    console.log(colors.green('Pre-checks passed.'));
}

// Function to confirm and generate keys
function confirmAndGenerateKeys(callback) {
    console.log(colors.cyan('This will generate a new encryption key and IV.'));
    console.log(colors.cyan('Existing key and IV will be overwritten.'));

    const answer = readlineSync.question(colors.yellow('Do you want to proceed? (yes/no): '));
    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
        const keys = generateKeys();
        if (keys) {
            updateConfig(keys.key, keys.iv);
            callback();
        } else {
            console.error(colors.red('Key generation failed. Aborting.'));
            process.exit(1);
        }
    } else {
        console.log(colors.red('Operation cancelled.'));
        process.exit(0);
    }
}

// Main function to orchestrate key generation and encryption
function main() {
    // Create a backup of the configuration file before generating new keys
    fs.copyFileSync(configPath, configPath + '.bak');

    confirmAndGenerateKeys(() => {
        runPreChecks();
        confirmSettings(() => {
            createRestoreDir();

            const processType = readlineSync.question(colors.yellow('Choose process type (1 - Encrypt, 2 - Obfuscate): '));
            if (processType === '1' || processType === '2') {
                console.log(colors.yellow('Starting process...'));
                processDirectory(directoryPath, processType === '1' ? 'encrypt' : 'obfuscate');
                console.log(colors.yellow('Process completed.'));

                checkProcessing((hasErrors) => {
                    if (hasErrors) {
                        const retryAnswer = readlineSync.question(colors.yellow('Errors detected. Do you want to undo changes and restart? (yes/no): '));
                        if (retryAnswer.toLowerCase() === 'yes' || retryAnswer.toLowerCase() === 'y') {
                            undoChanges(() => {
                                console.log(colors.yellow('Restarting the key generation process...'));
                                main(); // Restart the process
                            });
                        } else {
                            console.log(colors.red('Operation cancelled.'));
                            process.exit(1);
                        }
                    } else {
                        console.log(colors.green('No errors found. Cleaning up...'));
                        if (fs.existsSync(restoreDir)) {
                            fs.rmdirSync(restoreDir, { recursive: true });
                            console.log(colors.green('Restore directory cleaned up.'));
                        }
                        console.log(colors.green('Process completed successfully.'));
                    }
                });
            } else {
                console.log(colors.red('Invalid choice. Operation cancelled.'));
                process.exit(0);
            }

            
        });
    });
}

main();
