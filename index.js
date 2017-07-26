const path = require('path');
exports.componentDir = path.resolve(path.join(__dirname, './components/app'));
exports.modalComponentDir = path.resolve(path.join(__dirname, './components/modal'));
exports.componentMapping = [
    {
        'app-test': {
            name: 'app-test',
            components: {}
        }
    }
];
exports.modalComponentMapping = [
    {
        'test-modal': {
            name: 'test-modal',
            components: {}
        }
    }
];
exports.config = require(path.resolve(path.join(__dirname, './config.js'))).config;