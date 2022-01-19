sap.ui.define([], function () {


    var _otable;
    var _oDialog
    var That;

    return {

        _oDialog: null,

        openDialogToSave: function (that, view, type, content) {

            That = this;

            return new Promise((resolve, reject) => {

                that.models.model('variant').setModel(new sap.ui.model.json.JSONModel({ "name": "" }).setSizeLimit(1000));

                _oDialog = new sap.m.Dialog({
                    title: that.models.getI18n("saveLocalVariant"),
                    content: new sap.m.VBox({
                        items: [
                            new sap.m.Label({ text: that.models.getI18n("variantName") }),
                            new sap.m.Input({
                                value: "{" + that.models.IDAPP + "variant>/name}"
                            })
                        ]
                    }),
                    beginButton: new sap.m.Button({
                        type: sap.m.ButtonType.Emphasized,
                        text: that.models.getI18n("save"),
                        press: function () {
                            var variant = that.models.model('variant').getModel('variant').oData;
                            let obj = {
                                "view": view,
                                "type": type,
                                "name": variant.name,
                                "date": new Date(),
                                "content": content
                            }

                            That._saveLocalVariants(obj, that)
                                .then(persisted => {

                                    that.toolbar.mAggregations.content.find((bt) => {
                                        if (bt.mProperties.text + " " == that.models.getI18n("variants")) {
                                            return bt;
                                        }
                                    }).setVisible(true);

                                    resolve(persisted);
                                })
                                .catch(err => {
                                    reject(err);
                                })
                            _oDialog.close();
                            _oDialog.destroy();
                        }.bind(that)
                    }),
                    endButton: new sap.m.Button({
                        text: that.models.getI18n("cancel"),
                        press: function () {
                            resolve(false);
                            _oDialog.close();
                            _oDialog.destroy();
                        }.bind(that)
                    })
                });
                _oDialog.addStyleClass("sapUiContentPadding")
                that.that.getView().addDependent(_oDialog);
                _oDialog.open();
            });
        },

        openDialogToList: function (that, view, type) {

            That = this;

            return new Promise((resolve, reject) => {

                That._listLocalVariants(view, type, that)
                    .then(data => {

                        that.models.model('variants').setModel(data);

                        var oTable = new sap.m.Table({
                            mode: sap.m.ListMode.SingleSelectMaster,
                            fixedLayout: false,
                            itemPress: function (e) {
                                var item = e.getSource().getSelectedItem();
                                var idx = item.getBindingContextPath();
                                idx = idx.replaceAll('/', '');
                                var variants = that.models.model('variants').getModel().oData;
                                resolve(variants[idx].content);
                                _oDialog.close();
                                _oDialog.destroy();
                            }
                        })
                        oTable.addColumn(new sap.m.Column({ header: new sap.m.Label({ text: "Name" }) }));
                        oTable.addColumn(new sap.m.Column({ header: new sap.m.Label({ text: "Date" }) }));
                        oTable.addColumn(new sap.m.Column({ header: new sap.m.Label({ text: "" }) }));

                        var colItems = new sap.m.ColumnListItem({ type: "Active" });
                        colItems.addCell(new sap.m.Text({ text: "{" + that.models.IDAPP + "variants>name}", width: "200px" }));
                        colItems.addCell(new sap.m.Text({ text: "{" + that.models.IDAPP + "variants>dateView}", width: "200px" }));
                        colItems.addCell(new sap.ui.core.Icon({
                            src: "sap-icon://delete",
                            width: "30px",
                            press: function (e) {
                                let idx = e.getSource().getId().split("-")[2];

                                let itens = that.models.model('variants').getModel().oData;

                                That._deleteVariant(itens[idx].key, that)
                                    .then(deleted => {
                                        if (deleted) {
                                            const newitens = itens.filter((elem, i) => i !== parseInt(idx));


                                            if (newitens.length === 0) {
                                                that.toolbar.mAggregations.content.find((bt) => {
                                                    if (bt.mProperties.text + " " == that.models.getI18n("variants")) {
                                                        _oDialog.close();
                                                        return bt;
                                                    }
                                                }).setVisible(false);
                                            }

                                            that.models.model('variants').setModel(newitens);
                                            ;
                                        }
                                    })
                                    .catch(err => {
                                        console.log("delete item error. ", err);
                                    });
                            }
                        }));
                        oTable.bindAggregation("items", that.models.IDAPP + "variants>/", colItems);

                        _oDialog = new sap.m.Dialog({
                            title: that.models.getI18n("selectVariant"),
                            content: new sap.m.VBox({
                                items: [
                                    oTable
                                ]
                            }),
                            endButton: new sap.m.Button({
                                text: that.models.getI18n("cancel"),
                                press: function () {
                                    resolve(null)
                                    _oDialog.close();
                                    _oDialog.destroy();
                                }.bind(that)
                            })
                        });
                        //that.oVariantDialog.addStyleClass("sapUiContentPadding")
                        that.that.getView().addDependent(_oDialog);
                        _oDialog.open();
                    })
                    .catch(err => {
                        console.log(err);
                        reject(err);
                    });
            });
        },
        getLastUsedVariant: async function (view, type, that) {
            That = this;
            return new Promise((resolve, reject) => {

                That._listLocalVariants(view, type, that)
                    .then(data => {
                        resolve(data[0])
                    })
                    .catch(err => {
                        console.log(err);
                        reject(err);
                    });
            });
        },

        getLastUsedVariantMatch: function (view, type, match, that) {
            return new Promise((resolve, reject) => {

                That._listLocalVariants(view, type, that)
                    .then(data => {
                        if (!match) {
                            resolve(data[0])
                        } else {
                            resolve(data.find(e => {
                                if (e.name === match.value) {
                                    return e;
                                }
                            }));
                        }
                    })
                    .catch(err => {
                        console.log(err);
                        reject(err);
                    });
            });
        },

        _saveLocalVariants: function (data, that) {
            return new Promise((resolve, reject) => {
                let idb = window.indexedDB.open(that.models.IDAPP + 'addLocalData', 1);

                idb.onupgradeneeded = e => {
                    let conn = e.target.result
                    if (conn != undefined) {
                        conn.createObjectStore('variants', { autoIncrement: true })
                    }
                }

                idb.onsuccess = e => {
                    let conn = e.target.result;
                    let transaction = conn.transaction(['variants'], 'readwrite');
                    let store = transaction.objectStore('variants');
                    let request = store.add(data);

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
        },

        _listLocalVariants: function (view, type, that) {
            let That = this;
            return new Promise((resolve, reject) => {
                let idb = window.indexedDB.open(that.models.IDAPP + 'addLocalData', 1);

                idb.onupgradeneeded = e => {
                    let conn = e.target.result
                    if (conn != undefined) {
                        conn.createObjectStore('variants', { autoIncrement: true })
                    }
                }

                idb.onsuccess = e => {
                    let conn = e.target.result;
                    let transaction = conn.transaction(['variants'], 'readwrite');
                    let store = transaction.objectStore('variants');

                    let requestKeys = store.getAllKeys();
                    requestKeys.onsuccess = function () {
                        let keys = requestKeys.result;

                        let request = store.getAll();
                        request.onsuccess = e => {
                            let itens = request.result.map((item, i) => {
                                item.key = keys[i];
                                item.dateView = That.DateHelper.datefullToText(item.date);
                                return item;
                            });
                            let filtered = itens.filter(data => data.view == view && data.type == type);
                            let sorted = filtered.slice().sort(function (a, b) {
                                return new Date(b.date) - new Date(a.date);
                            });
                            resolve(sorted);
                        }

                        request.onerror = e => {
                            reject(e.target.error)
                        }
                    }
                    requestKeys.onerror = e => {
                        reject(e.target.error)
                    }

                }
                idb.onerror = e => {
                    console.log(e);
                    reject(e.target.error)
                }
            });

        },
        _deleteVariant: function (idx, that) {
            return new Promise((resolve, reject) => {
                let idb = window.indexedDB.open(that.models.IDAPP + 'addLocalData', 1);

                idb.onupgradeneeded = e => {
                    let conn = e.target.result
                    if (conn != undefined) {
                        conn.createObjectStore('variants', { autoIncrement: true })
                    }
                }

                idb.onsuccess = e => {
                    let conn = e.target.result;
                    let transaction = conn.transaction(['variants'], 'readwrite');
                    let store = transaction.objectStore('variants');

                    let request = store.delete(idx);
                    request.onsuccess = e => {
                        resolve(true);
                    }
                    request.onerror = e => {
                        reject(e.target.error)
                    }
                }
                idb.onerror = e => {
                    console.log(e);
                    reject(false)
                }
            });

        },


        TableLayoutHelper: {


            tableHelper: null,

            openDialog(that, tablestruct) {

                return new Promise((resolve, reject) => {

                    let struc = tablestruct.map((item, i) => {
                        let desc = (item.SCRTEXT_M) ? item.SCRTEXT_M : (item.SCRTEXT_S) ? item.SCRTEXT_S : item.SCRTEXT_L;
                        item.index = i;
                        item.visible = (item.VISIBLE == "X") ? true : false;
                        item.description = (desc) ? item.FIELDNAME.split(that.models.IDAPP).pop() + " - " + desc : item.FIELDNAME.split(that.models.IDAPP).pop();
                        return item;
                    })

                    var oModel = new sap.ui.model.json.JSONModel(struc);
                    oModel.setSizeLimit(1000);

                    var oPanel = new sap.m.P13nColumnsPanel({
                        /*     changeColumnsItems: function(e){
                                 var items = e.getParameter("items")
                                 console.log("changeColumnsItems",items)
                             }
                         */
                    });
                    oPanel.bindAggregation("items", {
                        path: "" + that.models.IDAPP + "tablestruct>/",
                        template: new sap.m.P13nItem({
                            columnKey: "{" + that.models.IDAPP + "tablestruct>FIELDNAME}",
                            text: "{" + that.models.IDAPP + "tablestruct>description}",
                        })
                    })

                    oPanel.bindAggregation("columnsItems", {
                        path: "" + that.models.IDAPP + "tablestruct>/",
                        template: new sap.m.P13nColumnsItem({
                            columnKey: "{" + that.models.IDAPP + "tablestruct>FIELDNAME}",
                            index: "{" + that.models.IDAPP + "tablestruct>index}",
                            visible: "{" + that.models.IDAPP + "tablestruct>visible}"
                        })
                    })

                    this._oDialog = new sap.m.P13nDialog({
                        showReset: false,
                        panels: oPanel,
                        reset: function () { alert("olá") },
                        ok: function (e) {

                            var struc = e.getSource().getModel(that.models.IDAPP + 'tablestruct').getProperty('/');

                            var strucClone = [...struc];

                            var strucSorted = strucClone.sort((a, b) => {
                                if (a.index === undefined) {
                                    return 0
                                }
                                if (b.index === undefined) {
                                    return -1
                                }
                                return a.index - b.index
                            });

                            var strucSMapped = strucSorted.map((item, i) => {
                                item.VISIBLE = (item.visible) ? "X" : "";
                                item.COL_POS = (i + 1)
                                delete item.description
                                delete item.index
                                delete item.visible

                                return item;
                            });

                            resolve(strucSMapped);

                            e.getSource().close();
                            e.getSource().destroy();
                        },
                        cancel: function (e) {
                            resolve(null);
                            e.getSource().close();
                            e.getSource().destroy();
                        }
                    });

                    this._oDialog.setModel(oModel, that.models.IDAPP + "tablestruct")
                    this._oDialog.setContentWidth("500px")
                    that.that.getView().addDependent(this._oDialog);
                    this._oDialog.open();
                });
            }
        },

        FilterLayoutHelper: {


            openDialog(that, filterstruct) {

                return new Promise((resolve, reject) => {
                    filterstruct = filterstruct.map(el => {
                        el.SCRected = (el.VISIBLE === 'X') ? true : false;
                        el.sectionID = el.SECTION.substring(0, 1);
                        el.sectionName = that.getView().getModel("i18n").getResourceBundle().getText("SECTION_" + el.sectionID);
                        return el;
                    });

                    that.models.model('filterstruct').setModel(new sap.ui.model.json.JSONModel(filterstruct));

                    var oTable = new sap.m.Table({
                        mode: sap.m.ListMode.MultiSelect,
                        fixedLayout: false,
                        columns: [
                            new sap.m.Column({ header: new sap.m.Label({ text: "Nome" }) }),
                            new sap.m.Column({ header: new sap.m.Label({ text: "Descrição" }) })
                        ],
                        items: {
                            path: that.models.IDAPP + 'filterstruct>/',
                            sorter: new sap.ui.model.Sorter({
                                path: 'sectionName',
                                group: true
                            }),
                            template: new sap.m.ColumnListItem({
                                selected: "{" + that.models.IDAPP + "filterstruct>selected}",
                                cells: [
                                    new sap.m.Text({ text: "{" + that.models.IDAPP + "filterstruct>FIELDNAME}", width: "100px" }),
                                    new sap.m.Text({ text: "{" + that.models.IDAPP + "filterstruct>SELTEXT_L}", width: "300px" })
                                ]
                            })
                        }
                    })

                    FilterLayoutHelper._oDialog = new sap.m.Dialog({
                        title: "Campos de seleção visíveis",
                        content: new sap.m.VBox({
                            items: [
                                oTable
                            ]
                        }),
                        endButton: new sap.m.Button({
                            text: "Ok",
                            press: function () {
                                var struct = that.models.model('filterstruct').getModel().oData; //that.getView().getModel("filterstruct").oData;

                                var strucClone = [...struct];

                                var strucSMapped = strucClone.map((item, i) => {
                                    item.VISIBLE = (item.SCRected) ? "X" : "";
                                    delete item.SCRected
                                    return item;
                                });

                                console.log('STRUCT SELECTED', strucSMapped);
                                resolve(strucSMapped);
                                FilterLayoutHelper._oDialog.close();
                                FilterLayoutHelper._oDialog.destroy();
                            }.bind(that)
                        })
                    });

                    //that.oVariantDialog.addStyleClass("sapUiContentPadding")
                    that.getView().addDependent(FilterLayoutHelper._oDialog);
                    FilterLayoutHelper._oDialog.open();
                });
            }
        },
        DateHelper: {

            textToDate(texto) {
                if (!/\d{4}-\d{2}-\d{2}/.test(texto)) {
                    throw new Error('Data formato errado. Correto é yyyy-MM-dd');
                }
                return new Date(texto.split('-'));
            },
            dateToText(date) {
                return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
            },
            textfullToDate(texto) {
                if (texto === undefined) {
                    return '';
                }
                return new Date(texto);
            },
            datefullToText(date) {
                if (date === undefined || date === null || date === '') {
                    return '';
                }
                return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
            },
            calculateDifferenceText(begin, end) {
                if (end === undefined || end === null || end === '') {
                    end = new Date();
                }
                let diff = (end - begin) / 1000;
                if (diff <= 60) {
                    return diff.toFixed(0) + ' s';
                } else if (diff > 60 && diff < 3600) {
                    return (diff / 60).toFixed(0) + ' m';
                } else if (diff >= 3600 && diff < 86400) {
                    return (diff / 60 / 60).toFixed(0) + ' h';
                } else {
                    return (diff / 60 / 60 / 24).toFixed(0) + ' d';
                }
            }
        }

    }
});