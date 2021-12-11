sap.ui.define([], function () {
    'use strict';

    var host = '/';

    return {

        getAsync: function (url, data, param, callBackSuccess, callBackError, callBackResponse, ehost) {
            return this._asyncCall(url, 'GET', data, param, callBackSuccess, callBackError, callBackResponse, ehost);
        },
        getSync: async function (url, data, param, callBackSuccess, callBackError, callBackResponse, ehost) {
            return await this._syncCall(url, 'GET', data, param, callBackSuccess, callBackError, callBackResponse, ehost);
        },
        postSync: async function (url, data, param, callBackSuccess, callBackError, callBackResponse, ehost) {
            return await this._syncCall(url, 'POST', data, param, callBackSuccess, callBackError, callBackResponse, ehost);
        },
        postAsync: function (url, data, param, callBackSuccess, callBackError, callBackResponse, ehost) {
            return this._asyncCall(url, 'POST', data, param, callBackSuccess, callBackError, callBackResponse, ehost);
        },
        _syncCall: async function (url, method, data, param, callBackSuccess, callBackError, callBackResponse, ehost) {

            let p = this._getParams(data, method, param);

            let src = (ehost) ? ehost + host + url : host + url;

            if (method == "GET" && data) src = src + data;

            return await fetch(src, param || p).then((response) => {
                return response.text();
            }).then((data) => {
                return data;
            }).catch((err) => {
                return JSON.stringify(err);
            });
        },
        _asyncCall: async function (url, method, data, param, callBackSuccess, callBackError, callBackResponse, ehost) {

            let p = this._getParams(data, method, param);

            let src = (ehost) ? ehost + host + url : host + url;

            if (method == "GET") src = src + data;

            return fetch(src, param || p).then((response) => {

                if (callBackResponse) {
                    callBackResponse(response);
                } else {
                    return response.text();
                }

            }).then((data) => {

                if (callBackSuccess) {
                    callBackSuccess(data);
                } else {
                    return data;
                }

            }).catch((err) => {
                Log.info(err);
                callBackError(err);
            });

        },
        setHeaders(headers) {
            this._headers = headers;
        },

        setMethod(method) {
            this._method = method;
        },
        _getParams: function (data, method, param) {

            var header = {};

            header = {
                "Content-Type": "application/json",
                "Accept": "*/*",
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive"
            }

            let b = JSON.stringify(data);

            this._method = this._method || method || "POST";

            let defaultParam = {

                mode: "cors",
                method: this._method,
                body: (this._method == "POST") ? b : null,
                headers: this._headers || header
            }

            this._headers = null;

            return param || defaultParam;
        }
    }
});
