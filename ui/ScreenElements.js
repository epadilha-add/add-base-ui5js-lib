sap.ui.define(
    ["sap/ui/base/Object", "sap/base/Log", "sap/ui/model/json/JSONModel", "../commons/AddModels", "../callService", "sap/ui/richtexteditor/RichTextEditor", "sap/ui/core/Fragment"],
    function (Object, Log, JSONModel, AddModels, callService, RichTextEditor, Fragment) {
        "use strict";
        let MainView = {};
        return Object.extend("ScreenElements", {
            that: null,

            constructor: function (that) {
                MainView = that;
                return this;
            },

            getStruc: function (param, valuesHelp, parameter, uri) {
                if (MainView.fieldcat && !parameter) return new Promise(p => p(MainView.fieldcat));

                let listFields = [];

                if (param.length > 0) {
                    for (const element of param) {
                        let fields = element.field ? element.field.split(".") : element.split(".");

                        if (fields[0]) listFields.push({ CAMPO: fields[0] });

                        if (fields[1]) listFields.push({ CAMPO: fields[1] });
                    }
                } else {
                    let fields = param.field ? param.field.split(".") : param.split(".");

                    if (fields[0]) listFields.push({ CAMPO: fields[0] });

                    if (fields[1]) listFields.push({ CAMPO: fields[1] });
                }

                let req = {
                    COLLECTION: "P0600",
                    PROJECTION: ["CAMPO", "P600A"],
                    FILTER: { $or: listFields },
                    VH: valuesHelp, //values help
                    ...parameter,
                };

                let hostM;
                try {
                    hostM = sap.ui.getCore().getModel("AppConfig").getData().services.memoryStoreHost;
                    if (hostM) {
                        Log.info(hostM, "ScreenELements on MemoryStore");
                    } else {
                        hostM = window.location.origin;
                    }
                } catch {
                    Log.info(hostM, "ScreenELements on ApplicationServer");
                    hostM = window.location.origin;
                }
                return callService.postSync(uri || "add/ui", req, null, null, null, null, hostM);
            },
            getElementScreenByName: async function (param, Screen, parameter) {
                let STRUC = [];
                let valueHelp = true;

                //  Screen.body.setBusy(true);

                return await this.getStruc(param, valueHelp, parameter || true).then(response => {
                    if (typeof response === "string") response = JSON.parse(response);

                    let screenElements = [];
                    let modelName = null;
                    try {
                        param.forEach(field => {
                            //==>keep sequence
                            let fld = field.field.split(".");

                            if (field.foreignKey) fld = fld[0];
                            else fld = fld[1] ? fld[1] : fld[0];

                            response.find(element => {
                                if (fld === element.FIELD) {
                                    if (!parameter || !parameter?.params || !parameter?.params[element.FIELD]) element.VALUES = field?.VALUES;

                                    if (element.VALUES) {
                                        var oModel = new JSONModel(element.VALUES.filter(e => e.ACTIVE || e.ACTIVE === undefined));
                                        modelName = MainView.IDAPP + element.FIELD;
                                        Screen.getView().setModel(oModel, modelName + "PARAM");
                                    } else {
                                        modelName = MainView.IDAPP + "PARAM";
                                    }

                                    if (field.modelPath) {
                                        modelName = field.modelPath;
                                    } else if (!modelName) {
                                        modelName = "/";
                                    }

                                    element.FIELDNAME = element.FIELD;

                                    if (field.propInclude)
                                        element.propInclude = field.propInclude;

                                    if (field.create && !field.foreignKey && field.key === true) element.REFTYPE = ""; //input

                                    STRUC.push(element);
                                    try {
                                        screenElements = this.createElementbyType(element, MainView, modelName, 1);
                                    } catch (error) {
                                        throw field.field;
                                    }
                                }
                            });
                        });
                    } catch (error) {
                        Log.error("error", "ScreenElements", error);
                    }

                    return screenElements;
                });
            },
            set: async function (param, Screen) {
                let valueHelp = true;
                let modelName = null;

                param = param.filter(fld => (fld.showUi === undefined || fld.showUi === true) && (fld.foreignKey === undefined || fld.foreignKey === false));

                return this.getStruc(param, valueHelp).then(response => {
                    if (typeof response === "string") response = JSON.parse(response);

                    try {
                        param.forEach(field => {
                            //==>keep sequence

                            let fld = field.field.split(".");
                            fld = fld[1] ? fld[1] : fld[0];
                            response.find(element => {
                                if (fld === element.FIELD) {
                                    element = { ...element, ...field };

                                    if (element.VALUES || field.RFFLD) {
                                        var oModel = new JSONModel(element.VALUES || []);
                                        oModel.setSizeLimit(500);
                                        modelName = MainView.IDAPP + field.field || element.FIELD;
                                        Screen.setModel(oModel, modelName + "PARAM");
                                    } else {
                                        modelName = MainView.IDAPP + "PARAM";
                                    }

                                    if (field.modelPath) {
                                        modelName = field.modelPath;
                                    }

                                    element.FIELDNAME = field.field || element.FIELD;
                                    element.EDIT = MainView.edit;
                                    element.EDIT = field.key ? false : true;
                                    element.key = field.key;
                                    /**
                                     * caso seja um campo com '.' ref type é sempre input
                                     */
                                    if (field.field.split(".")[1]) {
                                        element.REFTYPE = "";
                                        element.EDIT = false;
                                    }

                                    //STRUC.push(element);
                                    try {
                                        this.createElementbyType(element, MainView, modelName, 2, Screen).forEach(obj => {
                                            if (obj) {
                                                switch (element.REFTYPE) {
                                                    case "RT":
                                                    case "CE":
                                                        Screen.addOtherContent(obj, field.section || field.subSection);
                                                        break;
                                                    default:
                                                        Screen.addContent(obj, field.section || field.subSection);
                                                        break;
                                                }
                                            }
                                        });
                                    } catch (error) {
                                        throw field.field;
                                    }
                                }
                            });
                        });
                    } catch (error) {
                        Log.error("error", "ScreenElements", error);
                    }
                });
            },
            createElementbyType: function (struc, that, modelName, caller, Screen) {
                "user strict";

                var chnd;
                var res = [];

                let txt = struc.SCRTEXT_S || struc.SCRTEXT_M || struc.SCRTEXT_L || struc.DESCR || struc.FIELDNAME;
                let tooltip = struc.FIELDNAME + " " + struc.SCRTEXT_L || struc.SCRTEXT_M || struc.SCRTEXT_S || struc.FIELDNAME;
                let placeholder = struc.SCRTEXT_S || struc.SCRTEXT_M || struc.SCRTEXT_L || struc.FIELDNAME;

                let oLabel = new sap.m.Label({
                    text: txt,
                    labelFor: struc.FIELDNAME,
                    visible: struc.VISIBLE === "X" ? true : true,
                    tooltip: tooltip,
                });

                res.push(oLabel);

                var decimals = 0;
                var maxInt = 0;
                var vType = null;

                if (struc.customField) {
                    /**
                     * aqui podemos implementar um tipo no controller
                     **/
                    let fld = struc.customField(struc, that, modelName, caller, Screen);

                    return fld instanceof Array ? fld : [];
                }

                switch (struc.DATATYPE) {
                    case "CURR":
                    case "DEC":
                        if (struc.FIELDNAME.split(that.IDAPP).pop().substring(0, 2) == "AL") {
                            decimals = 6;
                            maxInt = 9;
                        } else {
                            decimals = 2;
                            maxInt = 15;
                        }
                        break;
                    case "QUAN":
                        vType = "sap.ui.model.type.Integer";
                        decimals = 0;
                        maxInt = 0;
                        break;
                    default:
                        vType = "sap.ui.model.type.String";
                        decimals = 0;
                        maxInt = 10;
                        break;
                }

                switch (struc.EDIT) {
                    case false:
                    /*            res.push(
                                   new sap.m.Text({
                                       //id: Id,
                                       text: struc.REFTYPE !== "LB" ? "{" + that.IDAPP + "PARAM>/" + struc.FIELDNAME + "}" : "{" + modelName + "PARAM>/" + 'DESCR' + "}",
                                       width: "100%",
                                       tooltip: struc.tooltip ? struc.tooltip : "",
                                       wrapping: false,
                                   })
                               ); 

                    break;*/
                    default:
                        //struc.prop => completo { substitui completamente as propriedades }
                        //struc.propInclude => incluir { apenas inclui nóvas propriedades }
                        switch (struc.REFTYPE) {
                            case "LB":
                                struc.LBID = struc.LBID || "id";
                                struc.LBDESCR = struc.LBDESCR || "DESCR";
                                var oItemTemplate = new sap.ui.core.ListItem({
                                    key: "{" + modelName + "PARAM>" + struc.LBID + "}",
                                    text: "{" + modelName + "PARAM>" + struc.LBDESCR + "}",
                                });

                                let prop = struc.prop
                                    ? struc.prop
                                    : {
                                        selectedKey: "{" + that.IDAPP + "PARAM>/" + struc.FIELDNAME.split(".")[0] + "}",
                                        change: struc.change || function () { },
                                        selectionChange: struc.selectionChange || function () { },
                                        editable: (struc.key === undefined) ? true : struc.key ? false : true,
                                        items: {
                                            path: modelName + "PARAM>/",
                                            template: oItemTemplate,
                                        },
                                        ...struc.propInclude,
                                    };

                                res.push(new sap.m.ComboBox(prop));

                                if (struc.defaultValue)
                                    res[1].setSelectedKey(struc.defaultValue);

                                break;

                            case "TA":
                                res.push(new sap.m.TextArea({ rows: 10 }).bindProperty("value", modelName + ">/" + struc.FIELDNAME));

                                break;

                            case "RT":
                                res.push(
                                    new RichTextEditor({
                                        width: "100%",
                                        height: "400px",
                                        showGroupClipboard: true,
                                        showGroupStructure: true,
                                        showGroupFont: true,
                                        showGroupInsert: true,
                                        showGroupLink: true,
                                        showGroupUndo: true,
                                        value: "{" + modelName + ">/" + struc.FIELDNAME + "}",
                                        tooltip: struc.tooltip ? struc.tooltip : "",
                                        ...struc.propInclude,
                                    })
                                );
                                break;
                            case "SI":
                            case "":
                                switch (struc.DATATYPE) {
                                    case "CURR":
                                    case "DEC":
                                    //  case "NUMC":
                                    case "QUAN":
                                        res.push(
                                            new sap.m.Input({
                                                tooltip: struc.tooltip ? struc.tooltip : "",
                                                // wrapping: false, -> incompatível
                                                editable: (struc.key === undefined) ? true : struc.key ? false : true,
                                                value: {
                                                    path: modelName + ">/" + struc.FIELDNAME,
                                                    type: vType,
                                                    /*      formatOptions: {
                                                             maxIntegerDigits: maxInt,
                                                             maxFractionDigits: decimals,
                                                         }, */
                                                },
                                                ...struc.propInclude,
                                            })
                                        );

                                        if (struc.defaultValue) res[1].setValue(struc.defaultValue);

                                        break;

                                    case "DATS":
                                        res.push(
                                            new sap.m.DatePicker({
                                                //id: Id,
                                                tooltip: struc.tooltip ? struc.tooltip : "",
                                                displayFormat: "dd-MM-yyyy",
                                                valueFormat: "yyyyMMdd",
                                                change: struc.submit ? struc.submit : function () { },
                                                enabled: true, //(struc.EDIT) ? true : false,
                                                //   submit: vSubmit,
                                                editable: (struc.key === undefined) ? true : struc.key ? false : true,
                                                value: {
                                                    path: modelName + ">/" + struc.FIELDNAME,
                                                },
                                                ...struc.propInclude,
                                            })
                                        );

                                        break;

                                    default:
                                        if (struc.MASK) {
                                            let params = JSON.parse(struc.MASK);
                                            let mask = params.mask;
                                            delete params.mask;

                                            let roles = new sap.m.MaskInputRule({
                                                ...(params || {
                                                    maskFormatSymbol: "C",
                                                    regex: "[A-Z0-9]",
                                                }),
                                                ...struc.propInclude,
                                            });

                                            res.push(
                                                new sap.m.MaskInput({
                                                    mask: mask,
                                                    editable: (struc.key === undefined) ? true : struc.key ? false : true,
                                                    rules: [roles],
                                                    ...struc.propInclude,
                                                }).bindProperty("value", modelName + ">/" + struc.FIELDNAME)
                                            );
                                        } else {
                                            res.push(
                                                new sap.m.Input({
                                                    editable: (struc.key === undefined) ? true : struc.key ? false : true,
                                                    ...struc.propInclude,
                                                }).bindProperty("value", modelName + ">/" + struc.FIELDNAME)
                                            );
                                        }
                                        break;
                                }

                                break;

                            case "MI":
                                try {
                                    chnd = eval("that.onValueHelpRequested" + struc.FIELDNAME);
                                } catch { }

                                var oTokenTemplate = new sap.m.Token({
                                    key: "{" + that.IDAPP + "FILTERS>key}",
                                    text: "{" + that.IDAPP + "FILTERS>text}",
                                });

                                let sh = function () { };
                                let showVH = false;
                                let fld = struc.FIELDNAME;

                                if (struc.RFTAB && struc.RFTAB.length > 0 && struc.RFFLD.length > 0) {
                                    showVH = true;
                                    that._idBusy = cIdBuzy;
                                    sh = struc.sh
                                        ? struc.sh
                                        : function (oEvent) {
                                            that.ProcessMonitor.sh(oEvent, fld, that, null, value);
                                        };
                                    try {
                                        if (!that.getModel(that.IDAPP + "FILTERS").getModel().oData[struc.FIELDNAME]) that.getModel(that.IDAPP + "FILTERS").getModel().oData[struc.FIELDNAME] = [];
                                    } catch { }
                                }

                                res.push(
                                    new sap.m.MultiInput({
                                        //id: struc.FIELDNAME,
                                        submit: function (oEvent) {
                                            that.screen.elements.__proto__.onSubmit(oEvent, that);
                                        },
                                        required: struc.OBLIGTORY,
                                        placeholder: placeholder,
                                        tooltip: tooltip,
                                        valueHelpRequest: sh,
                                        showValueHelp: showVH,
                                        editable: (struc.key === undefined) ? true : struc.key ? false : true,
                                        tokenUpdate: function (oEvent) {
                                            that.screen.elements.__proto__.onTokenUpdate(oEvent, that);
                                        },
                                        placeholder: placeholder,
                                    }).bindAggregation("tokens", that.IDAPP + "FILTERS>/" + struc.FIELDNAME, oTokenTemplate)
                                );

                                break;

                            case "MC":
                                var oItemTemplate = new sap.ui.core.Item({
                                    key: "{" + modelName + "PARAM>" + "id" + "}",
                                    //text: '{' + modelName + 'PARAM>' + struc.RFFLD + '}:{' + modelName + 'PARAM>DESCR}',
                                    text: "{" + modelName + "PARAM>DESCR}",
                                });

                                res.push(
                                    new sap.m.MultiComboBox({
                                        required: struc.OBLIGTORY,
                                        placeholder: placeholder,
                                        tooltip: tooltip,
                                        selectionChange: struc.selectionChange || function () { },
                                        selectionFinish: struc.selectionFinish || function () { },
                                        editable: (struc.key === undefined) ? true : struc.key ? false : true,
                                        ...struc.propInclude,
                                        items: {
                                            path: modelName + "PARAM>/", // + struc.FIELDNAME,//  struc.SECTION.substring(5, 10),
                                            sorter: "{" + struc.FIELDNAME + "}",
                                            template: oItemTemplate,
                                        },
                                        selectedKeys: {
                                            path: that.IDAPP + "FILTERS>/" + struc.FIELDNAME,
                                        },
                                    })
                                );
                                if (struc.defaultValue)
                                    res[1].setSelectedKeys(struc.defaultValue);

                                if (struc.FOREIGNKEY)
                                    res[1].fireSelectionFinish();
                                break;

                            case "DR":
                                try {
                                    chnd = eval("that.handleChange" + struc.FIELDNAME);
                                } catch { }

                                //let fldDate = 'ADDDATE' + struc.FIELDNAME;
                                let fldDate = struc.FIELDNAME;

                                try {
                                    if (!that.getModel("FILTERS").oData[fldDate]) that.getModel("FILTERS").oData[fldDate] = {};
                                } catch { }
                                res.push(
                                    new sap.m.DateRangeSelection({
                                        // id: struc.FIELDNAME,
                                        change: chnd ? chnd : function () { },
                                        required: struc.OBLIGTORY,
                                        editable: (struc.key === undefined) ? true : struc.key ? false : true,
                                        dateValue: "{" + that.IDAPP + "FILTERS>/" + struc.FIELDNAME + "/LOW}",
                                        secondDateValue: "{" + that.IDAPP + "FILTERS>/" + struc.FIELDNAME + "/HIGH}",
                                        ...struc.propInclude,
                                    })
                                );

                                if (struc.defaultValue) {
                                    res[1].setFrom(
                                        struc.defaultValue[0]
                                    );
                                    res[1].setTo(
                                        struc.defaultValue[1]
                                    );
                                }
                                break;

                            case "CB":
                                res.push(
                                    new sap.m.CheckBox({
                                        editable: (struc.key === undefined) ? true : struc.key ? false : true,
                                        ...struc.propInclude,
                                        selected: "{" + modelName + ">/" + struc.FIELDNAME + "}",
                                    })
                                );

                                if (struc.defaultValue) res[1].setSelected(struc.defaultValue);

                                break;

                            case "TP":
                                res.push(
                                    new sap.m.TimePicker({
                                        //id: struc.FIELDNAME,
                                        tooltip: tooltip,
                                        displayFormat: "hh:mm:ss",
                                        valueFormat: "hhmmss",
                                        enabled: true,
                                        editable: (struc.key === undefined) ? true : struc.key ? false : true,
                                        required: struc.OBLIGTORY,
                                        value: {
                                            path: "FILTERS>/" + struc.FIELDNAME,
                                        },
                                    })
                                );

                                break;
                            case "DP":
                                res.push(
                                    new sap.m.DatePicker({
                                        //id: Id,
                                        tooltip: struc.tooltip ? struc.tooltip : "",
                                        displayFormat: "dd-MM-yyyy",
                                        valueFormat: "yyyyMMdd",
                                        change: struc.submit ? struc.submit : function () { },
                                        enabled: true, //(struc.EDIT) ? true : false,
                                        editable: (struc.key === undefined) ? true : struc.key ? false : true,
                                        //   submit: vSubmit,
                                        value: {
                                            path: modelName + ">/" + struc.FIELDNAME,
                                        },
                                    })
                                );

                                break;
                            case "CE":
                                if (!MainView.codeeditor) return [];

                                let tabs = {};

                                MainView.ceP = new sap.ui.codeeditor.CodeEditor({
                                    height: "600px",
                                    type: "javascript",
                                    colorTheme: "chrome",
                                }).bindProperty("value", modelName + ">/SOURCE");

                                let fcat = MainView.fieldcat.find(f => f.field === struc.FIELDNAME);
                                if (fcat) caller === 1 ? (fcat.idUi5New = MainView.ceP.getId()) : (fcat.idUi5 = MainView.ceP.getId());

                                MainView.View.addOtherContent(MainView.ceP);

                                return [];

                                break;
                            default:
                                Log.info(struc.FIELDNAME, "type (MI,MC,TP,..) no defined");
                                return [];
                        }

                        break;
                }

                res[0].setLabelFor(res[1].getId().toString());

                res[1].REFTYPE = struc.REFTYPE;

                if (struc.CINFO) {
                    res[0].ondblclick = function (oEvent) {
                        if (!this["rp" + res[0].getId()])
                            this["rp" + res[0].getId()] = new sap.m.ResponsivePopover("ResponsivePopover" + res[0].getId(), {
                                contentWidth: "40%",
                                contentHeight: "40%",
                                showHeader: false,
                                content: new sap.ui.core.HTML({
                                    preferDOM: true,
                                    sanitizeContent: false,
                                    content: "<div>" + struc.CINFO + "</div>",
                                }),
                            });

                        this["rp" + res[0].getId()].openBy(res[0]);
                    };
                }

                /**
                 * aqui necessário ter o ID para possíveis valicações
                 */
                let fcat = MainView.fieldcat.find(f => f.field === struc.FIELDNAME);
                if (fcat) caller === 1 ? (fcat.idUi5New = res[1].getId()) : (fcat.idUi5 = res[1].getId());

                return res;
            },
            onSubmitMC: function (oEvent, that, fnChange) {
                if (oEvent.oSource.mProperties.selectedKeys.length > 0) sap.ui.getCore().byId(oEvent.mParameters.id).setValueState(sap.ui.core.ValueState.None);

                fnChange(oEvent, that);
            },

            onSubmit: function (oEvent) {
                var oValue = oEvent.getParameter("value");
                var path = oEvent.getSource().mAggregations.tokenizer.mBindingInfos.tokens.path;
                var oModel = AddModels.model("FILTERS").getModel();

                if (!oModel.getProperty(path)) oModel.setProperty(path, []);

                var oModelObject = oModel.getProperty(path);

                if (oValue) {
                    sap.ui.getCore().byId(oEvent.mParameters.id).setValueState(sap.ui.core.ValueState.None);
                    let splittedInput = oValue.split(";");
                    splittedInput.forEach(function (oItem, index) {
                        if (oItem) {
                            let exists = oModelObject.findIndex(x => x.key == oItem);
                            if (exists === -1) {
                                oEvent.getSource().addToken(new sap.m.Token({ key: oItem, text: oItem }));
                                oModelObject.push({ key: oItem, text: oItem });
                            }
                        }
                    });
                }
                oEvent.getSource().setValue();
                oEvent.getSource().focus();
            },

            onTokenUpdate: function (oEvent) {
                var sType = oEvent.getParameter("type");
                if (sType === "removed") {
                    var path = oEvent.getSource().mAggregations.tokenizer.mBindingInfos.tokens.path;
                    var oModel = AddModels.model("FILTERS").getModel();
                    if (!oModel.getProperty(path)) oModel.setProperty(path, []);
                    var oModelObject = oModel.getProperty(path);
                    var sKey = oEvent.getParameter("removedTokens")[0].getProperty("key");
                    const index = oModelObject.findIndex(x => x.key == sKey);
                    if (index > -1) oModelObject.splice(index, 1);
                }
            },
            obligatoryFieldsValidation(screen) {
                let check;
                let fld;
                let focus;
                let fields = screen.models.model("FILTERS").getModel();

                check = true;

                screen.fields.forEach((f, i) => {
                    try {
                        fld = sap.ui.getCore().byId(f.field);
                        fld.setValueState(sap.ui.core.ValueState.None);

                        if (f.prop.obligatory === true) {
                            if (!fields.oData[f.field] || fields.oData[f.field].length === 0) {
                                check = false;
                                fld.setValueState(sap.ui.core.ValueState.Error);
                                if (focus === undefined) {
                                    focus = i;
                                }
                                return f;
                            } else {
                                fld.setValueState(sap.ui.core.ValueState.None);
                            }
                        }
                    } catch {
                        Log.info("ScreenElements/obligatoryFieldsValidation", f.field);
                    }
                });

                if (focus != undefined) sap.ui.getCore().byId(screen.fields[focus].field).focus();

                return check;
            },
        });
    }
);
