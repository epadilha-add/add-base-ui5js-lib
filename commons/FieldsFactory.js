sap.ui.define(["./AddUtilities"], function (AddUtilities) {
    var That = null;

    return {
        AddUtilities: AddUtilities,

        constructor: function (that) {
            That = that;
        },
        create: function (parameters) {
            //*************************************************************** */
            //* parameters.that: controler
            //* parameters.STRUC: catalog fields
            //* nameMondel: literal string name model: e.g: 'alv>/'
            //* parameters.prefix: id parameters.prefix : duplication.
            //*         for each screen to use '_', or '__', or '__'. Obligatory
            //* to use '_'. is necessary to pop() command in ValueHelpFields
            //* parameters.Type: T or L (T = Text or L = Label OR I = Input)
            //*************************************************************** */
            let vCol = null;
            var Id = null;

            if (parameters.prefix) {
                Id = parameters.prefix + parameters.STRUC.FIELDNAME;
            }

            //  console.log(Id);
            if (parameters.that.AddUtilities.checkBoxFields(parameters.STRUC.FIELDNAME) === true) {
                vCol = new sap.m.CheckBox({
                    id: Id,
                    //layoutData: new sap.m.FlexItemData({ growFactor: 2 }),
                    enabled: parameters.STRUC.EDIT ? true : false,
                    editable: parameters.STRUC.EDIT ? true : false,
                    selected: {
                        path: parameters.namedModel + parameters.STRUC.FIELDNAME,
                        Type: "sap.ui.model.parameters.Type.Boolean",
                        formatter: parameters.that.formatter.formatBoolean,
                    },
                });
                return vCol;
            }

            if (parameters.STRUC.FIELDNAME !== "STATU") {
                switch (parameters.STRUC.DATATYPE) {
                    case "CURR":
                    case "DEC":
                    case "QUAN":
                        var decimals = 0;
                        var maxInt = 0;
                        var Type = "sap.ui.model.parameters.Type.Float";

                        switch (parameters.STRUC.DATATYPE) {
                            case "CURR":
                            case "DEC":
                                if (parameters.STRUC.FIELDNAME.substring(0, 2) == "AL") {
                                    decimals = 6;
                                    maxInt = 9;
                                } else {
                                    decimals = 2;
                                    maxInt = 15;
                                }
                                break;

                            default:
                                Type = "sap.ui.model.parameters.Type.Integer";
                                decimals = 0;
                                maxInt = 10;
                                break;
                        }

                        if (parameters.STRUC.EDIT !== "X" || parameters.Type == "L") {
                            vCol = new sap.m.Label({
                                id: Id,
                                tooltip: parameters.STRUC.tooltip ? parameters.STRUC.tooltip : "",
                                wrapping: false,
                                text: {
                                    path: parameters.namedModel + parameters.STRUC.FIELDNAME,
                                    Type: parameters.Type,
                                    formatOptions: {
                                        maxIntegerDigits: maxInt,
                                        maxFractionDigits: decimals,
                                    },
                                },
                            });
                        } else {
                            vCol = new sap.m.Input({
                                id: Id,
                                tooltip: parameters.STRUC.tooltip ? parameters.STRUC.tooltip : "",
                                // wrapping: false, -> incompatível
                                value: {
                                    path: parameters.namedModel + parameters.STRUC.FIELDNAME,
                                    Type: parameters.Type,
                                    formatOptions: {
                                        maxIntegerDigits: maxInt,
                                        maxFractionDigits: decimals,
                                    },
                                },
                            });
                        }
                        break;

                    case "DATS":
                        if (parameters.STRUC.EDIT !== "X" || parameters.Type == "L") {
                            vCol = new sap.m.Label({
                                id: Id,
                                tooltip: parameters.STRUC.tooltip ? parameters.STRUC.tooltip : "",
                                wrapping: false,
                                //   submit: vSubmit,
                                text: {
                                    path: parameters.namedModel + parameters.STRUC.FIELDNAME,
                                    Type: "sap.ui.model.parameters.Type.Date",
                                    formatOptions: {
                                        style: "short",
                                        source: {
                                            pattern: "dd/mm/yyyy",
                                        },
                                    },
                                },
                            });
                        } else {
                            vCol = new sap.m.DatePicker({
                                id: Id,
                                tooltip: parameters.STRUC.tooltip ? parameters.STRUC.tooltip : "",
                                displayFormat: "dd-MM-yyyy",
                                valueFormat: "yyyyMMdd",
                                change: parameters.STRUC.submit ? parameters.STRUC.submit : function () {},
                                enabled: parameters.STRUC.EDIT ? true : false,
                                //   submit: vSubmit,
                                value: {
                                    path: parameters.namedModel + parameters.STRUC.FIELDNAME,
                                },
                            });
                        }

                        break;

                    case "TIMS":
                        if (parameters.STRUC.EDIT !== "X" || parameters.Type == "L") {
                            vCol = new sap.m.Label({
                                id: Id,
                                tooltip: parameters.STRUC.tooltip ? parameters.STRUC.tooltip : "",
                                wrapping: false,
                                text: {
                                    path: parameters.namedModel + parameters.STRUC.FIELDNAME,
                                    Type: "sap.ui.model.parameters.Type.Time",
                                    formatOptions: {
                                        source: {
                                            pattern: "hh:mm:ss",
                                        },
                                    },
                                },
                            });
                        } else {
                            vCol = new sap.m.TimePicker({
                                id: Id,
                                tooltip: parameters.STRUC.tooltip ? parameters.STRUC.tooltip : "",
                                displayFormat: "hh:mm:ss",
                                valueFormat: "hhmmss",
                                enabled: parameters.STRUC.EDIT ? true : false,
                                value: {
                                    path: parameters.namedModel + parameters.STRUC.FIELDNAME,
                                },
                            });
                        }
                        break;

                    case "NUMC":
                        vCol = createElementByparameters.Type(parameters.STRUC, parameters.namedModel, parameters.Type, parameters.that);
                        break;

                    default:
                        vCol = createElementByparameters.Type(parameters.STRUC, parameters.namedModel, parameters.Type, parameters.that);
                        break;
                }
            } else {
                try {
                    vCol = new sap.m.Link({
                        id: Id,
                        tooltip: parameters.STRUC.tooltip ? parameters.STRUC.tooltip : "",
                        text: { parts: [{ path: parameters.namedModel + parameters.STRUC.FIELDNAME }, { path: parameters.namedModel + "PROCX" }], formatter: parameters.that.formatter.formatStatus },
                        press: parameters.that.processLogFromLine,
                    });
                } catch {
                    vCol = createElementByparameters.Type(parameters.STRUC, parameters.namedModel, parameters.Type, parameters.that);
                }
            }

            try {
                switch (parameters.STRUC.DATAparameters.Type) {
                    case "TIMS":
                    case "DATS":
                        break;
                    default:
                        if (parameters.STRUC.submit) vCol.attachSubmit(parameters.STRUC.submit);
                }
            } catch {
                throw new TypeError("submit incompatível com " + parameters.STRUC.FIELDNAME);
            }

            return vCol;
        },

        createElementbyType: function (value, that) {
            "user strict";
            var chnd;
            var tooltip;
            var placeholder;

            tooltip = value.SELTEXT_S ? value.SELTEXT_S + ":" + value.FIELDNAME : value.SELTEXT_M + ":" + value.FIELDNAME;
            placeholder = value.SELTEXT_S ? value.SELTEXT_S : value.SELTEXT_M;

            switch (value.SECTION.substring(2, 4)) {
                case "LB":
                //list box
                case "MI":
                    try {
                        chnd = eval("that.onValueHelpRequested" + value.FIELDNAME);
                    } catch {}

                    var oTokenTemplate = new sap.m.Token({
                        key: "{FILTERS>key}",
                        text: "{FILTERS>text}",
                    });

                    let sh = function () {};
                    let showVH = false;
                    let fld = value.FIELDNAME;
                    if (value.RFTAB && value.RFTAB.length > 0 && value.RFFLD.length > 0) {
                        showVH = true;
                        that._idBusy = cIdBuzy;
                        sh = value.sh
                            ? value.sh
                            : function (oEvent) {
                                  that.ProcessMonitor.sh(oEvent, fld, that, null, value);
                              };
                        if (!AddUtilities.model().getModel("FILTERS", that).oData[value.FIELDNAME]) AddUtilities.model().getModel("FILTERS", that).oData[value.FIELDNAME] = [];
                    }

                    return new sap.m.MultiInput({
                        id: value.FIELDNAME,
                        submit: that.onSubmit,
                        placeholder: placeholder,
                        tooltip: tooltip,
                        valueHelpRequest: sh,
                        showValueHelp: showVH,
                        tokenUpdate: that.onTokenUpdate,
                        placeholder: placeholder,
                    }).bindAggregation("tokens", "FILTERS>/" + value.FIELDNAME, oTokenTemplate);

                    break;

                case "MC":
                    var oItemTemplate = new sap.ui.core.Item({
                        key: "{PARAM>" + value.FIELDNAME + "}",
                        text: "{PARAM>" + value.FIELDNAME + "}:{PARAM>DESCR}",
                    });

                    try {
                        chnd = eval("that.handleSelectionChange" + value.FIELDNAME);
                    } catch {}

                    return new sap.m.MultiComboBox({
                        id: value.FIELDNAME,
                        required: value.FIELDNAME == "BUKRS" ? true : value.FIELDNAME == "PROCX" ? true : false,
                        placeholder: placeholder,
                        tooltip: tooltip,
                        selectionChange: chnd ? chnd : function (oEvent) {},
                        items: {
                            path: "PARAM>/VIEWS/" + value.SECTION.substring(5, 10),
                            sorter: "{" + value.FIELDNAME + "}",
                            template: oItemTemplate,
                        },
                        selectedKeys: {
                            path: "FILTERS>/" + value.FIELDNAME,
                            //template: "{" + value.FIELDNAME + "}"
                        },
                    });

                    break;

                case "DR":
                    try {
                        chnd = eval("that.handleChange" + value.FIELDNAME);
                    } catch {}

                    let fldDate = "ADDDATE" + value.FIELDNAME;

                    if (!AddUtilities.model().getModel("FILTERS", that).oData[fldDate]) AddUtilities.model().getModel("FILTERS", that).oData[fldDate] = {};

                    return new sap.m.DateRangeSelection({
                        id: value.FIELDNAME,
                        change: chnd ? chnd : function () {},
                        required: value.FIELDNAME == "DTPRC" ? true : false,
                        dateValue: "{FILTERS>/ADDDATE" + value.FIELDNAME + "/LOW}",
                        secondDateValue: "{FILTERS>/ADDDATE" + value.FIELDNAME + "/HIGH}",
                    });

                    break;

                case "CB":
                    return new sap.m.CheckBox({ id: value.FIELDNAME, selected: "{FILTERS>/" + value.FIELDNAME + "}" });

                    break;

                case "TP":
                    return new sap.m.TimePicker({
                        id: value.FIELDNAME,
                        tooltip: tooltip,
                        displayFormat: "hh:mm:ss",
                        valueFormat: "hhmmss",
                        enabled: true,
                        value: {
                            path: "FILTERS>/" + value.FIELDNAME,
                        },
                    });

                    break;

                default:
                    return;
            }
        },
    };
});
