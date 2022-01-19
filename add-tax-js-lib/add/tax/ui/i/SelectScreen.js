sap.ui.define(
    ["sap/ui/base/Object",
        "sap/m/MessageToast",
        "sap/ui/layout/form/SimpleForm",
        "../../commons/Helpers",
        "sap/ui/model/json/JSONModel",
        "../ScreenElements"], function (Object, MessageToast, SimpleForm, Helpers, JSONModel, ScreenElements) {
            "use strict";

            var vForm = null;
            var This;


            return Object.extend("add.tax.ui.i.SelectScreen", {

                that: null,
                view: null,
                elements: null,
                body: null,
                constructor: function (that) {
                    this.that = that;
                    this.view = that.that.getView().sViewName;
                    this.elements = new ScreenElements(this);
                    This = this;
                },
                createElements(fields, screen) {
                    this.elements.set(fields, screen);
                },
                addContent: function (e) {
                    This.body.getContent()[0].addContent(e);
                },
                create(id, parameters) {

                    vForm = new SimpleForm(id || null, {
                        editable: true,
                        toolbar: null || parameters.toolbar,
                        // footer: parameters.footer,
                        editable: true,
                        layout: "ResponsiveGridLayout",
                        labelSpanXL: 4,
                        labelSpanL: 3,
                        labelSpanM: 4,
                        labelSpanS: 12,
                        adjustLabelSpan: true,
                        emptySpanXL: 0,
                        emptySpanL: 4,
                        emptySpanM: 0,
                        emptySpanS: 0,
                        columnsXL: 2,
                        columnsL: 1,
                        columnsM: 1,
                        singleContainerFullSize: false
                    });

                    this.body = new sap.m.Page({
                        showHeader: false, content: vForm, footer: this.that.footer
                    });

                    return this.body;

                    this.body = vForm;

                    return vForm;

                },
                openDialogToSave: function () {

                    let filters = this.that.models.model("FILTERS").getModel();

                    if (!filters) {
                        MessageToast.show(this.that.models.getI18n("emptyFields"));
                        return;
                    }

                    Helpers.openDialogToSave(this.that, this.view, 'filter', filters.oData);
                },
                getDefaultToolBarButtons: function (parameters) {

                    let content = [];

                    if (!parameters.execute || (parameters.execute && parameters.execute == true)) {
                        try {
                            content.push(new sap.m.Button(
                                {
                                    icon: "sap-icon://process",
                                    text: "{i18n>execute}",
                                    press: this.that.execute
                                }));

                        } catch (err) {
                            MessageToast.show("MethodNotFound: execute + " + err.toString())
                        }
                    }


                    if (!parameters.scheduler || (parameters.scheduler && parameters.scheduler == true)) {
                        try {
                            content.push(new sap.m.Button(
                                {
                                    icon: "sap-icon://date-time",
                                    text: "{i18n>plan}",
                                    press: this.that.scheduler
                                }));
                        } catch (err) {
                            MessageToast.show("MethodNotFound: scheduler + " + err.toString())
                        }
                    }

                    //content.push(new sap.m.ToolbarSpacer());


                    if (!parameters.saveScreen || (parameters.saveScreen && parameters.saveScreen == true)) {
                        try {
                            content.push(new sap.m.Button(
                                {
                                    icon: "sap-icon://save",
                                    text: "{i18n>save}",
                                    press: this.that.saveScreen
                                }));
                        } catch (err) {
                            MessageToast.show("MethodNotFound: Save + " + err.toString())
                        }
                    }

                    if (!parameters.variants || (parameters.variants && parameters.variants == true)) {

                        try {

                            let bt = new sap.m.Button(
                                {
                                    icon: "sap-icon://customize",
                                    text: "{i18n>variants}",
                                    press: This.that.selectVariables
                                }).setVisible(false);

                            content.push(bt);

                            Helpers.getLastUsedVariant(this.view, 'filter', this.that)
                                .then(persisted => {
                                    if (persisted) {
                                        bt.setVisible(true);
                                    } else {
                                        bt.setVisible(false);
                                    }
                                })
                                .catch(err => {
                                    MessageToast.show("MethodNotFound: execute + " + err.toString())
                                });

                        } catch (err) {
                            MessageToast.show("MethodNotFound: execute + " + err.toString())
                        }
                    }

                    if (!parameters || (parameters.closeIfComponent && parameters.closeIfComponent == true)) {
                        try {
                            content.push(new sap.m.Button("add.tax.stb.btCloseIfComponent", { visible: false, text: "Close if component", press: this.that.close }));
                        } catch (err) {
                            MessageToast.show("MethodNotFound: scheduler + " + err.toString())
                        }
                    }

                    //content.push(ListButtons.notification(This.that));

                    return content;
                },
                onLoadFilterVariantPress: function (that) {

                    Helpers.openDialogToList(this.that, this.view, 'filter')
                        .then(data => {
                            if (data) {

                                var oModel = new JSONModel(data);

                                that.models.model("FILTERS").setModel(oModel);
                            }
                        })
                        .catch(err => {
                            console.log("Erro ao listar variante local: ", err);
                        });
                }

            });
        });