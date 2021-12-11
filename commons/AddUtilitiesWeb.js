sap.ui.define(["../add/AddUtilities"], function (AddUtilities) {
    "use strict";

    return {

        callAdd: async function (body, callbackFunctionSucess, callbackFunctionError, that, METHOD) {

            var vmethod = (METHOD) ? METHOD : "GET";

            if (vmethod === "GET") {

                if (window.location.origin === "http://localhost:5001") {
                    var url = "http://localhost:5001/local/api/EMPTY/";
                } else {
                    var url = "/api/ADD-ECC-SERVICE/addservice/masterdata?context=" + window.btoa(body);
                }

                await fetch(url, {
                    mode: 'cors',
                    method: vmethod,
                    headers: {
                        accept: "*/*"
                    }
                })
                    .then(response => {
                        //const contentType = response.headers.get("content-type");
                        if (response.status >= 200 && response.status <= 299) {
                            return response.text();
                        } else {
                            if (that._idBuzy) {
                                that.byId(that._idBuzy).setBusy(false);
                            }
                            callbackFunctionError(response, that);
                        }
                    })
                    .then(data => {

                        callbackFunctionSucess(data, that);

                    })
                    .catch(err => {
                        if (that._idBuzy)
                            that.byId(that._idBuzy).setBusy(false);

                        callbackFunctionError(err, that);
                    });
            } else {
                var header = {};
                if (window.location.origin === "http://localhost:5001") {
                    var url = "http://localhost:5001/local/api/EMPTY/";
                    header = {
                        "Content-Type": "application/json"
                    }
                } else {
                    var url = "/api/ADD-ECC-SERVICE/addservice/masterdata";
                    header = {
                        "Content-Type": "application/json"
                    }
                }

                await fetch(url, {
                    mode: 'cors',
                    method: "POST",
                    body: body,
                    headers: header
                })
                    .then(response => {
                        //const contentType = response.headers.get("content-type");
                        if (response.status >= 200 && response.status <= 299) {
                            return response.text();
                        } else {
                            if (that._idBuzy) {
                                that.byId(that._idBuzy).setBusy(false);
                            }
                            callbackFunctionError(response, that);
                        }
                    })
                    .then(data => {

                        callbackFunctionSucess(data, that);

                    })
                    .catch(err => {
                        if (that._idBuzy)
                            that.byId(that._idBuzy).setBusy(false);
                        callbackFunctionError(err, that);

                    });
            }

        },
        setBodyNew: function (addinterface, filters, fields, views, table) {
            var body = "";
            var keys = Object.keys(filters);

            switch (addinterface) {
                case "0000000006":
                case "0000000007":
                    var body = '{"INTERFACE":"' + addinterface + '","UNAME":"","SCREEN":{"S_IDEME":[{"SIGN":"I","OPTION":"EQ","LOW":"PIDEMEP","HIGH":""}],"S_INDOC":[{"SIGN":"I","OPTION":"EQ","LOW":"PINDOCP","HIGH":""}]},"SPRAS":"PT"}';
                    body = body.replace("PIDEMEP", fields);
                    body = body.replace("PINDOCP", filters);
                    return body;
                case "0000000008":
                    var body = '{"INTERFACE":"0000000008","UNAME":"","SPRAS":"PT","TDH":PTDHP,"TDI":PTDIP}';
                    body = body.replace("PTDHP", screen);
                    body = body.replace("PTDIP", fields);
                    return body;
                default:
                    var uname = "";
                    var spras = "PT";
                    var sRange = '{"SIGN":"I","OPTION":"EQ","LOW":"PVALUEP","HIGH":""}';
                    var sRangeBT = '{"SIGN":"I","OPTION":"BT","LOW":"PVALUELOWP","HIGH":"PVALUEHIGHP"}';
                    var screenBody = "";
                    var screenFields = [];

                    var bbody = "";
                    if (addinterface === "" || addinterface === null)
                        return body;

                    body = '{"INTERFACE":"' + addinterface + '"';

                    if (uname !== "" && uname !== null) {
                        body = body + ',"UNAME":"' + uname + '"';
                    }

                    if (spras !== "" && spras !== null) {
                        body = body + ',"SPRAS":"' + spras + '"';
                    }

                    if (filters) {
                        screenBody = "";
                        bbody = "";
                        for (var filterKey in filters) {
                            if (filterKey == "STRUC") continue;
                            var value = filters[filterKey];
                            bbody = "";
                            if (value instanceof Array) {
                                if (value.length > 0) {
                                    value.forEach(function (oValue, i) {
                                        if (bbody === "")
                                            bbody = sRange;
                                        else
                                            bbody = bbody + ',' + sRange;
                                        bbody = (oValue.key) ? bbody.replace("PVALUEP", oValue.key) : bbody.replace("PVALUEP", oValue);
                                    });
                                    screenBody = screenBody + '"' + 'S_' + filterKey + '":[' + bbody + '],';
                                    screenFields = screenFields + " " + filterKey + ' IN S_' + filterKey + " AND";
                                }
                            } else {
                                if (filterKey.startsWith('ADDDATE')) {
                                    if (value.LOW && value.HIGH) {
                                        var filterName = filterKey;
                                        var begda = AddUtilities.formatDateToSAP(value.LOW);
                                        var endda = AddUtilities.formatDateToSAP(value.HIGH);
                                        filterName = filterName.replace('ADDDATE', '');
                                        bbody = sRangeBT;
                                        bbody = bbody.replace("PVALUELOWP", begda);
                                        bbody = bbody.replace("PVALUEHIGHP", endda);
                                        screenBody = screenBody + '"' + 'S_' + filterName + '":[' + bbody + '],';
                                        screenFields = screenFields + " " + filterName + ' IN S_' + filterName + " AND";
                                    }
                                } else {
                                    if (value) {
                                        //bbody = sRange;
                                        //bbody = bbody.replace("PVALUEP", value);
                                        //screenBody = screenBody + '"' + 'S_' + filterKey + '":[' + bbody + '],';
                                        screenBody = screenBody + '"' + 'P_' + filterKey + '":"X",';
                                        screenFields = screenFields + " " + filterKey + ' EQ P_' + filterKey + " AND";
                                    }
                                }
                            }
                        }
                        if (screenBody !== "") {
                            screenBody = screenBody.slice(0, -1);
                            body = body + ',"SCREEN":{' + screenBody + '}';
                            screenFields = screenFields.slice(0, -4);
                        }
                    }

                    if (fields instanceof Array && fields.length > 0) {
                        bbody = "";
                        fields.forEach(function (oValue, i) {
                            if (bbody === "")
                                bbody = sRange;
                            else
                                bbody = bbody + ',' + sRange;

                            bbody = bbody.replace("PVALUEP", oValue);
                        });
                        body = body + ',"FIELDS":[' + bbody + ']';
                    }

                    if (views instanceof Map) {
                        bbody = "";
                        views.forEach(function (value, key, map) {
                            bbody = bbody + '"' + key + '":"' + value + '",';
                        });
                        if (bbody !== "") {
                            bbody = bbody.slice(0, -1);
                            body = body + ',"VIEWS":{' + bbody + '}';
                        }
                    }
                    if (addinterface == '0000000004') {
                        body = body + ',"SELECT":{"TABLE": "' + table +
                            '", "FIELDS": "*","WHERE": "' + screenFields + '"}';
                    }
                    body = body + '}';
                    return body;
            }


        },
        setBodyForInterface: function (addinterface, uname, spras, screen, fields, views) {
            //{"INTERFACE":"0000000002","UNAME":"","SCREEN":[{"S_BUKRS":[{"SIGN":"I","OPTION":"EQ","LOW":"0050","HIGH":""}],"S_DTPRC":[{"SIGN":"I","OPTION":"LE","LOW":"20200814","HIGH":""}],"S_PROCX":[{"SIGN":"I","OPTION":"EQ","LOW":"00010","HIGH":""}]}],"FIELDS":[{"SIGN":"I","OPTION":"EQ","LOW":"STATU","HIGH":""}],"VIEWS":{"0100":"X","0102":"X","0200":"X","0201":"X","0400":"X","0401":"X","0402":"X","0403":"X","0112":"X","0113":"","0600":"","0104":"","0105":"","0108":""},"SPRAS":"PT"}
            var body = "";
            switch (addinterface) {
                case "0000000007":
                    var body = '{"INTERFACE":"0000000007","UNAME":"","SCREEN":[{"S_IDEME":[{"SIGN":"I","OPTION":"EQ","LOW":"PIDEMEP","HIGH":""}],"S_INDOC":[{"SIGN":"I","OPTION":"EQ","LOW":"PINDOCP","HIGH":""}]}],"SPRAS":"PT"}';
                    body = body.replace("PIDEMEP", fields);
                    body = body.replace("PINDOCP", screen);
                    return body;
                case "0000000008":
                    var body = '{"INTERFACE":"0000000008","UNAME":"","SPRAS":"PT","TDH":PTDHP,"TDI":PTDIP}';
                    body = body.replace("PTDHP", '"' + screen + '"');
                    body = body.replace("PTDIP", '"' + fields + '"');
                    return body;
                default:

                    var sRange = '{"SIGN":"I","OPTION":"EQ","LOW":"PVALUEP","HIGH":""}';
                    var sRangeBT = '{"SIGN":"I","OPTION":"BT","LOW":"PVALUELOWP","HIGH":"PVALUEHIGHP"}';
                    var screenBody = "";
                    var bbody = "";
                    if (addinterface === "" || addinterface === null)
                        return body;

                    body = '{"INTERFACE":"' + addinterface + '"';

                    if (uname !== "" && uname !== null) {
                        body = body + ',"UNAME":"' + uname + '"';
                    }

                    if (spras !== "" && spras !== null) {
                        body = body + ',"SPRAS":"' + spras + '"';
                    }

                    if (screen instanceof Map) {
                        screenBody = "";
                        bbody = "";

                        screen.forEach(function (value, key, map) {
                            bbody = "";
                            if (value instanceof Array && value.length > 0) {
                                value.forEach(function (oValue, i) {
                                    if (bbody === "")
                                        bbody = sRange;
                                    else
                                        bbody = bbody + ',' + sRange;
                                    bbody = bbody.replace("PVALUEP", oValue);
                                });
                                screenBody = screenBody + '"' + key + '":[' + bbody + '],';
                            } else {
                                if (value instanceof Map) {
                                    value.forEach(function (ovalue, okey, omap) {
                                        if (bbody === "")
                                            bbody = sRangeBT;
                                        else
                                            bbody = bbody + ',' + sRangeBT;
                                        bbody = bbody.replace("PVALUELOWP", okey);
                                        bbody = bbody.replace("PVALUEHIGHP", ovalue);
                                    });
                                    screenBody = screenBody + '"' + key + '":[' + bbody + '],';
                                }

                            }
                        });
                        if (screenBody !== "") {
                            screenBody = screenBody.slice(0, -1);
                            body = body + ',"SCREEN":[{' + screenBody + '}]';
                        }
                    }

                    if (fields instanceof Array && fields.length > 0) {
                        bbody = "";
                        fields.forEach(function (oValue, i) {
                            if (bbody === "")
                                bbody = sRange;
                            else
                                bbody = bbody + ',' + sRange;

                            bbody = bbody.replace("PVALUEP", oValue);
                        });
                        body = body + ',"FIELDS":[' + bbody + ']';
                    }

                    if (views instanceof Map) {
                        bbody = "";
                        views.forEach(function (value, key, map) {
                            bbody = bbody + '"' + key + '":"' + value + '",';
                        });
                        if (bbody !== "") {
                            bbody = bbody.slice(0, -1);
                            body = body + ',"VIEWS":{' + bbody + '}';
                        }
                    }

                    body = body + '}';
                    return body;
            }
        },
        getDefaultViewsMap: function (body) {
            var defViews = new Map();
            defViews.set("0100", "X");
            defViews.set("0102", "X");
            defViews.set("0200", "X");
            defViews.set("0201", "X");
            defViews.set("0400", "X");
            defViews.set("0401", "X");
            defViews.set("0402", "X");
            defViews.set("0403", "X");
            defViews.set("0112", "X");
            defViews.set("0113", "");
            defViews.set("0600", "");
            defViews.set("0104", "");
            defViews.set("0105", "X");
            defViews.set("0107", "X");
            defViews.set("0108", "");

            return defViews;
        }

    };

});