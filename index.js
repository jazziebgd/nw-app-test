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
exports.translations = {
    'en-US': require(path.resolve(path.join(__dirname, './data/translations/en-US.i18n.js'))).data,
    'sr-Cyrl-RS': require(path.resolve(path.join(__dirname, './data/translations/sr-Cyrl-RS.i18n.js'))).data,
    'sr-Latn-RS': require(path.resolve(path.join(__dirname, './data/translations/sr-Latn-RS.i18n.js'))).data
};