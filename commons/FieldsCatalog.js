sap.ui.define([], function (AddUtilities) {
    var That = null;

    return {
        getFieldByType: function (catalog, MainView, model) {
            /********************************************
             *  retorna objeto de acordo com o tipo ADD
             *
             * TIPOS ADD:
             * DATS: datas AAAMMDD,
             * CHAR: string,
             * QUAN: Interios,
             * CURR: monetários,
             * TIMS: horas HHMMSS,
             * ICON: ícones,
             * BOOL: boolean.
             *
             * parametros possíveis:
             * .formatter:
             * .prop:
             * .propInclude:
             * .....
             * VOLTAR AQUI PARA DOCUMENTAR
             ********************************************/

            let mdl = model ? model + ">" : MainView.IDAPP + "tab>";

            let link = {};

            if (catalog.HOTSP)
                link = {
                    active: true,
                    press: catalog.prop?.press || (async oEvent => await MainView.View.hotspot(oEvent, MainView, catalog.REFKIND || catalog.FIELD)),
                    state: catalog.prop?.state || {
                        path: mdl + catalog.FIELD,
                        type: catalog.prop?.type || "sap.ui.model.type.String",
                        formatter: catalog.formatter || (val => "Information"),
                    },
                };

            switch (catalog.DATATYPE) {
                case "QUAN":
                    return catalog.EDIT
                        ? new sap.m.Input({
                            type: "sap.ui.model.type.Integer",
                            value: "{" + mdl + catalog.FIELD + "}",
                        })
                        : new sap.m.ObjectStatus({
                            tooltip: catalog.SCRTEXT_L + " " + catalog.FIELD,
                            active: catalog.HOTSP ? true : false,
                            state: {
                                path: mdl + catalog.FIELD,
                                type: "sap.ui.model.type.Integer",
                                formatter: catalog.formatter || (val => (catalog.VKEYM ? "Information" : sap.ui.core.ValueState.None)),
                            },
                            text: "{" + mdl + catalog.FIELD + "}",
                            ...link,
                            ...catalog.propInclude,
                        });

                case "CHAR":
                    return new sap.m.ObjectStatus({
                        tooltip: catalog.SCRTEXT_L + " " + catalog.FIELD,
                        active: catalog.HOTSP ? true : false,

                        state: {
                            path: mdl + catalog.FIELD,
                            type: "sap.ui.model.type.String",
                            formatter: catalog.formatter || (val => (catalog.VKEYM ? "Information" : sap.ui.core.ValueState.None)),
                        },
                        text: "{" + mdl + catalog.FIELD + "}",
                        ...link,
                        ...catalog.propInclude,
                    });
                case "DATS":
                    switch (catalog.FIELD) {
                        case "CREDAT":
                        case "CHADAT":
                            return MainView.DatetFromAddson(mdl + catalog.FIELD);
                            break;
                        default:
                            return new sap.m.Label({
                                tooltip: catalog.SCRTEXT_L + " " + catalog.FIELD,
                                text: {
                                    path: mdl + catalog.FIELD,
                                    type: new MainView.Date({
                                        source: {},
                                        pattern: "dd.MM.yyyy",
                                    }),
                                },
                                wrapping: false,
                                ...catalog.propInclude,
                            });
                    }

                case "TIMS":
                    return new sap.m.Label({
                        tooltip: catalog.SCRTEXT_L + " " + catalog.FIELD,
                        text: {
                            path: mdl + catalog.FIELD,
                            type: new MainView.Time({
                                source: {},
                                pattern: "hh.mm.ss",
                            }),
                        },
                        wrapping: false,
                        ...catalog.propInclude,
                    });
                case "BOOL":
                    return new sap.m.ObjectStatus({
                        tooltip: catalog.SCRTEXT_L + " " + catalog.FIELD,
                        active: catalog.HOTSP ? true : false,
                        icon: {
                            parts: [
                                {
                                    path: mdl + catalog.FIELD,
                                },
                            ],
                            formatter: catalog.formatter || (val => (val ? MainView.ICON_ACTIVE : "")),
                        },
                        ...link,
                        ...catalog.propInclude,
                    });
                case "ICON":
                    return new sap.m.ObjectStatus({
                        tooltip: catalog.SCRTEXT_L + " " + catalog.FIELD,
                        icon: "{" + mdl + catalog.FIELD + "}",
                        active: catalog.HOTSP ? true : false,
                        ...link,
                        ...catalog.propInclude,
                    });
                case "CURR":
                    return new sap.m.Text({
                        //tooltip: catalog.SCRTEXT_L + " " + catalog.FIELD,
                        wrapping: false,
                        text: {
                            path: mdl + catalog.FIELD,
                            type: catalog.prop?.type || "sap.ui.model.type.Float",
                            formatOptions: catalog?.prop?.formatOptions || {
                                showMeasure: true
                            },
                        },
                        ...link,
                        ...catalog.propInclude,
                    });
                default:
                    return new sap.m.Label({
                        tooltip: catalog.SCRTEXT_L + " " + catalog.FIELD,
                        text: "{" + mdl + catalog.FIELD + "}",
                        wrapping: false,
                        ...catalog.propInclude,
                    });
            }
        },
    };
});
