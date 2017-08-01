const _ = require('lodash');
const path = require('path');

var AppBaseClass = require('nw-skeleton').AppBaseClass;

var _appWrapper;
var appState;

class AppTest extends AppBaseClass {

    constructor () {
        super();

        _appWrapper = window.getAppWrapper();
        appState = _appWrapper.getAppState();

        this.forceDebug = false;
        this.forceUserMessages = false;

        return this;
    }

    async initialize() {
        let returnValue = true;
        let propertyName = this.getConfig('appConfig.appTestConfig.dataPropertyName');
        let defaultPropertyName = this.getConfig('appConfig.appTestConfig.defaultDataPropertyName');
        let userData = await _appWrapper.getHelper('userData').loadUserData();
        if (userData && _.isObject(userData) && userData[propertyName]){
            _.defaultsDeep(userData[propertyName], appState.appData[defaultPropertyName]);
            appState.appData[propertyName] = _.cloneDeep(userData[propertyName]);
            appState.userData = userData;
        } else {
            appState.appData[propertyName] = _.cloneDeep(appState.appData[defaultPropertyName]);
            appState.userData[propertyName] = _.cloneDeep(appState.appData[defaultPropertyName]);
            _appWrapper.getHelper('userData').saveUserData(appState.userData);
        }

        return returnValue;
    }

    async finalize () {
        let transitionNames = [];
        let cssFiles = _.filter(_.concat(this.getConfig('appConfig.cssFiles', []), this.getConfig('appConfig.initCssFiles', []), this.getConfig('appConfig.overrideCssFiles', []), this.getStateVar('componentCssFiles', [])), (item) => {
            return item.match(/transition/);
        });
        let cssContents = ''
        for (let i=0; i<cssFiles.length; i++){
            let cssFile = cssFiles[i];
            if (!await _appWrapper.fileManager.isFile(cssFile)){
                cssFile = path.resolve(path.join('.', cssFiles[i]));
            }
            if (!await _appWrapper.fileManager.isFile(cssFile)){
                cssFile = path.resolve(cssFiles[i]);
            }
            if (await _appWrapper.fileManager.isFile(cssFile)){
                cssContents += await _appWrapper.fileManager.loadFile(cssFile);
            }
        }
        let selectors = cssContents.match(/\.[^,{]+/g);
        selectors = _.filter(selectors, (selector) => {
            let match = selector.match(/(-enter-to|-enter-active|-enter|-leave-to|-leave-active|-leave)/);
            return match && match.length > 1;
        });
        selectors = _.map(selectors, (selector) => {
            let name = selector.replace(/-enter-to/, '');
            name = name.replace(/-enter-active/, '');
            name = name.replace(/-enter/, '');
            name = name.replace(/-leave-to/, '');
            name = name.replace(/-leave-active/, '');
            name = name.replace(/-leave/, '');
            name = name.replace(/^\./, '');
            name = name.replace(/^[^.]+?\./, '');
            name = _.trim(name);
            return name;
        });
        selectors = _.uniq(selectors);
        selectors = selectors.sort();
        if (selectors && selectors.length){
            appState.appData.transitionData.availableTransitions = selectors;
            appState.appData.transitionData.currentTransition = selectors[0];
        }
    }

}
exports.AppTest = AppTest;