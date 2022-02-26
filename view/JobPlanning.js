sap.ui.define([], function () {
    "use strict";
    var MainView;
    var popUp;
    var externalParams;
    return {
        get: function (that, separator, external) {
            MainView = that;
            externalParams = external;
            MainView.popUpPlan = {};

            try {
                let buttons = [
                    separator ? new sap.m.ToolbarSeparator() : null,
                    new sap.m.Button({
                        tooltip: "{i18n>plan}",
                    })
                        .setIcon("sap-icon://date-time")
                        .setType("Transparent")
                        .attachPress(this.popUp),
                ];

                buttons.forEach(bt => MainView.getView().addDependent(bt));

                return buttons;
            } catch (error) {
                console.log("ListButtonError: ", error);
            }
        },
        popUp: async function (oEvent) {
            if (!MainView.popUpPlan.tabLine) {
                MainView.popUpPlan.tabLine = new sap.ui.table.Table({
                    width: "100%",
                    enableGrouping: true,
                    visibleRowCount: 10,
                    selectionMode: sap.ui.table.SelectionMode.Single,
                    enableColumnReordering: true,
                });
                let catalog = [
                    { field: "ACTIONNAME" },
                    { field: "ERNAM" },
                    { field: "STATUS" },
                    { field: "CHADAT" },
                    { field: "JOBNAME" },
                    { field: "DESCR" },
                    { field: "LIMIT" },
                    { field: "EVERY" },
                    { field: "START" },
                    { field: "CREDAT" },
                    { field: "REPEATID" },
                ];
                await MainView.setFn("getFieldByType");
                await new ScreenElements(MainView).getStruc(catalog, true, true).then(data => {
                    if (!data) {
                        console.error("ERR_GET_STRUCT_FAILED");
                        return;
                    }

                    MainView.popUpPlan.catPopPlan = JSON.parse(data);

                    MainView.popUpPlan.tabLine.setRowSettingsTemplate(
                        new sap.ui.table.RowSettings({
                            highlight: {
                                parts: [{ path: "popUpPlan>TPMSG" }],
                                formatter: formatter().TPMSG,
                            },
                        })
                    );

                    for (let field of MainView.popUpPlan.catPopPlan) {
                        let oControl;
                        switch (field.DATATYPE) {
                            case "DATS":
                                oControl = MainView.DatetFromAddson("popUpPlan>" + field.FIELD);
                                break;

                            default:
                                oControl = MainView.getFieldByType(field, MainView, "popUpPlan");
                                break;
                        }

                        let label = field.SCRTEXT_S || field.SCRTEXT_M || field.SCRTEXT_L || field.DESCR;
                        let leng = parseInt(field.OUTPUTLEN) ? parseInt(field.OUTPUTLEN) + "rem" : "auto";
                        let oColumn = new sap.ui.table.Column({
                            width: "35%",
                            minWidth: 48,
                            label: new sap.m.Label({ text: label, wrapping: false }),
                            autoResizable: true,
                            template: oControl,
                            tooltip: field.SCRTEXT_L + " " + field.FIELD,
                            sortProperty: field.FIELD,
                            filterProperty: field.FIELD,
                            autoResizable: true,
                            // grouped: true
                        });

                        oColumn.setCreationTemplate(new sap.m.Input({ value: "{" + field.FIELD + "}" }));

                        MainView.popUpPlan.tabLine.addColumn(oColumn);

                        MainView.popUpPlan.tabLine.setToolbar(
                            new sap.m.Toolbar({
                                content: [
                                    new sap.m.Button({
                                        press: oEvent => {
                                            newPlan(oEvent);
                                        },
                                        icon: "sap-icon://date-time",
                                        text: "{i18n>newPlan}",
                                    }),
                                    new sap.m.Button({
                                        tooltip: "{i18n>refresh}",
                                        icon: "sap-icon://refresh",
                                        press: async function (oEvent) {
                                            let bt = oEvent.getSource();
                                            bt.setBlocked(true);
                                            getPlans();
                                            bt.setBlocked(false);
                                        },
                                    }),
                                ],
                            })
                        );
                    }

                    MainView.popUpPlan.messageDialogLine = new sap.m.Dialog({
                        title: "{i18n>plan}",
                        icon: "sap-icon://date-time",
                        verticalScrolling: true,
                        horizontalScrolling: true,
                        showHeader: true,
                        contentHeight: "45%",
                        contentWidth: "80%",
                        resizable: true,
                        //type: sap.m.DialogType.Message,
                        content: new sap.m.Page({
                            showHeader: false,
                            enableScrolling: false,
                            content: [MainView.popUpPlan.tabLine],
                        }),

                        leftButton: new sap.m.Button({
                            text: "Ok",
                            press: function () {
                                MainView.popUpPlan.messageDialogLine.close();
                            },
                        }),
                    });

                    // MainView.popUpPlan.messageDialogLine.setTitle("tit");

                    MainView.getView().addDependent(MainView.popUpPlan.messageDialogLine);
                });
            }

            getPlans();

            MainView.popUpPlan.messageDialogLine.open();

            async function getPlans(externalQuery) {
                MainView.popUpPlan.tabLine.setBusy(true);

                MainView.callService
                    .postSync("add", {
                        actionName: "JOB0100.list",
                        params: {
                            fields: ["JOB0000", "ERNAM", "STATUS", "CHADAT", "JOBNAME", "DESCR", "EVERY", "LIMIT", "START", "CREDAT", "REPEATID"],
                            query: externalQuery || { JOBNAME: MainView.IDAPP },
                            sort: ["-CHADAT", "-CREDAT"],
                        },
                    })
                    .then(resp => {
                        resp = JSON.parse(resp).rows;
                        MainView.popUpPlan.tabLine.setModel(
                            new MainView.Model(
                                resp.map(r => {
                                    switch (r.STATUS) {
                                        case "completed":
                                            //r.STATUS = "sap-icon://complete";
                                            r.TPMSG = "S";
                                            break;
                                        case "waiting":
                                            // r.STATUS = "Warning";
                                            r.TPMSG = "W";
                                            break;
                                        case "active":
                                            break;
                                        case "create":
                                            //r.STATUS = "Warning";
                                            r.TPMSG = "W";
                                            break;
                                        case "error":
                                            //r.STATUS = "Error";
                                            r.TPMSG = "E";
                                        case "failed":
                                            break;
                                        default:
                                            //r.STATUS = "Information";
                                            r.TPMSG = "I";
                                            break;
                                    }

                                    return r;
                                })
                            ),
                            "popUpPlan"
                        );

                        MainView.popUpPlan.tabLine.bindRows("popUpPlan>/");
                        MainView.popUpPlan.tabLine.setBusy(false);

                        MainView.callService
                            .postSync("add", {
                                actionName: "JOB0000.list",
                                params: {
                                    query: { id: { $in: resp.map(r => r.JOB0000) } },
                                    sort: ["-CHADAT", "-CREDAT"],
                                },
                            })
                            .then(respd => {
                                respd = JSON.parse(respd).rows;
                                MainView.popUpPlan.tabLine.setModel(
                                    new MainView.Model(
                                        resp.map(r => {
                                            const rp = respd.find(rd => rd.id === r.JOB0000);
                                            r.EVERY = rp.JOBOPTS.repeat.every;
                                            r.LIMIT = rp.JOBOPTS.repeat.limit;
                                            r.ACTIONNAME = rp.ACTIONNAME;
                                            r.DESCR = rp.PARAMS.DESCR;
                                            //r.REPEATID = rp.REPEATID;
                                            return r;
                                        })
                                    ),
                                    "popUpPlan"
                                );
                                MainView.popUpPlan.tabLine.bindRows("popUpPlan>/");
                                MainView.popUpPlan.tabLine.setBusy(false);
                                MainView.message("successRefresh");
                            })
                            .catch(error => {
                                MainView.popUpPlan.tabLine.setBusy(false);
                                console.error(error);
                            });
                    })
                    .catch(error => {
                        MainView.popUpPlan.tabLine.setBusy(false);
                        console.error(error);
                    });
            }

            function newPlan(oEvent) {
                let every = new sap.m.Input({ type: sap.m.InputType.Integer, width: "40%" });
                let limit = new sap.m.Input({ type: sap.m.InputType.Integer, width: "40%" });
                let descr = new sap.m.Input({ type: sap.m.InputType.Integer, width: "70%" });

                every.setValue(1);
                limit.setValue(5);

                if (!MainView.popUpPlan.dialogConfirmPlan) {
                    MainView.popUpPlan.dialogConfirmPlan = new sap.m.Dialog({
                        contentWidth: "50%",
                        stretch: sap.ui.Device.system.phone,
                        title: "Planejamento",
                        type: "Message",
                        state: sap.ui.core.ValueState.Information,
                        icon: "sap-icon://date-time",
                        content: [
                            new sap.m.Panel({
                                //allowWrapping: true,
                                content: [
                                    new sap.ui.layout.VerticalLayout({
                                        width: "100%",
                                        content: [
                                            new sap.m.Label({
                                                text: "{i18n>minutInterval}",
                                            }),
                                            every,
                                            new sap.m.Label({
                                                text: "{i18n>timesRepeat}",
                                            }),
                                            limit,
                                            new sap.m.Label({
                                                text: "{i18n>description}",
                                            }),
                                            descr,
                                        ],
                                    }),
                                ],
                            }),
                        ],

                        beginButton: new sap.m.Button({
                            text: "{i18n>confirm}",
                            type: sap.m.ButtonType.Information,
                            icon: "sap-icon://date-time",
                            press: async function (oEvent) {
                                let bt = oEvent.getSource();
                                //bt.setBlocked(true);
                                //bt.setBusy(true);

                                MainView.popUpPlan.dialogConfirmPlan.close();

                                let evry = every.getValue() * 1000 * 60;

                                let lmit = parseInt(limit.getValue());

                                let dscr = descr.getValue();

                                let params = externalParams || MainView.getParamsExecute();

                                params.jobOpts = { repeat: { every: evry || 2000, limit: lmit || 1 } };
                                params.params.query = MainView.getSelectScreenFilters(MainView);


                                for (const key in params.params.query) {
                                    if (!params.params.query[key] || params.params.query[key] === null) delete params.params.query[key];
                                }

                                delete params.params.query.MAXROWS;

                                params.params.jobName = MainView.IDAPP;
                                params.params.DESCR = dscr;
                                delete params.params.foreground;

                                for (const fld of MainView.context.filter(c => (c.params === true || c.query === false || c.jobParams === true))) {
                                    params.params[fld.FIELD] = params.params.query[fld.FIELD];
                                    delete params.params.query[fld.FIELD];
                                }

                                MainView.callService
                                    .postSync("add", params)
                                    .then(resp => {
                                        //if (resp === "Job Created") {
                                        MainView.message("jobCreateSuccess");
                                        getPlans();
                                        /* } else {
                                        MainView.message("jobCreateError");
                                    }*/
                                    })

                                    .catch(error => {
                                        MainView.getView().setBusy(false);
                                        bt.setBlocked(false);
                                        alert(error);
                                        console.error(error);
                                    });

                                return true;
                            },
                        }),
                        endButton: new sap.m.Button({
                            text: "{i18n>cancel}",
                            press: function (e) {
                                MainView.popUpPlan.dialogConfirmPlan.close();

                                return false;
                            },
                        }),
                    });

                    MainView.getView().addDependent(MainView.popUpPlan.dialogConfirmPlan);
                }

                MainView.popUpPlan.dialogConfirmPlan.open();
            }

            function formatter() {
                return {
                    DESCR: (DESCR, STATU) => {
                        return STATU + ":" + DESCR;
                    },
                    INFORMATION: () => "Information",

                    TPMSG: TPMSG => {
                        switch (TPMSG) {
                            case "E":
                                return "Error";
                                break;
                            case "W":
                                return "Warning";
                                break;
                            case "S":
                                return "Success";
                                break;
                            default:
                                //case "I":
                                return "Information";
                                break;
                        }
                    },
                };
            }
        },
    };
});
