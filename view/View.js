
sap.ui.define([
    "../BaseController",
    "../ui/ScreenElements",
    "sap/uxap/ObjectPageLayout"
], function (Object, ScreenElements) {
    "use strict";

    return Object.extend("add.ui5js.ui.View", {

        constructor: function (params, backFn) {

            this.component = {};

            if (params.that.sectionsItems && params.that.sectionsItems.foreignKeys)
                this.component = params.that.sectionsItems.foreignKeys.find(e => e.parent === params.that.IDAPP && (e.embedded || e.embedded === undefined))

            params.that.getView().byId(params.that.IDAPP).setBusy(true);

            this.mainContent = new sap.ui.layout.form.SimpleForm({
                width: '70%',
                editable: true,
                layout: "ColumnLayout",
                columnsM: 2,
                columnsL: 2,
                columnsXL: 2
            });

            this.that = params.that;

            this.setId(params.id);
            if (!this.delete)
                this.delete = params.delete;

            if (!this.save)
                this.save = params.save;


            /*************************************
             * 
             * Preparação tela UI5
             * 
             *************************************/
            this.activeButton = new sap.m.SegmentedButton({
                selectedKey: params.ACTIVE,
                //type: sap.m.ButtonType.Transparent,
                //width: "100px",
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
                                    text: "{i18n>write} '" + values[params.that.titleField] + "' {i18n>toConfirm}"
                                }),
                                inpConf]
                        })],

                        beginButton: new sap.m.Button({

                            text: "{i18n>confirm}",

                            press: async function () {

                                if (inpConf.getValue() != values[params.that.titleField]) return;

                                values["ACTIVE"] = selectValue;

                                params.that.dialogActive.close();
                                params.that.dialogActive.destroy();
                                params.that.save();
                            }
                        }),
                        endButton: new sap.m.Button({
                            text: "{i18n>cancel}",
                            press: function (e) {

                                params.that.getView().byId(params.that.IDAPP).setBusy(false);

                                //   setTimeout(
                                //     function () {
                                var items = params.that.CrudView.activeButton.getItems().map(function (itm) { return itm.getId() });
                                params.that.CrudView.activeButton.setSelectedItem(items[(values["ACTIVE"]) ? 0 : 1]);
                                params.that.CrudView.activeButton.setSelectedKey(values["ACTIVE"])
                                //  }, 1000);

                                params.that.dialogActive.close();
                                params.that.dialogActive.destroy();
                            }
                        })
                    })

                    params.that.getView().addContent(params.that.dialogActive);

                    params.that.dialogActive.open();

                }
            });

            let buttons = [];

            if (params.that.edit === true || params.that.edit === undefined) {
                buttons = [
                    new sap.m.Button({
                        icon: "sap-icon://delete",
                        text: "{i18n>delete}",
                        type: sap.m.ButtonType.Transparent,//type: "Reject",
                        press: () => {
                            this.delete(this.getId());
                        }
                    }),
                    this.activeButton,
                    new sap.m.Button({
                        icon: "sap-icon://save",
                        type: sap.m.ButtonType.Transparent,
                        text: "{i18n>save}",
                        press: async (oEvent) => {
                            await this.save(params);
                        }
                    }),
                    // params.that.btBack
                ];
            } else {
                //buttons = [
                //   params.that.btBack
                // ];
            }

            let sections = [];

            if (this.component && (this.component.embedded === undefined || this.component.embedded === true))
                sections[0] = new sap.uxap.ObjectPageSection({
                    showTitle: false,
                    title: "{i18n>basicData}",
                    subSections: new sap.uxap.ObjectPageSubSection({
                        mode: sap.uxap.ObjectPageSubSectionMode.Expanded,
                        validateFieldGroup: () => { },
                        blocks: new sap.m.Panel({
                            content: this.mainContent
                        })
                        // moreBlocks: new sap.m.Label({ text: "Anbother block" })
                    })
                })


            if (params.that.sectionsItems) {
                /*
                   Possibilita incluir mais seções .
                   Type: sap.uxap.ObjectPageSection
                 */
                sections = sections.concat(params.that.sectionsItems.items);
            }
            this.title = new sap.m.Label({ text: params[params.that.titleField] || params.that.titleField || null });
            this.avatar = new sap.m.Avatar({ src: params.LOGO || params.ICON || params.that.icon || params.imageURI, displaySize: sap.m.AvatarSize.XS, tooltip: params.that.IDAPP });

            this.Bar = new sap.m.Bar({
                contentLeft: [params.that.btBack, this.avatar, this.title],
                contentMiddle: [],
                contentRight: buttons
            })

            this.Page = new sap.uxap.ObjectPageLayout({
                useIconTabBar: true,
                isChildPage: false,
                busyIndicatorDelay: 300,
                showTitleInHeaderContent: false,
                alwaysShowContentHeader: false,
                showFooter: true,
                headerTitle: null,

                /*                new sap.uxap.ObjectPageDynamicHeaderTitle({
                                   expandedHeading: new sap.m.Title({ text: params[params.that.titleField] }),
                                   snappedHeading: new sap.m.FlexBox({ items: [new sap.m.Avatar({ src: params.LOGO || params.that.icon || params.imageURI })] }),
           
                                   expandedContent: new sap.m.Title({ text: params[params.that.subtitle] || params.that.subtitle.toUpperCase() || null }),
           
                                   snappedContent: new sap.m.Title({ text: params[params.that.titleField] }),
           
                               }), 

                new sap.uxap.ObjectPageHeader({
                    navigationBar: Bar,
                    objectImageURI: params.LOGO || params.ICON || params.that.icon || params.imageURI,
                    isObjectTitleAlwaysVisible: true,
                    showPlaceholder: false,
                    isObjectIconAlwaysVisible: true,
                    objectTitle: params[params.that.titleField] || params.that.titleField || null,
                    objectSubtitle: params[params.that.subtitle] || params.that.subtitle || null,
                    //actions: buttons,
                    //sideContentButton: null//params.that.btBack
                }),*/

                headerContent: [this.Bar
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

            /*    setTimeout(() => {
                   this.Page.setSelectedSection(sections[0].getId())
               }, 3000) */


            let flds = [];

            let exclude = ["CREDAT", "ERNAM", "MANDT", "CHADAT", "CHANAM", "ACTIVE", "id", "delete", "save", "that"];

            // obter relação de campos com base no regitro selecionado
            for (const field in params) {

                if (exclude.find(e => e === field || e === field.field)) continue;

                if (params.that.foreignKeys && params.that.foreignKeys.find(e => e[field.split('.')[0]])) continue;

                let vals = params.that.context.find(e => (e.field.split('.')[0] === field.split('.')[0] || e === field) && (e.foreignKey === undefined || e.foreignKey === false))

                if (!vals || (vals && !vals.field)) {
                    vals = { field: field }
                }

                if (flds.find(f => f.field.split('.')[0] === vals.field.split('.')[0])) continue;

                flds.push(vals);

                if (!vals)
                    params.that.context.push(field);

            }

            flds = flds.concat(params.that.context.filter(a => !flds.find(b => b.field === a.field) && (a.foreignKey === undefined || a.foreignKey === false)));

            new ScreenElements(this.that).set(flds, this);

            params.that.getView().byId(params.that.IDAPP).setBusy(false);

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