
sap.ui.define([
    "sap/ui/base/Object",
    "sap/base/Log",
    "sap/ui/model/json/JSONModel",
    "../commons/AddModels",
    "../callService"],
    function (Object, Log, JSONModel, AddModels, callService) {
        'use strict';

        return Object.extend("ScreenElements", {

            that: null,

            constructor: function (that) {
                this.that = that;

            },

            getStruc: function (param, valuesHelp) {

                let listFields = [];

                if (param.length > 0) {

                    param.forEach(element => {
                        listFields.push({ "CAMPO": element.field.split('.')[0] || element });
                    });

                } else {
                    listFields.push({ "CAMPO": param.field.split('.')[0] || param });
                }

                let req = {
                    COLLECTION: 'P0600',
                    PROJECTION: ['CAMPO', 'P600A'],
                    FILTER: { "$or": listFields },
                    VH: valuesHelp //values help
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
                return callService.postSync('add/ui', req, null, null, null, null, hostM);

            },
            getElementScreenByName: async function (param, Screen) {

                let STRUC = [];
                let valueHelp = true;

                //  Screen.body.setBusy(true);

                return await this.getStruc(param, valueHelp).then((response) => {

                    response = JSON.parse(response);
                    let screenElements = [];
                    let modelName = null;
                    try {

                        param.forEach((field) => { //==>keep sequence

                            return response.find((element) => {

                                if (field.field.split('.')[0] == element.FIELD) {

                                    //sobrepor configurações 
                                    for (const key in field.prop) {
                                        if (element[key] || element[key] === "")
                                            element[key] = field.prop[key]
                                    }

                                    if (field.prop && field.prop.VALUES) {
                                        element.VALUES = field.prop.VALUES;
                                    }

                                    if (element.VALUES) {
                                        var oModel = new JSONModel(element.VALUES.filter(e => e.ACTIVE || e.ACTIVE === undefined));
                                        modelName = this.that.IDAPP + element.FIELD;
                                        Screen.getView().setModel(oModel, modelName + "PARAM");
                                    } else {
                                        modelName = this.that.IDAPP + "PARAM";
                                    }

                                    if (field.modelPath) {
                                        modelName = field.modelPath;
                                    } else if (!modelName) {
                                        modelName = '/';
                                    }

                                    /* else {
                                        modelName = '/';
                                    } */

                                    if (field.prop && !field.prop.obligatory) {
                                        if (!field.prop)
                                            field.prop = {};
                                        field.prop.obligatory = false;
                                    }

                                    element.OBLIGTORY = (field.prop && field.prop.obligatory) ? field.prop.obligatory : false;

                                    element.FIELDNAME = element.FIELD;
                                    //element.edit = (Screen.that.edit);

                                    STRUC.push(element);

                                    screenElements = this.createElementbyType(
                                        element,
                                        this.that,
                                        modelName)
                                }

                            })

                        })

                    } catch (error) {
                        Log.info("ERROR:-->" + JSON.stringify(error), 'ScreenElements');
                    }

                    return screenElements;

                });



            },
            set: async function (param, Screen) {

                Screen.Page.setBusy(true);

                let STRUC = [];
                let valueHelp = true;
                let modelName = null;

                //  Screen.body.setBusy(true);

                await this.getStruc(param, valueHelp).then((response) => {

                    response = JSON.parse(response);

                    try {

                        param.forEach((field) => { //==>keep sequence

                            response.find((element) => {

                                if (field.field.split('.')[0] == element.FIELD) {

                                    //sobrepor configurações 
                                    for (const key in field.prop) {
                                        if (element[key] || element[key] === "")
                                            element[key] = field.prop[key]
                                    }

                                    if (field.prop && field.prop.VALUES) {
                                        element.VALUES = field.prop.VALUES;
                                    }

                                    if (element.VALUES) {
                                        var oModel = new JSONModel(element.VALUES);
                                        modelName = this.that.IDAPP + field.field || element.FIELD;
                                        Screen.setModel(oModel, modelName + "PARAM");

                                    } else {
                                        modelName = this.that.IDAPP + "PARAM";
                                    }

                                    if (field.modelPath) {
                                        modelName = field.modelPath;
                                    }
                                    if (field.prop && !field.prop.obligatory) {
                                        if (!field.prop)
                                            field.prop = {};
                                        field.prop.obligatory = false;
                                    }

                                    element.OBLIGTORY = (field.prop && field.prop.obligatory) ? field.prop.obligatory : false;
                                    element.FIELDNAME = field.field || element.FIELD;
                                    element.EDIT = Screen.that.edit;
                                    element.EDIT = (field.prop && field.prop.key || field.key) ? false : true;


                                    STRUC.push(element);

                                    this.createElementbyType(
                                        element,
                                        this.that,
                                        modelName).forEach((obj) => {
                                            Screen.addContent(obj);
                                        });

                                    Log.info(element.FIELD, 'ScreenElements');

                                    //field.field = this.that.IDAPP + field.field;
                                }

                            })

                        })

                    } catch (error) {

                        // Screen.setBusy(false);

                        Log.info("ERROR:-->" + JSON.stringify(error), 'ScreenElements');
                    }

                    //Grava estrutura para tela de seleção
                    //this.that.setModel(STRUC, "PARAM");
                    // Screen.body.setBusy(false);

                });

                Screen.Page.setBusy(false);

            },
            createElementbyType: function (struc, that, modelName) {
                'user strict';

                // return [new sap.m.Input()];

                var chnd;
                var tooltip;
                var placeholder;
                var res = [];

                //struc.FIELDNAME = that.IDAPP + struc.FIELDNAME;

                let oLabel = new sap.m.Label({
                    text: struc.DESCR || struc.SCRTEXT_S || struc.SCRTEXT_M || struc.SCRTEXT_L,
                    labelFor: struc.FIELDNAME,
                    visible: ((struc.VISIBLE === 'X') ? true : true),
                    tooltip: struc.FIELDNAME
                });

                res.push(oLabel);

                tooltip = (struc.SCRTEXT_S) ? struc.SCRTEXT_S + ':' + struc.FIELDNAME : struc.SCRTEXT_M + ':' + struc.FIELDNAME;
                placeholder = (struc.SCRTEXT_S) ? struc.SCRTEXT_S : struc.SCRTEXT_M;

                var decimals = 0;
                var maxInt = 0;
                var vType = null;

                switch (struc.DATATYPE) {

                    case "CURR":
                    case "DEC":
                        if (struc.FIELDNAME.split(that.IDAPP).pop().substring(0, 2) == 'AL') {
                            decimals = 6;
                            maxInt = 9;
                        } else {
                            decimals = 2;
                            maxInt = 15;
                        }
                        break;

                    default:
                        vType = 'sap.ui.model.type.String';
                        decimals = 0;
                        maxInt = 10;
                        break;
                }

                switch (struc.EDIT) {
                    case false:

                        res.push(new sap.m.Text({
                            //id: Id,
                            text: (struc.REFTYPE !== 'LB') ? '{' + modelName + '>/' + struc.FIELDNAME + '}' : '{' + that.IDAPP + 'PARAM>/' + struc.FIELDNAME + '}',
                            width: '100%',
                            tooltip: (struc.tooltip) ? struc.tooltip : "",
                            wrapping: false,
                        }))
                        /*            
                                   res.push(new sap.m.Label({
                                       tooltip: (struc.tooltip) ? struc.tooltip : "",
                                       wrapping: false,
                                       text: {
                                           path: modelName + '>/' + struc.FIELDNAME,
                                           //type: vType,
                                           formatOptions: {
                                               maxIntegerDigits: maxInt,
                                               maxFractionDigits: decimals
                                           }
                                       }
                                   })) */

                        break;
                    default:


                        switch (struc.REFTYPE) {

                            case 'LB':
                                struc.LBID = struc.LBID || 'id';
                                struc.LBDESCR = struc.LBDESCR || 'DESCR';
                                var oItemTemplate = new sap.ui.core.ListItem({
                                    key: '{' + modelName + 'PARAM>' + struc.LBID + '}',
                                    text: '{' + modelName + 'PARAM>' + struc.LBDESCR + '}',
                                });

                                res.push(new sap.m.ComboBox({
                                    selectedKey: '{' + that.IDAPP + 'PARAM>/' + struc.FIELDNAME.split('.')[0] + '}',
                                    items: {
                                        path: modelName + 'PARAM>/',
                                        template: oItemTemplate
                                    }
                                }));

                                break;

                            case 'TA':

                                res.push(new sap.m.TextArea({ rows: 10 }).bindProperty("value", modelName + '>/' + struc.FIELDNAME));

                                break;

                            case 'SI':
                            case '':

                                switch (struc.DATATYPE) {
                                    case "CURR":
                                    case "DEC":
                                    //  case "NUMC":
                                    case "QUAN":



                                        res.push(new sap.m.Input({
                                            id: Id,
                                            tooltip: (struc.tooltip) ? struc.tooltip : "",
                                            // wrapping: false, -> incompatível
                                            value: {
                                                path: modelName + '>/' + struc.FIELDNAME,
                                                type: vType,
                                                formatOptions: {
                                                    maxIntegerDigits: maxInt,
                                                    maxFractionDigits: decimals
                                                }
                                            }
                                        }));

                                        break;

                                    case "DATS":

                                        res.push(new sap.m.DatePicker({
                                            //id: Id,
                                            tooltip: (struc.tooltip) ? struc.tooltip : "",
                                            displayFormat: "dd-MM-yyyy",
                                            valueFormat: "yyyyMMdd",
                                            change: (struc.submit) ? struc.submit : function () { },
                                            enabled: true, //(struc.EDIT) ? true : false,
                                            //   submit: vSubmit,
                                            value: {
                                                path: modelName + '>/' + struc.FIELDNAME
                                            }
                                        }));

                                        break;

                                    default:
                                        res.push(new sap.m.Input().bindProperty("value", modelName + '>/' + struc.FIELDNAME));
                                        break;

                                }

                                break;

                            case 'MI':

                                try {
                                    chnd = eval('that.onValueHelpRequested' + struc.FIELDNAME);
                                } catch { }

                                var oTokenTemplate = new sap.m.Token({
                                    key: '{' + that.IDAPP + 'FILTERS>key}',
                                    text: '{' + that.IDAPP + 'FILTERS>text}',
                                });

                                let sh = function () { };
                                let showVH = false;
                                let fld = struc.FIELDNAME;

                                if (struc.RFTAB && struc.RFTAB.length > 0 && struc.RFFLD.length > 0) {
                                    showVH = true;
                                    that._idBusy = cIdBuzy;
                                    sh = (struc.sh) ? struc.sh : function (oEvent) {
                                        that.ProcessMonitor.sh(oEvent, fld, that, null, value);
                                    }
                                    try {
                                        if (!that.getModel(that.IDAPP + 'FILTERS').getModel().oData[struc.FIELDNAME])
                                            that.getModel(that.IDAPP + 'FILTERS').getModel().oData[struc.FIELDNAME] = [];
                                    } catch {

                                    }

                                }

                                res.push(new sap.m.MultiInput({
                                    //id: struc.FIELDNAME,
                                    submit: function (oEvent) { that.screen.elements.__proto__.onSubmit(oEvent, that) },
                                    required: struc.OBLIGTORY,
                                    placeholder: placeholder,
                                    tooltip: tooltip,
                                    valueHelpRequest: sh,
                                    showValueHelp: showVH,
                                    tokenUpdate: function (oEvent) { that.screen.elements.__proto__.onTokenUpdate(oEvent, that) },
                                    placeholder: placeholder
                                }).bindAggregation('tokens', that.IDAPP + 'FILTERS>/' + struc.FIELDNAME, oTokenTemplate));

                                break;

                            case 'MC':

                                var oItemTemplate = new sap.ui.core.Item({
                                    key: '{' + modelName + 'PARAM>' + struc.RFFLD + '}',
                                    text: '{' + modelName + 'PARAM>' + struc.RFFLD + '}:{' + modelName + 'PARAM>DESCR}',
                                });

                                try {
                                    chnd = eval('that.handleSelectionChange' + struc.FIELDNAME);
                                } catch { }

                                res.push(new sap.m.MultiComboBox({
                                    //id: struc.FIELDNAME,

                                    required: struc.OBLIGTORY,
                                    placeholder: placeholder,
                                    tooltip: tooltip,
                                    selectionChange: function (oEvent) { that.screen.elements.__proto__.onSubmitMC(oEvent, that, (chnd) ? chnd : function (oEvent) { }) },
                                    items: {
                                        path: modelName + 'PARAM>/',// + struc.FIELDNAME,//  struc.SECTION.substring(5, 10),
                                        sorter: '{' + struc.FIELDNAME + '}',
                                        template: oItemTemplate
                                    },
                                    selectedKeys: {
                                        path: that.IDAPP + 'FILTERS>/' + struc.FIELDNAME
                                    }
                                }));

                                break;

                            case 'DR':
                                try {
                                    chnd = eval('that.handleChange' + struc.FIELDNAME);
                                } catch { }

                                //let fldDate = 'ADDDATE' + struc.FIELDNAME;
                                let fldDate = struc.FIELDNAME;

                                try {
                                    if (!that.getModel('FILTERS').oData[fldDate])
                                        that.getModel('FILTERS').oData[fldDate] = {};
                                } catch {

                                }
                                res.push(new sap.m.DateRangeSelection({
                                    // id: struc.FIELDNAME,
                                    change: (chnd) ? chnd : function () { },
                                    required: struc.OBLIGTORY,
                                    dateValue: '{' + that.IDAPP + 'FILTERS>/' + struc.FIELDNAME + '/LOW}',
                                    secondDateValue: '{' + that.IDAPP + 'FILTERS>/' + struc.FIELDNAME + '/HIGH}'
                                }));

                                break;

                            case 'CB':

                                res.push(new sap.m.CheckBox({
                                    //id: struc.FIELDNAME, 
                                    selected: '{' + modelName + '>/' + struc.FIELDNAME + '}'
                                }));

                                break;

                            case 'TP':

                                res.push(new sap.m.TimePicker({
                                    //id: struc.FIELDNAME,
                                    tooltip: tooltip,
                                    displayFormat: 'hh:mm:ss',
                                    valueFormat: 'hhmmss',
                                    enabled: true,
                                    required: struc.OBLIGTORY,
                                    value: {
                                        path: 'FILTERS>/' + struc.FIELDNAME
                                    }
                                }));

                                break;

                            default:

                                Log.info(struc.FIELDNAME, "type (MI,MC,TP,..) no defined");
                                return;

                        }

                        break;
                }


                res[0].setLabelFor(res[1].getId().toString());

                res[1].REFTYPE = struc.REFTYPE;

                return res;

            },
            onSubmitMC: function (oEvent, that, fnChange) {

                if (oEvent.oSource.mProperties.selectedKeys.length > 0)
                    sap.ui.getCore().byId(oEvent.mParameters.id).setValueState(sap.ui.core.ValueState.None);

                fnChange(oEvent, that);
            },


            onSubmit: function (oEvent) {

                var oValue = oEvent.getParameter("value");
                var path = oEvent.getSource().mAggregations.tokenizer.mBindingInfos.tokens.path;
                var oModel = AddModels.model("FILTERS").getModel()

                if (!oModel.getProperty(path))
                    oModel.setProperty(path, []);

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
                    var oModel = AddModels.model("FILTERS").getModel()
                    if (!oModel.getProperty(path))
                        oModel.setProperty(path, []);
                    var oModelObject = oModel.getProperty(path);
                    var sKey = oEvent.getParameter("removedTokens")[0].getProperty("key");
                    const index = oModelObject.findIndex(x => x.key == sKey);
                    if (index > -1)
                        oModelObject.splice(index, 1);
                }
            },
            obligatoryFieldsValidation(screen) {

                let check;
                let fld;
                let focus;
                let fields = screen.models.model('FILTERS').getModel();

                check = true;

                screen.fields.forEach((f, i) => {

                    try {


                        fld = sap.ui.getCore().byId(f.field)
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
                        Log.info("ScreenElements/obligatoryFieldsValidation", f.field)
                    }
                })

                if (focus != undefined)
                    sap.ui.getCore().byId(screen.fields[focus].field).focus();

                return check;
            }

        });
    });