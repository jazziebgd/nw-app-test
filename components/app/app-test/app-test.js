/**
 * @fileOverview app-test component file
 * @author Dino Ivankov <dinoivankov@gmail.com>
 * @version 1.1.0
 * @memberOf components
 */

const _ = require('lodash');

var _appWrapper = window.getAppWrapper();
var appState = _appWrapper.getAppState();

/**
 * App main component
 *
 * @name app-test
 * @memberOf components
 * @property {string}   name        Name of the component
 * @property {string}   template    Component template contents
 * @property {string[]} props       Component properties
 * @property {Function} data        Data function
 * @property {Object}   methods     Component methods
 * @property {Object}   watch       Component watchers
 * @property {Object}   computed    Computed properties
 * @property {Object}   components  Child components
 */
exports.component = {
    name: 'app-test',
    template: '',
    tickTimeout: null,
    finishTimeout: null,
    checkSpeedTimeout: null,
    boundMethods: {
        operationTick: null,
        messageResponse: null,
    },
    operationId: '',
    created: function () {
        this.boundMethods = {
            operationTick: this.operationTick.bind(this),
            messageResponse: this.messageResponse.bind(this)
        };
    },
    updated: function(){
        this.saveUserData();
    },
    destroyed: function(){
        this.boundMethods.operationTick = null;
        this.boundMethods.messageResponse = null;
        this.boundMethods = null;
        this.checkSpeedTimeout = null;
        this.tickTimeout = null;
        this.finishTimeout = null;
        this.operationId = null;
    },
    data: function () {
        let data = appState.userData[appState.config.appConfig.appTestConfig.dataPropertyName];
        return data;
    },
    methods: {
        clearMessages: function(e){
            if (e && e.target && e.target.hasClass('button-disabled')){
                return;
            }
            _appWrapper.getHelper('debug').clearUserMessages();
            _appWrapper.getHelper('debug').clearDebugMessages();
        },
        testMessage: async function(){
            let types = ['debug', 'info', 'warning','error','delimiter'];
            let count = this.messageCount;
            let messageType = _.cloneDeep(this.messageType);
            let utilHelper = _appWrapper.getHelper('util');
            let baseMessage = 'message';
            for (let i=0; i<count; i++){
                let randomNumber = utilHelper.getRandom(1, 6);
                if (this.messageType == 'random'){
                    messageType = types[Math.floor(Math.random()*types.length)];
                }
                let message = baseMessage;
                if (randomNumber > 4){
                    message += ' ' + utilHelper.getRandomString(randomNumber);
                }
                if (this.logMessage){
                    await _appWrapper.getHelper('component').addUserMessage(message, messageType, [], false, true, true, this.logDebug);
                } else if (this.logDebug) {
                    await _appWrapper.getHelper('component').log(message, messageType, [], true, true);
                }
            }
        },
        operationStart: function(e){
            if (e.target.hasClass('button-disabled')){
                return;
            }
            this.statusChange('operationStatusChanging');
            this.operationData.currentOperationValue = 0;
            this.operationData.operationId = _appWrapper.getHelper('appOperation').operationStart('operation', this.cancelable, true, true, 'progress', false, true);
            _appWrapper.getHelper('appOperation').operationUpdate(0, this.maxOperationValue);
        },
        simulateProgress: function(e){
            if (e && e.target && e.target.hasClass('button-disabled')){
                return;
            }
            this.statusChange('simulationStatusChanging');
            let duration = this.maxSpeed - this.speed;
            clearTimeout(this.tickTimeout);
            this.tickTimeout = setTimeout(this.boundMethods.operationTick, duration);
            this.operationData.isSimulating = true;
        },
        operationTick: async function(){
            let appOperationHelper = _appWrapper.getHelper('appOperation');
            clearTimeout(this.tickTimeout);
            if (!appOperationHelper.canOperationContinue()){
                clearTimeout(this.finishTimeout);
                this.finishTimeout = setTimeout( () => {
                    clearTimeout(this.finishTimeout);
                    this.operationData.isSimulating = false;
                    appState.status.appStatus = 'offline';
                    appOperationHelper.operationFinish('cancelled');
                }, 1000);
            } else {
                this.operationData.currentOperationValue += 1;
                if (this.operationData.currentOperationValue < this.maxOperationValue){
                    appOperationHelper.operationUpdate(this.operationData.currentOperationValue, this.maxOperationValue);
                    let duration = this.maxSpeed - this.speed;
                    if (this.logProgress && ((this.operationData.currentOperationValue - this.operationData.lastLoggedValue) % 10 == 0)){
                        this.operationData.lastLoggedValue = this.operationData.currentOperationValue;
                        _appWrapper.getHelper('component').addUserMessage('Log progress: {1} / {2}', 'info', [this.operationData.currentOperationValue, this.maxOperationValue], false, true, true, true);
                    }
                    await _appWrapper.nextTick();
                    this.tickTimeout = setTimeout(this.boundMethods.operationTick, duration);
                } else {
                    this.operationData.isSimulating = false;
                    appState.status.appStatus = 'success';
                    appOperationHelper.operationFinish('done');
                }
            }
        },
        stopSimulating: function (e){
            if (e.target.hasClass('button-disabled')){
                return;
            }
            this.statusChange('simulationStatusChanging');
            clearTimeout(this.tickTimeout);
            this.operationData.isSimulating = false;
            this.$forceUpdate();
        },
        operationIncrement: function(e){
            if (e.target.hasClass('button-disabled')){
                return;
            }
            let value = parseInt(this.stepValue, 10);
            value = appState.progressData.percentNumber + value;
            this.operationData.currentOperationValue = parseInt(value / 100 * this.maxOperationValue, 10);
            _appWrapper.getHelper('appOperation').operationUpdate(this.operationData.currentOperationValue, this.maxOperationValue);
        },
        operationDecrement: function(e){
            if (e.target.hasClass('button-disabled')){
                return;
            }
            let value = 0 - parseInt(this.stepValue, 10);
            value = appState.progressData.percentNumber + value;
            this.operationData.currentOperationValue = parseInt(value / 100 * this.maxOperationValue, 10);
            _appWrapper.getHelper('appOperation').operationUpdate(this.operationData.currentOperationValue, this.maxOperationValue);
        },
        operationFinish: function(e){
            if (e.target.hasClass('button-disabled')){
                return;
            }
            this.statusChange('operationStatusChanging');
            this.operationData.isSimulating = false;
            clearTimeout(this.tickTimeout);
            _appWrapper.getHelper('appOperation').updateProgress(this.maxOperationValue, this.maxOperationValue);
            _appWrapper.getHelper('appOperation').operationFinish('done');
        },
        statusChange: function(property){
            this.operationData[property] = 1;
            setTimeout( () => {
                this.operationData[property] = 0;
            }, 500);
        },
        openTestModal: function() {
            let modalHelper = _appWrapper.getHelper('modal');
            let modalOptions = {
                title: 'Test modal',
                body: 'This is a test modal. You can add modal messages or see callbacks as they are called.'
            };
            if (this.animateTestModal){
                modalOptions.animateSize = true;
            }
            if (this.autoCloseModal){
                modalOptions.autoCloseTime = Math.floor(this.autoCloseDuration / 1000) * 1000;
            } else {
                modalOptions.autoCloseTime = 0;
            }

            if (this.cancelOnCloseModal){
                modalOptions.cancelOnClose = true;
            } else {
                modalOptions.cancelOnClose = false;
            }

            modalOptions.showConfirmButton = this.showConfirmButton;
            modalOptions.showCancelButton = this.showCancelButton;
            modalOptions.confirmDisabled = this.confirmDisabled;
            modalOptions.cancelDisabled = this.cancelDisabled;
            modalOptions.confirmSelected = this.confirmSelected;
            modalOptions.cancelSelected = this.cancelSelected;
            modalOptions.showCloseLink = this.showCloseLink;
            modalOptions.busy = true;


            let options = _.cloneDeep(modalOptions);

            options.onBeforeOpen = async () => {
                console.log('Test modal onBeforeOpen');
                await _appWrapper.wait(1000);
                _appWrapper.addNotification('Test modal onBeforeOpen', 'info', '', true, {immediate: true});
            };

            options.onOpen = async () => {
                console.log('Test modal onOpen');
                await _appWrapper.wait(1000);
                _appWrapper.addNotification('Test modal onOpen', 'info', '', true, {immediate: true});
            };

            options.onBeforeClose = async () => {
                console.log('Test modal onBeforeClose');
                await _appWrapper.wait(1000);
                _appWrapper.addNotification('Test modal onBeforeClose', 'info', '', true, {immediate: true});
            };

            options.onClose = async () => {
                console.log('Test modal onClose');
                await _appWrapper.wait(1000);
                _appWrapper.addNotification('Test modal onClose', 'info', '', true, {immediate: true});
            };

            options.onConfirm = async () => {
                console.log('Test modal onConfirm');
                await _appWrapper.wait(1000);
                _appWrapper.addNotification('Test modal onConfirm', 'info', '', true, {immediate: true});
            };

            options.onCancel = async () => {
                console.log('Test modal onCancel');
                await _appWrapper.wait(1000);
                _appWrapper.addNotification('Test modal onCancel', 'info', '', true, {immediate: true});
            };

            _appWrapper._confirmModalAction = modalHelper.closeCurrentModalDelayed.bind(modalHelper, 1000, 'Confirming...');
            _appWrapper._cancelModalAction = modalHelper.closeCurrentModalDelayed.bind(modalHelper, 1000, 'Cancelling...');

            modalHelper.openModal('testModal', options);
        },
        styledCheckboxChange: function (e){
            let cb = e.target;
            let prop = cb.getAttribute('name');
            let checked = cb.checked;
            this[prop] = checked;
        },
        modalCheckboxChange: function (e){
            let cb = e.target;
            let prop = cb.getAttribute('name');
            let checked = cb.checked;

            let cancelSelected;
            let cancelDisabled;
            let showCancelButton;
            let confirmSelected;
            let confirmDisabled;
            let showConfirmButton;


            if (prop == 'showCancelButton'){
                if (!checked){
                    showCancelButton = false;
                    cancelSelected = false;
                } else {
                    showCancelButton = true;
                }
            }
            if (prop == 'cancelDisabled'){
                if (checked){
                    cancelDisabled = true;
                    cancelSelected = false;
                } else {
                    cancelDisabled = false;
                }
            }
            if (prop == 'cancelSelected'){
                if (checked){
                    cancelDisabled = false;
                    showCancelButton = true;
                    confirmSelected = false;
                    cancelSelected = true;
                } else {
                    cancelSelected = false;
                }
            }

            if (prop == 'showConfirmButton'){
                if (!checked){
                    showConfirmButton = false;
                    confirmSelected = false;
                } else {
                    showConfirmButton = true;
                }
            }
            if (prop == 'confirmDisabled'){
                if (checked){
                    confirmSelected = false;
                    confirmDisabled = true;
                } else {
                    confirmDisabled = false;
                }
            }
            if (prop == 'confirmSelected'){
                if (checked){
                    confirmSelected = true;
                    confirmDisabled = false;
                    showConfirmButton = true;
                    cancelSelected = false;
                } else {
                    confirmSelected = false;
                }
            }

            if (!_.isUndefined(cancelSelected)){
                this.$data.cancelSelected = cancelSelected;
            }
            if (!_.isUndefined(cancelDisabled)){
                this.$data.cancelDisabled = cancelDisabled;
            }
            if (!_.isUndefined(showCancelButton)){
                this.$data.showCancelButton = showCancelButton;
            }
            if (!_.isUndefined(confirmSelected)){
                this.$data.confirmSelected = confirmSelected;
            }
            if (!_.isUndefined(confirmDisabled)){
                this.$data.confirmDisabled = confirmDisabled;
            }
            if (!_.isUndefined(showConfirmButton)){
                this.$data.showConfirmButton = showConfirmButton;
            }
        },
        resetUserData: function(e) {
            if (e && e.target && e.target.hasClass('button-disabled')){
                return;
            }
            let modalHelper = _appWrapper.getHelper('modal');
            modalHelper.confirm('Are you sure?', 'Resetting all user data', 'Yes', 'No', this.doResetUserData);
        },
        doResetUserData: async function() {
            let userDataHelper = _appWrapper.getHelper('userData');
            let userData = _.cloneDeep(appState.userData);
            let saved = true;
            if (userData && userData[appState.config.appConfig.appTestConfig.dataPropertyName]){
                delete userData[appState.config.appConfig.appTestConfig.dataPropertyName];
                saved = await userDataHelper.saveUserData(userData);
            }
            let keys = Object.keys(this.$data);
            for (let i=0; i<keys.length; i++){
                this[keys[i]] = appState.appData[appState.config.appConfig.appTestConfig.defaultDataPropertyName][keys[i]];
            }
            _appWrapper.getHelper('modal').closeCurrentModal();
            if (saved){
                _appWrapper.addUserMessage('User data reset.', 'info', []);
            } else {
                _appWrapper.addUserMessage('User data not reset.', 'warning', []);
            }
        },
        saveUserData: async function(e, noNotification) {
            if (e && e.target && e.target.hasClass('button-disabled')){
                return;
            }
            let userDataHelper = _appWrapper.getHelper('userData');
            let saved = await userDataHelper.saveUserData(appState.userData);
            if (saved && !noNotification){
                _appWrapper.addUserMessage('User data saved.', 'info', []);
            }
        },
        userDataChanged: function(){
            let utilHelper = _appWrapper.getHelper('util');
            let currentData = _.cloneDeep(this.$data);
            let oldData = _.cloneDeep(appState.userData[appState.config.appConfig.appTestConfig.dataPropertyName]);
            let dataDiff = utilHelper.difference(oldData, currentData);
            return Object.keys(dataDiff).length;
        },
        defaultDataChanged: function(){
            let utilHelper = _appWrapper.getHelper('util');

            let currentDataMap = utilHelper.propertyValuesMap(_.cloneDeep(this.$data));
            let savedData = _.cloneDeep(appState.appData[appState.config.appConfig.appTestConfig.defaultDataPropertyName]);
            let oldDataMap = utilHelper.propertyValuesMap(savedData);
            let keyMapDiff = utilHelper.difference(oldDataMap, currentDataMap);
            return Object.keys(keyMapDiff).length;
        },
        addNotification: function(){
            let text = this.notificationText;
            if (this.customNotification){
                text = this.customNotificationText;
            }
            _appWrapper.addNotification(text, 'info', [], true);
        },
        addDesktopNotification: async function(e){
            if (e && e.target && e.target.hasClass('button-disabled')){
                return;
            }
            let notifTexts = [
                'Desktop notification',
                'Desktop notification test',
                'Testing desktop notifications'
            ];
            let notifBodies = [
                'Desktop notification info',
                'Desktop notification test info',
                'Testing desktop notifications info'
            ];
            let notifText = notifTexts[Math.floor(Math.random() * notifTexts.length)];
            let notifBody = notifBodies[Math.floor(Math.random() * notifBodies.length)];
            _appWrapper.addDesktopNotification(notifText, [], true, {
                requireInteraction: true,
                message: notifBody
            },
            {
                onClosed: (notificationId, byUser) => {
                    console.log('onclose', notificationId, byUser);
                    // e.target.removeClass('button-disabled');
                },
                onClicked: (notificationId) => {
                    console.log('onclick', notificationId);
                    // e.target.removeClass('button-disabled');
                },
                onButtonClicked: (notificationId, buttonIndex) => {
                    // e.target.removeClass('button-disabled');
                    console.log('button click', notificationId, buttonIndex);
                }
            });
        },
        sendPingMessage: async function(e){
            if (e && e.target && e.target.hasClass('button-disabled')){
                return;
            }
            this.messageInProgress = true;
            appState.appData.messagingData.messageResponseData = {sending: true};
            appState.appData.messagingData.messageUuid = _appWrapper.getHelper('util').uuid();
            _appWrapper.windowManager.win.globalEmitter.on('messageResponse', this.boundMethods.messageResponse);
            await _appWrapper.wait(_appWrapper.getConfig('shortPauseDuration'));
            _appWrapper.message({instruction: 'ping', uuid: appState.appData.messagingData.messageUuid, data: {test: 'test'}});
        },
        sendInvalidMessage: async function(e){
            if (e && e.target && e.target.hasClass('button-disabled')){
                return;
            }
            this.messageInProgress = true;
            appState.appData.messagingData.messageResponseData = {sending: true};
            appState.appData.messagingData.messageUuid = _appWrapper.getHelper('util').uuid();
            _appWrapper.windowManager.win.globalEmitter.on('messageResponse', this.boundMethods.messageResponse);
            await _appWrapper.wait(_appWrapper.getConfig('shortPauseDuration'));
            _appWrapper.message({instruction: 'ping2', uuid: appState.appData.messagingData.messageUuid, data: {test: 'test'}});
        },
        clearMessageData: function(){
            appState.appData.messagingData.messageResponseData = {respones: {}};
        },
        messageResponse: function(messageData){
            if (messageData && messageData.uuid && messageData.uuid == appState.appData.messagingData.messageUuid){
                _appWrapper.windowManager.win.globalEmitter.removeListener('messageResponse', this.boundMethods.messageResponse);
                this.messageInProgress = false;
                appState.appData.messagingData.messageResponseData = {response: messageData};
                appState.appData.messagingData.messageUuid = '';
            }
        },
        sendAsyncTestMessage: async function (e) {
            if (e && e.target && e.target.hasClass('button-disabled')){
                return;
            }
            appState.appData.messagingData.asyncMessageResponseData = {sending: true};
            this.asyncMessageInProgress = true;
            appState.appData.messagingData.asyncMessageUuid = _appWrapper.getHelper('util').uuid();
            appState.appData.messagingData.asyncMessageResponseData = {response: await _appWrapper.asyncMessage({instruction: 'test', uuid: appState.appData.messagingData.asyncMessageUuid, data: {duration: 1000}})};
            this.asyncMessageInProgress = false;
            appState.appData.messagingData.asyncMessageUuid = '';
        },
        sendInvalidAsyncMessage: async function (e) {
            if (e && e.target && e.target.hasClass('button-disabled')){
                return;
            }
            appState.appData.messagingData.asyncMessageResponseData = {sending: true};
            this.asyncMessageInProgress = true;
            appState.appData.messagingData.asyncMessageUuid = _appWrapper.getHelper('util').uuid();
            await _appWrapper.wait(_appWrapper.getConfig('shortPauseDuration'));
            appState.appData.messagingData.asyncMessageResponseData = {response: await _appWrapper.asyncMessage({instruction: 'test2', uuid: appState.appData.messagingData.asyncMessageUuid, data: {duration: 1000}})};
            this.asyncMessageInProgress = false;
            appState.appData.messagingData.asyncMessageUuid = '';
        },
        clearAsyncMessageData: function(){
            appState.appData.messagingData.asyncMessageResponseData = {respones: {}};
        },
        toggleSection: function(e){
            let target = e.target;
            let section = target.getParentByClass('app-test-section');
            let sectionIdentifier = section.getAttribute('data-section');
            if (this.minimizedSections[sectionIdentifier]){
                this.minimizedSections[sectionIdentifier] = false;
            } else {
                this.minimizedSections[sectionIdentifier] = true;
            }
        },
        toggleTransitionElement: function() {
            appState.appData.transitionData.elementShown = !appState.appData.transitionData.elementShown;
        }
    },
    computed: {
        appState: function(){
            return appState;
        },
        operationInProgress: function() {
            return appState.appOperation.operationActive && appState.appOperation.operationId == this.operationData.operationId;
        },
        appInfoJsonData: function () {
            return {
                appInfo: appState.config.appInfo,
                platformData: appState.platformData
            };
        },
        hasCustomData: function(){
            return this.defaultDataChanged();
        },
        savedDataChanged: function(){
            return this.userDataChanged();
        },
        isCustomNotification: function(){
            return this.customNotification;
        },
        operationData: function(){
            return appState.appData.operationData;
        },
        messagingData: function(){
            return appState.appData.messagingData;
        },
        dataPropertyName: function(){
            return appState.config.appConfig.appTestConfig.dataPropertyName;
        },
        defaultDataPropertyName: function(){
            return appState.config.appConfig.appTestConfig.defaultDataPropertyName;
        }
    },
    watch: {
        speed: function(){
            if (this.speed > (this.maxSpeed - 1)){
                this.speed = (this.maxSpeed - 1);
            }
            if (this.speed < this.minSpeed){
                this.speed = this.minSpeed;
            }
        },
        maxOperationValue: function(){
            if (this.maxOperationValue > (this.maxOperationValueLimit)){
                this.maxOperationValue = this.maxOperationValueLimit;
            }
            if (this.maxOperationValue < 1){
                this.maxOperationValue = 1;
            }
        }
    }
};