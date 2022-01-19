
sap.ui.define([
    "sap/ui/base/Object",
    "sap/base/Log",
    "sap/ui/model/json/JSONModel",
    "../commons/AddModels",
    "../commons/callService"],
    function (Object, Log, JSONModel, AddModels, callService) {
        'use strict';

        return Object.extend("ScreenElements", {

            that: null,

            constuctor: function (that) {
                this.that = that;

            },

            getStruc: function (param, valuesHelp) {

                let listFields = [];

                if (param.length > 0) {

                    param.forEach(element => {
                        listFields.push({ "CAMPO": element.field || element });
                    });

                } else {
                    listFields.push({ "CAMPO": param.field || param });
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
                return callService.postSync('add/tax/ui', req, null, null, null, null, hostM);

            },
            set: async function (param, Screen) {

                let STRUC = [];
                let valueHelp = true;

                Screen.body.setBusy(true);

                this.getStruc(param, valueHelp).then((response) => {

                    response = JSON.parse(response);

                    try {

                        param.forEach((field) => { //==>keep sequence

                            response.find((element) => {

                                if (field.field == element.CAMPO) {

                                    if (element.VALUES) {

                                        var oModel = new JSONModel(element.VALUES);
                                        Screen.that.models.model(element.CAMPO + "PARAM").setModel(oModel)
                                    }

                                    if (!field.prop.obligatory) {
                                        field.prop = { obligatory: false }
                                    }

                                    element.P600A.OBLIGTORY = field.prop.obligatory || false;
                                    element.P600A.FIELDNAME = element.CAMPO;

                                    STRUC.push(element.P600A);

                                    this.createElementbyType(
                                        element.P600A,
                                        Screen.that,
                                        Screen.that.models.IDAPP + element.CAMPO).forEach(Screen.addContent);

                                    Log.info(element.CAMPO, 'ScreenElements');

                                    field.field = Screen.that.models.IDAPP + field.field;
                                }

                            })

                        })

                    } catch (error) {

                        Screen.body.setBusy(false);

                        Log.info("ERROR:-->" + JSON.stringify(error), 'ScreenElements');
                    }

                    //Grava estrutura para tela de seleção
                    AddModels.model("PARAM").setModel(STRUC);

                    Screen.body.setBusy(false);

                });

            },
            createElementbyType: function (struc, that, modelName) {
                'user strict';

                var chnd;
                var tooltip;
                var placeholder;
                var res = [];

                struc.FIELDNAME = that.models.IDAPP + struc.FIELDNAME;

                let oLabel = new sap.m.Label({ id: 'lbl_' + struc.FIELDNAME, text: (struc.FIELDNAME == "FNSH" || struc.FIELDNAME == "STOP") ? '{i18n>' + struc.FIELDNAME + '_text}' : (struc.SCRTEXT_M) ? struc.SCRTEXT_M : (struc.SCRTEXT_L) ? struc.SCRTEXT_L : struc.SCRTEXT_S, labelFor: struc.FIELDNAME, visible: ((struc.VISIBLE === 'X') ? true : true) });

                res.push(oLabel);

                tooltip = (struc.SCRTEXT_S) ? struc.SCRTEXT_S + ':' + struc.FIELDNAME : struc.SCRTEXT_M + ':' + struc.FIELDNAME;
                placeholder = (struc.SCRTEXT_S) ? struc.SCRTEXT_S : struc.SCRTEXT_M;

                switch (struc.REFTYPE) {

                    case 'LB':
                    //list box
                    case '':
                    case 'MI':

                        try {
                            chnd = eval('that.onValueHelpRequested' + struc.FIELDNAME);
                        } catch { }

                        var oTokenTemplate = new sap.m.Token({
                            key: '{' + that.models.IDAPP + 'FILTERS>key}',
                            text: '{' + that.models.IDAPP + 'FILTERS>text}',
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
                                if (!that.models.model(that.models.IDAPP + 'FILTERS').getModel().oData[struc.FIELDNAME])
                                    that.models.model(that.models.IDAPP + 'FILTERS').getModel().oData[struc.FIELDNAME] = [];
                            } catch {

                            }

                        }

                        res.push(new sap.m.MultiInput({
                            id: struc.FIELDNAME,
                            submit: function (oEvent) { that.screen.elements.__proto__.onSubmit(oEvent, that) },
                            required: struc.OBLIGTORY,
                            placeholder: placeholder,
                            tooltip: tooltip,
                            valueHelpRequest: sh,
                            showValueHelp: showVH,
                            tokenUpdate: function (oEvent) { that.screen.elements.__proto__.onTokenUpdate(oEvent, that) },
                            placeholder: placeholder
                        }).bindAggregation('tokens', that.models.IDAPP + 'FILTERS>/' + struc.FIELDNAME, oTokenTemplate));

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
                            id: struc.FIELDNAME,

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
                                path: that.models.IDAPP + 'FILTERS>/' + struc.FIELDNAME
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
                            if (!that.models.model('FILTERS').getModel().oData[fldDate])
                                that.models.model('FILTERS').getModel().oData[fldDate] = {};
                        } catch {

                        }
                        res.push(new sap.m.DateRangeSelection({
                            id: struc.FIELDNAME,
                            change: (chnd) ? chnd : function () { },
                            required: struc.OBLIGTORY,
                            dateValue: '{' + that.models.IDAPP + 'FILTERS>/' + struc.FIELDNAME + '/LOW}',
                            secondDateValue: '{' + that.models.IDAPP + 'FILTERS>/' + struc.FIELDNAME + '/HIGH}'
                        }));

                        break;

                    case 'CB':

                        res.push(new sap.m.CheckBox({ id: struc.FIELDNAME, selected: '{' + that.models.IDAPP + 'FILTERS>/' + struc.FIELDNAME + '}' }));

                        break;

                    case 'TP':

                        res.push(new sap.m.TimePicker({
                            id: struc.FIELDNAME,
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

                res[0].setLabelFor(res[1].getId().toString());

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