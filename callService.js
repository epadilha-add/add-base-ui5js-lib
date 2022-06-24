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

            return await fetch(src, param || p, 50).then((response) => {


                return response.ok ? response.text() : response.text() || response.status;
            }).then((data) => {

                let resp = {}

                try {
                    resp = JSON.parse(data);
                } catch {
                }

                if (resp && resp.uuid)
                    throw resp;

                if (resp.code && (resp.code === 403)) throw data

                if (resp.code && (resp.code < 200 || resp.code > 299)) throw data

                return data;

            }).catch((err) => {

                sap.ui.core.BusyIndicator.hide();

                if (err.status)
                    sap.m.MessageBox.show(err.url,
                        {
                            icon: sap.m.MessageBox.Icon.ERROR,
                            title: err.statusText + " (" + err.status + ")",
                            actions: [sap.m.MessageBox.Action.OK],
                        });

                if (err.uuid) {
                    if(!err?.error?.data?.NOSHOW)
                    window.open(window.location.origin + "/add/notification/" + err.uuid, '_blank');
                }
                if (err.toString() === 'TypeError: Failed to fetch') {
                    window.open(window.location.origin + "/logout", '_blank');
                }
                throw err;

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

            Object.assign(data, {
                m: sap.ui.getCore().getModel("userInfo").getData().currentMandt,
                a: Object.keys(window["sap-ui-config"]["resourceroots"])[0],
                foreground: true
            })

            header = {
                "Content-Type": "application/json",
                "Accept": "*/*",
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive"
            }

            let b = JSON.stringify(data);

            this._method = this.__method || "POST";

            let defaultParam = {

                mode: "cors",
                method: this._method,
                body: (this._method == "POST") ? b : null,
                headers: this._headers || header,
                credentials: "include",
                timeout: 3000
            }

            this._headers = null;

            return param || defaultParam;
        }
    }
});
