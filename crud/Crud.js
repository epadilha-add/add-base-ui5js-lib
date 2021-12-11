
sap.ui.define([
    "../BaseController",
    "../ui/ScreenElements",
    "sap/uxap/ObjectPageLayout"
], function (Object, ScreenElements) {
    "use strict";

    return Object.extend("add.appm.crud.Crud", {


        constructor: function (params, backFn) {
            params.that.getView().byId("idAppControl").setBusy(true);
            this.mainContent = new sap.ui.layout.form.SimpleForm({
                editable: true,
                layout: "ColumnLayout",
                columnsM: 2,
                columnsL: 3,
                columnsXL: 4
            });

            this.that = params.that;

            this.setId(params.id);
            if (!this.delete)
                this.delete = params.delete;

            if (!this.save)
                this.save = params.save;

            this.btBack = new sap.m.Button(
                {
                    icon: "sap-icon://decline",
                    type: "Transparent",
                    tooltip: "Fechar",
                    press: () => {
                        //let v = this.textArea.getValue();
                        backFn();
                    }
                });
            /*************************************
             * 
             * Preparação tela UI5
             * 
             *************************************/
            this.activeButton = new sap.m.SegmentedButton({
                selectedKey: params.ACTIVE,
                //width: "10%",
                items: [
                    new sap.m.SegmentedButtonItem({ text: "{i18n>active}" || "Ativo", key: true }),
                    new sap.m.SegmentedButtonItem({ text: "{i18n>deactivate}" || "Desativado", key: false })
                ],
                selectionChange: function (oEvent) {

                    let values = params.that.getView().getModel(params.that.IDAPP + "PARAM").getData();

                    let selectValue = (oEvent.getParameter("item").getKey() === "false") ? false : true;

                    let inpConf = new sap.m.Input();

                    params.that.dialogActive = new sap.m.Dialog({

                        contentWidth: "35%",

                        title: "{i18n>statusConfirm}",

                        content: [new sap.m.Panel({
                            content: [
                                new sap.m.Label({
                                    text: "{i18n>write} '" + values[params.that.IDAPP + params.that.titleField] + "' {i18n>toConfirm}"
                                }),
                                inpConf]
                        })],

                        beginButton: new sap.m.Button({

                            text: "{i18n>confirm}",

                            press: async function () {

                                if (inpConf.getValue() != values[params.that.IDAPP + params.that.titleField]) return;

                                values[params.that.IDAPP + "ACTIVE"] = selectValue;

                                params.that.dialogActive.close();
                                params.that.dialogActive.destroy();
                                params.that.save();
                            }
                        }),
                        endButton: new sap.m.Button({
                            text: "{i18n>cancel}",
                            press: function (e) {

                                params.that.getView().byId("idAppControl").setBusy(false);

                                //   setTimeout(
                                //     function () {
                                var items = params.that.CrudView.activeButton.getItems().map(function (itm) { return itm.getId() });
                                params.that.CrudView.activeButton.setSelectedItem(items[(values[params.that.IDAPP + "ACTIVE"]) ? 0 : 1]);
                                params.that.CrudView.activeButton.setSelectedKey(values[params.that.IDAPP + "ACTIVE"])
                                //  }, 1000);

                                params.that.dialogActive.destroy();
                                params.that.dialogActive.close();
                            }
                        })
                    })

                    params.that.getView().addContent(params.that.dialogActive);


                    params.that.dialogActive.open();

                }
            });

            let buttons = [
                new sap.m.Button({
                    icon: "sap-icon://delete",
                    text: "{i18n>delete}",
                    type: sap.m.ButtonType.Transparent,//type: "Reject",
                    press: () => {
                        this.delete(this.getId());
                    }
                }), this.activeButton
                , new sap.m.Button({
                    icon: "sap-icon://save",
                    type: sap.m.ButtonType.Transparent,
                    text: "{i18n>save}",
                    press: async (oEvent) => {

                        await this.save(params);

                    }
                }),
                this.btBack
            ];

            /*        if (params.that.foreignKeys) {
       
                       return This.getDetail(panelContent);
                   } */

            let sections = [
                new sap.uxap.ObjectPageSection({
                    title: "{i18n>basicData}",
                    subSections: new sap.uxap.ObjectPageSubSection({
                        validateFieldGroup: () => { },
                        blocks: new sap.m.Panel({
                            content: this.mainContent
                        })
                        // moreBlocks: new sap.m.Label({ text: "Anbother block" })
                    })
                })
            ]

            if (params.that.sectionsItems) {
                /*
                   Possibilita incluir mais seções .
                   Type: sap.uxap.ObjectPageSection
                 */
                sections = sections.concat(params.that.sectionsItems.items);
            }

            this.Page = new sap.uxap.ObjectPageLayout({
                useIconTabBar: true,
                isChildPage: false,
                busyIndicatorDelay: 300,
                showTitleInHeaderContent: false,
                alwaysShowContentHeader: false, showFooter: false,
                headerTitle:

                    /*                new sap.uxap.ObjectPageDynamicHeaderTitle({
                                       expandedHeading: new sap.m.Title({ text: params[params.that.titleField] }),
                                       snappedHeading: new sap.m.FlexBox({ items: [new sap.m.Avatar({ src: params.LOGO || params.that.icon || params.imageURI })] }),
               
                                       expandedContent: new sap.m.Title({ text: params[params.that.subtitle] || params.that.subtitle.toUpperCase() || null }),
               
                                       snappedContent: new sap.m.Title({ text: params[params.that.titleField] }),
               
                                   }), */

                    new sap.uxap.ObjectPageHeader({
                        objectImageURI: params.LOGO || params.that.icon || params.imageURI,
                        isObjectTitleAlwaysVisible: true,
                        showPlaceholder: true,
                        isObjectIconAlwaysVisible: true,
                        objectTitle: params[params.that.titleField] || "Nothing",//'{' + params.that.IDAPP + 'PARAM>' + params.that.titleField.split('/')[0] + '}',
                        objectSubtitle: params[params.that.subtitle] || params.that.subtitle.toUpperCase() || null,
                        actions: buttons
                    }),///.addStyleClass("labelColumnsTableBold"),

                headerContent: [
                    //new sap.m.Avatar({ src: params.LOGO || params.that.icon || params.imageURI })
                    //new sap.m.SearchField(),
                    //new sap.m.Label({ text: "Hello!", wrapping: true }),
                    /*new sap.m.ObjectAttribute({
                        title: "Phone",
                        customContent: new sap.m.Link({ text: "+33 6 4512 5158" }),
                        active: true
                    })*/
                ],
                sections: sections
            });

            let flds = [];

            let exclude = ["CREDAT", "ERNAM", "MANDT", "CHADAT", "CHANAM", "ACTIVE", "id", "delete", "save", "that"];

            // obter relação de campos com base no regitro selecionado
            for (const field in params) {

                /*         if (params.that.titleField.split('.')[0] ===
                            field && params.that.context.length > 1) continue; */

                if (exclude.find(e => e === field || e === field.field)) continue;

                if (params.that.foreignKeys && params.that.foreignKeys.find(e => e[field])) continue;

                let vals = params.that.context.find(e => e === field || e.field === field)

                if (vals && !vals.field || !vals) {
                    flds.push({
                        field: field, prop: {
                            obligatory: true
                        }
                    });
                } else {
                    flds.push(vals);
                }

                if (!vals)
                    params.that.context.push(field);

            }

            //-> inserir campos impostos do construtor caso o registro não os possua
            for (const field of params.that.context) {

                if (params.that.foreignKeys && params.that.foreignKeys.find(e => e[field])) continue;

                if (!field.field) {

                    /*     if (params.that.titleField.split('.')[0] ===
                            field && params.that.context.length > 1) continue; */

                    if (flds.find(f => f.field === field)) continue;

                    flds.push({
                        field: field, prop: {
                            obligatory: true
                        }
                    });

                } else {

                    /*            if (params.that.titleField.split('.')[0] ===
                                   field.field && params.that.context.length > 1) continue; */

                    if (flds.find(f => f.field === field.field)) continue;

                    flds.push(field);
                }

            }

            new ScreenElements(this.that).set(flds, this);

            params.that.getView().byId("idAppControl").setBusy(false);

            return this;
        },

        setId(Id) {
            this.id = Id;
        },

        getId() {
            return this.id;
        },

        setModel(oModel, nameModel) {

            this.that.getView().setModel(oModel, nameModel);
        },

        addContent(content) {

            if (content instanceof Array) {
                this.mainContent = this.mainContent.concat(content);
            } else {
                this.mainContent.addContent(content);
            }

        },

        setHeaderData: function (data) {

            this.Page.getObjectPageHeader().setObjectTitle(data.header)
        }
    })

});