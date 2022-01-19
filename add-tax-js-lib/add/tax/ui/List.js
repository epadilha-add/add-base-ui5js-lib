sap.ui.define([
    "sap/ui/base/Object",
    "sap/base/Log",
    "./ListButtons",
    "../commons/AddFormatter",
    "sap/m/MessageToast",
    "sap/ui/table/Table",
    "sap/ui/commons/TextField",
    "sap/ui/layout/form/SimpleForm",
], function (Object, Log, ListButtons, AddFormatter, MessageToast) {
    "use strict";

    return Object.extend("add.tax.ui.List", {
        table: null,
        that: null,
        formatter: AddFormatter,
        addColumns: function (struc) {

            struc.forEach(struc => {
                this.table.addColumn(new sap.ui.table.Column({
                    label: (struc.SCRTEXT_M) ? struc.SCRTEXT_M : (struc.SCRTEXT_L) ? struc.SCRTEXT_L : struc.SCRTEXT_S,
                    tooltip: (struc.SCRTEXT_L) ? struc.SCRTEXT_L : (struc.SCRTEXT_S),
                    sortProperty: struc.FIELDNAME,
                    filterProperty: struc.FIELDNAME,
                    autoResizable: true,
                    visible: (struc.VISIBLE == "X") ? true : false,
                    template: this.formatter.checkTypeFieldAndCreate(this.that, struc, this.that.models.IDAPP + 'LIST>', null, 'L')
                }));
            });
        },

        constructor: function (that) {
            this.that = that;
            this.toolbar = new sap.m.OverflowToolbar();
        },
        buildTable: function (fnBack, list) {
            try {

                this.table = new sap.ui.table.Table({
                    title: "Total : " + list.length,
                    width: '100%',
                    // columnHeaderHeight: 20,
                    //visibleRowCountMode: "Auto",
                    // enableGrouping: true,
                    visibleRowCount: 20,
                    selectionMode: sap.ui.table.SelectionMode.MultiToggle
                });

                Log.info("TODO", "prever leitura da última variante gravada 'getLastUsedVariant'")
                this.that.STRUC.forEach(struc => {
                    switch (struc.FIELDNAME) {
                        case this.that.models.IDAPP + "IDEME":
                        case this.that.models.IDAPP + "INDOC":
                        case this.that.models.IDAPP + "DOMIN":
                        case this.that.models.IDAPP + "DTPRC":
                        case this.that.models.IDAPP + "HRPRC":
                        case this.that.models.IDAPP + "BUKRS":
                        case this.that.models.IDAPP + "SENDE":
                        case this.that.models.IDAPP + "RECEI":
                        case this.that.models.IDAPP + "SUBJE":
                        case this.that.models.IDAPP + "LINK1":
                            struc.VISIBLE = "X";
                            break;

                        default:
                            struc.VISIBLE = "";
                            break;
                    }
                });

                this.addColumns(this.that.STRUC);

                this.table.bindRows(this.that.models.IDAPP + 'LIST>/');

                var model = new sap.ui.model.json.JSONModel(list);

                this.that.models.model("LIST").setModel(model);

                this.table.setModel(model);

                this.toolbar.addContent(new sap.m.Button({ type: "Back", press: fnBack }));

                ListButtons.get(this.that).forEach((e) => {
                    this.toolbar.addContent(e);
                })

                return new sap.m.Page({
                    content: [this.toolbar, this.table], footer: new sap.m.OverflowToolbar({ content: this.that.that.listNotification || null }), showHeader: false
                });

                return new sap.ui.layout.form.SimpleForm({
                    editable: true,
                    toolbar: new sap.m.OverflowToolbar({
                        content: buttonsToolBar
                    }),
                    editable: true,
                    layout: "ResponsiveGridLayout",
                    adjustLabelSpan: false,
                    singleContainerFullSize: true,
                    content: this.table
                });

            } catch (erro) {
                MessageToast.show(erro);
                Log.info("ERRO: add.tax.ui.List" + erro)
            }
        }

    })
});