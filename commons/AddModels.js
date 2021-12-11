sap.ui.define(["sap/m/MessageToast", "sap/ui/model/json/JSONModel"], function (MessageToast, JSONModel) {
    "use strict";

    var That = null;
    var fModel = {};

    return {

        IDAPP: null,

        constructor: function (that, idAPP) {

            this.IDAPP = idAPP;
            That = that;
            fModel.setModel = setModel;
            fModel.getModel = getModel;


            function setModel(model, modelN) {

                if (model && !model.oData) {
                    model = new JSONModel(model);
                }
                if (That) {
                    That.getView().setModel(model, fModel.modelName);
                } else {
                    sap.ui.getCore().setModel(model, fModel.modelName);
                }
            }

            function getModel(modelN, callBack) {

                let oModel;

                if (That) {
                    oModel = That.getView().getModel(fModel.modelName);
                }

                if (!oModel) {
                    oModel = sap.ui.getCore().getModel(fModel.modelName);
                }

                if (oModel && callBack) {
                    callBack(oModel);
                }

                if (!callBack && oModel) {
                    return oModel;
                }

                if (!oModel) {

                    //return oModel = _selectModelIndexDb(modelName, callBack);
                }

            }
            function _selectModelIndexDb(modelName, callBack) {

                if (!window.indexedDB) return;

                let idb = window.indexedDB.open('addLocalModel' + modelName, 1);

                idb.onupgradeneeded = e => {
                    let conn = e.target.result
                    if (conn != undefined) {
                        conn.createObjectStore(modelName, { keyPath: 'key' })
                    }
                }

                idb.onsuccess = e => {
                    let conn = e.target.result;
                    let transaction = conn.transaction([modelName], 'readwrite');
                    let store = transaction.objectStore(modelName);

                    let requestKeys = store.getAllKeys();
                    requestKeys.onsuccess = function () {

                        let request = store.getAll();

                        request.onsuccess = e => {
                            request.result.map((item, i) => {
                                return new JSONModel(item.value);
                            });
                        }
                        request.onerror = e => {
                            alert(e.target.error);
                        }
                    }
                    requestKeys.onerror = e => {
                        alert(e.target.error);
                    }

                }
                idb.onerror = e => {
                    console.log(e);
                    alert(e.target.error);
                }
            }

            async function _saveModelIndexDb(data, modelName) {
                return new Promise((resolve, reject) => {
                    let idb = window.indexedDB.open('addLocalModel' + modelName, 1);

                    idb.onupgradeneeded = e => {
                        let conn = e.target.result
                        if (conn != undefined) {
                            conn.createObjectStore(modelName, { keyPath: 'key' })
                        }
                    }

                    idb.onsuccess = e => {
                        let conn = e.target.result;
                        let transaction = conn.transaction([modelName], 'readwrite');
                        let store = transaction.objectStore(modelName);
                        let request = store.put({ key: 1, value: data });

                        request.onsuccess = e => {
                            resolve(true);
                        }
                        request.onerror = e => {
                            reject(e.target.error)
                        }
                    }
                    idb.onerror = e => {
                        reject(e.target.error)
                    }
                });
            }
        },
        getI18n: function (textID) {
            return That.getView().getModel("i18n").getResourceBundle().getText(textID) + " ";
        },
        model: function (modelName) {

            fModel.modelName = this.IDAPP + modelName;
            return fModel;

        },
        getName(modelName) {
            return this.IDAPP + modelName;
        },
        _getModel: async function (modelName) {

            let p = new Promise((resolve, reject) => {

                let idb = window.indexedDB.open('addLocalModel' + modelName, 1);

                idb.onupgradeneeded = e => {
                    let conn = e.target.result
                    if (conn != undefined) {
                        conn.createObjectStore(modelName, { keyPath: 'key' })
                    }
                }

                idb.onsuccess = e => {
                    let conn = e.target.result;
                    let transaction = conn.transaction([modelName], 'readwrite');
                    let store = transaction.objectStore(modelName);

                    let requestKeys = store.getAllKeys();
                    requestKeys.onsuccess = function () {

                        let request = store.getAll();

                        request.onsuccess = e => {
                            request.result.map((item, i) => {
                                return new JSONModel(item.value);
                            });
                        }
                        request.onerror = e => {
                            alert(e.target.error);
                        }
                    }
                    requestKeys.onerror = e => {
                        alert(e.target.error);
                    }

                }
                idb.onerror = e => {
                    console.log(e);
                    alert(e.target.error);
                }
            });

            return await p;

        },
        buildQueryFromModel(parameters) {

            if (!parameters.COLLECTION || !parameters.PROJECTION) {
                MessageToast.show(getI18n("noParameters"));
                return;
            }

            let FILTER = {};
            let lname;
            let filters = this.model("FILTERS").getModel().oData;
            let STRUC = this.model("PARAM").getModel().oData;

            //  FILTER.$and = [];
            // FILTER.$and[0] = { $or: [] };

            parameters.that.fields.forEach((element) => {

                if (!filters[element.field]) { return; }

                // FILTER.$or.push({});

                let count = 1;

                lname = element.field.split(parameters.that.IDAPP).pop();

                const type = STRUC.find((fld) => {
                    if (fld.FIELDNAME == element.field) {
                        return fld;
                    }
                }).REFTYPE;

                switch (type) {

                    case 'LB':
                    case 'MC':
                        if (filters[element.field].length > 0) {
                            FILTER[lname] = { $in: [] };
                            for (const key of filters[element.field]) {
                                if ([lname].length > 0 && key)
                                    FILTER[lname].$in.push(key);
                            }
                        }

                        break;
                    case 'MI':
                        if (filters[element.field].length > 0) {
                            FILTER[lname] = { $in: [] };
                            for (const key of filters[element.field]) {
                                if ([lname].length > 0 && key.key)
                                    FILTER[lname].$in.push(key.key);
                            }
                        }
                        break;
                    case 'CB':
                        // for (const key of filters[element.field]) {
                        FILTER[lname] = (filters[element.field] === true) ? "X" : "";
                        // }
                        break;
                    case 'DR':
                        FILTER[lname] = {
                            $gte: sap.ui.core.format.DateFormat.getDateInstance({
                                pattern: "YYYYMMdd"
                            }).format(filters[element.field].LOW),
                            $lte: sap.ui.core.format.DateFormat.getDateInstance({
                                pattern: "YYYYMMdd"
                            }).format(filters[element.field].HIGH)
                        }
                        break;
                    default:

                        break;

                }
            });

            return {
                "COLLECTION": parameters.COLLECTION,
                "PROJECTION": parameters.PROJECTION,
                FILTER
            }
        }
    }
});