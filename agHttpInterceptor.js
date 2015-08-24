'use strict';
angular.module('ag.service', []).config(['$httpProvider', function($httpProvider) {
    $httpProvider.interceptors.push('agHttpInterceptor');

    // ajax loading spinner with kendo window
    var spinnerFunction = function spinnerFunction(data, headersGetter) {
        $('#spinner').data('kendoWindow').center().open();
        return data;
    };
    $httpProvider.defaults.transformRequest.push(spinnerFunction);

}]).factory('agHttpInterceptor', ['$q', 'notify', function($q, notify) {
    return {
        'transformRequest': function(obj) {
            // fix post form format problem
            var str = [];
            for (var p in obj)
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            return str.join("&");
        },
        'request': function(config) {
            switch (config.method) {
                case 'PUT':
                case 'DELETE':
                    // add additional data
                    config = angular.copy(config);
                    $.extend(true, config, {
                        data: {
                            _method: config.method
                        }
                    });
                    break;
                case 'JSONP':
                    break;
            }
            return config;
        },
        'requestError': function(rejection) {
            return $q.reject(rejection);
        },
        'response': function(response) {

            // close loading spinner
            if (!notify.isPersistent())
                notify.spinnerClose(500);

            return response;
        },
        'responseError': function(rejection) {

            // close loading spinner
            if (!notify.isPersistent())
                notify.spinnerClose(500);

            // error log
            if (rejection.status !== 0) console.log('httpError:', rejection);
            return $q.reject(rejection);
        }
    };
}]).factory('notify', ['$rootScope', '$filter', function($rootScope, $filter) {
    var persistent = false;

    return {
        setPersistent: function(_persistent) {
            persistent = _persistent;
        },
        isPersistent: function() {
            return persistent;
        },
        code: function(res, _callBack) {
            // show error code
            var code = res.statusCode || res.errCode;
            code = (code ? code : 1);
            $rootScope.$broadcast('notifyMessage', {
                message: code,
                callBack: _callBack
            });
        },
        message: function(_message, _callBack, _title) {
            var data = {
                title: _title,
                message: _message,
                callBack: _callBack
            };
            $rootScope.$broadcast('notifyMessage', data);
        },
        confirm: function(_message, _done, _cancel, _title) {
            var data = {
                title: _title,
                message: _message,
                done: _done,
                cancel: _cancel
            };
            $rootScope.$broadcast('notifyConfirm', data);
        },
        upload: function(_option) {
            $rootScope.$broadcast('notifyUpload', _option);
        },
        spinner: function(_persistent) {
            if (typeof _persistent != 'undefined')
                persistent = _persistent;
            $rootScope.$broadcast('spinner', persistent);
        },
        spinnerClose: function(delay) {
            persistent = false;
            $rootScope.$broadcast('spinnerClose', delay);
        }
    };
}]);
