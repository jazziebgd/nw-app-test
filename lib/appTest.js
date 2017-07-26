const _ = require('lodash');
var BaseClass = require('nw-skeleton').BaseClass;

var _appWrapper;
var appState;

class AppTest extends BaseClass {

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
            _.extend(userData[propertyName], appState.appData[defaultPropertyName]);
            appState.appData[propertyName] = _.cloneDeep(userData[propertyName]);
        } else {
            appState.appData[propertyName] = _.cloneDeep(appState.appData[defaultPropertyName]);
            appState.userData[propertyName] = _.cloneDeep(appState.appData[defaultPropertyName]);
            _appWrapper.getHelper('userData').saveUserData(appState.userData);
        }

        return returnValue;
    }

}
exports.AppTest = AppTest;