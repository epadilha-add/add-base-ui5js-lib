sap.ui.define([
    "../BaseController",
    "../ui/ScreenElements",
    "../ui/ScreenFactory",
    "sap/ui/richtexteditor/RichTextEditor",
    "sap/uxap/ObjectPageLayout"
], function (Object, ScreenElements, ScreenFactory) {
    "use strict";

    let MainView = {};
    let View = {};
    return Object.extend("add.ui5js.ui.View", {

        constructor: function (params) {

            sap.ui.core.BusyIndicator.show();

            MainView = params.that;
            View = this;
            /*******************************************
             * EXIT
             * ao selecionar a linha da sap.,
             * 
             *******************************************/
            if (MainView.getView().getController().beforeSelectLine)
                if (!MainView.getView().getController().beforeSelectLine(params, MainView, View)) return;

            this.setBtEvents();

            this.component = {};
            /*******************************************
             * 
             * Verifica se o componente será embedded 
             * ou navegará para uma segunda tela
             * 
             *******************************************/
            if (MainView.sectionsItems && MainView.sectionsItems.foreignKeys)
                this.component = MainView.sectionsItems.foreignKeys
                    .find(e => e.parent === MainView.IDAPP && (e.embedded || e.embedded === undefined))

            MainView.getView().setBusy(true);
            /***********************************************
             * 
             * Principal componente container para os objetos 
             * de tela.
             * 
             ************************************************/
            this.mainContent = new sap.ui.layout.form.SimpleForm({
                width: '100%',
                editable: true,
                layout: "ResponsiveGridLayout",
                columnsM: 1,
                columnsL: 1,
                columnsXL: 1
            });
            /**********************************************
             * 
             * Outros tipos de componentes de tela não compatíveis
             * com SimpleForm
             * 
             **********************************************/
            this.otherContent = new sap.m.Panel();

            this.sections = [{ mainContent: this.mainContent, otherContent: this.otherContent }]

            this.setId(params.id);
            if (!this.delete)
                this.delete = params.delete;

            if (!this.save)
                this.save = params.save;
            /***********************************************
             * 
             * ativar desativar
             * 
             ***********************************************/
            if (MainView.activeButton === undefined || MainView.activeButton === true)
                View.activeButton = new sap.m.Switch({
                    state: false,
                    tooltip: (params["ACTIVE"]) ? MainView.i18n("active") : MainView.i18n("deactivate"),
                    type: sap.m.SwitchType.Default,
                    change: function (oEvent) {
                        let values = MainView.getView().getModel(MainView.IDAPP + "PARAM").getData();
                        let selectValue = View.activeButton.getState();
                        let inpConf = new sap.m.Input();
                        MainView.dialogActive = new sap.m.Dialog({
                            contentWidth: "50%",
                            stretch: sap.ui.Device.system.phone,
                            title: "{i18n>statusConfirm}",
                            type: "Message",
                            content: [
                                new sap.m.Panel({
                                    //allowWrapping: true,
                                    content: [
                                        new sap.ui.layout.VerticalLayout({
                                            width: "100%",
                                            content: [
                                                new sap.m.Label({
                                                    text: "{i18n>write} '" + values[MainView.titleField] + "' {i18n>toConfirm}"
                                                }),
                                                inpConf]
                                        })]
                                })],

                            beginButton: new sap.m.Button({
                                text: "{i18n>confirm}",
                                press: async function () {

                                    if (MainView.doubleCheckOnActive || MainView.doubleCheckOnActive === true)
                                        if (inpConf.getValue() != values[MainView.titleField]) return;
                                    MainView.getView().setBusy(true);
                                    values["ACTIVE"] = selectValue;
                                    MainView.dialogActive.close();
                                    MainView.dialogActive.destroy();
                                    View.save();
                                }
                            }),
                            endButton: new sap.m.Button({
                                text: "{i18n>cancel}",
                                press: function (e) {
                                    MainView.getView().setBusy(false);
                                    var state = View.activeButton.getState();
                                    View.activeButton.setState((state) ? false : true);
                                    View.activeButton.setTooltip((state) ? MainView.i18n("deactivate") : MainView.i18n("active"));
                                    MainView.dialogActive.close();
                                    MainView.dialogActive.destroy();
                                }
                            })
                        })

                        MainView.getView().addContent(MainView.dialogActive);

                        MainView.dialogActive.open();
                    }
                })
            else
                params.ACTIVE = true;

            if (MainView.upButton || MainView.upButton === undefined)
                this.upButton = new sap.m.Button( {
                    icon: 'sap-icon://slim-arrow-up', tooltip: '{i18n>openWindow}', visible: true, press: (oEvent) => {

                        let urlParams = new URLSearchParams(window.location.search);
                        urlParams.set('app', MainView.IDAPP);
                        if (params.id)
                            urlParams.set('id', params.id);
                        urlParams.set('tb', "0"); //"turn-off toolbar"
                        urlParams.set('nIO', "1"); // "turn-on navIfOne"

                        window.open("?" + urlParams.toString());
                        return;

                    }
                })

            let buttons = [];

            if (MainView.edit === true || MainView.edit === undefined) {
                buttons = [
                    new sap.m.Button({
                        icon: "sap-icon://delete",
                        text: "{i18n>delete}",
                        type: sap.m.ButtonType.Transparent,//type: "Reject",
                        press: () => {

                            View.delete();
                            return;

                            this.delete(this.getId());
                        }
                    }),
                    this.activeButton,
                    new sap.m.Button({
                        icon: "sap-icon://save",
                        type: sap.m.ButtonType.Transparent,
                        text: "{i18n>save}",
                        press: async (oEvent) => {

                            View.save();
                            return;

                            await this.save(params);
                        }
                    })

                ];
            }

            if (MainView.getView().getController().moreButtonsView) {
                //retornar Array
                buttons = MainView.getView().getController().moreButtonsView(buttons, params, MainView, View);
            }

            View.sections = [];

            if (this.component && (this.component.embedded === undefined || this.component.embedded === true)) {
                /***************************************************
                 * 
                 * se for um componente embedded, considerar aba
                 * 
                 **************************************************/
                if (!MainView.infoSections) MainView.infoSections = [];

                let secs = MainView.context.find(c => c?.section?.index === 0 || !c.section);

                if (secs)
                    View.sections[0] = this.getContainer(0);

                secs = null;

                secs = MainView.context.find(c => c?.section?.index > 0);

                if (secs) {

                    if (!(secs instanceof Array)) secs = [secs];

                    for (const sec of secs) {
                        View.sections[sec.section.index || View.sections.length - 1] = this.getContainer(sec.section.index, sec);
                    }
                }
            }


            if (MainView.sectionsItems) {
                /*********************************************************
                   Possibilita incluir mais seções a partir do controller.
                   Type: sap.uxap.ObjectPageSection
                   Esse parametro tem prioridade
                 *********************************************************/
                View.sections = View.sections.concat(MainView.sectionsItems.items);
            }

            this.title = new sap.m.Label({
                text: "{i18n>title} / " + params[MainView.titleField] || MainView.titleField || null
            });

            this.avatar = new sap.m.Avatar({
                src: params.LOGO || params.ICON || MainView.icon || params.imageURI,
                displaySize: sap.m.AvatarSize.XS,
                //backgroundColor: sap.m.AvatarColor.Accent1,
                tooltip: MainView.IDAPP + " / " + MainView.collection + " ID: " + params.id
            });

            this.avatar.ondblclick = (oEvent) => {
                if (MainView.getView().getController().ondblclickAvatarView)
                    MainView.getView().getController().ondblclickAvatarView(oEvent, params, MainView, View);
            }

            View.Bar = new sap.m.Bar({
                contentLeft: [MainView.btBack, this.avatar, this.title],
                contentMiddle: [this.upButton],
                contentRight: buttons
            })

            this.Page = new sap.uxap.ObjectPageLayout({
                useIconTabBar: true,
                isChildPage: false,
                busyIndicatorDelay: 10,
                showTitleInHeaderContent: false,
                alwaysShowContentHeader: false,
                showFooter: true,
                headerTitle: null,
                headerContent: [View.Bar],
                navigate: (oEvent) => {

                    /*********************************************
                     * carregar demais sections ou componentes
                     ********************************************/
                    if (MainView.onNavigateSection)
                        if (!MainView.onNavigateSection(oEvent, MainView, View)) return;

                    _navigate(oEvent);

                },
                sections: View.sections
            });

            if (MainView.getView().getController().beforeRenderingView)
                MainView.getView().getController().beforeRenderingView(params, MainView, View);
            /*********************************************
             * construir elementos de tela
             ********************************************/
            new ScreenElements(MainView).set(MainView.context, View).then(() => {
                View.Page.setBusy(false);
                MainView.getView().setBusy(false);
                if (MainView.getView().getController().afterRenderingView)
                    MainView.getView().getController().afterRenderingView(params, MainView, View);
            });

            sap.ui.core.BusyIndicator.hide();

            if (MainView.getView().getController().afterSelectLine)
                MainView.getView().getController().afterSelectLine(params, MainView, View);

            return this;

            function _navigate(oEvent) {
                /*****************************************
                * carregar demais sections ou componentes
                ******************************************/

                /**
                 * verifica se o componente é utilizado mais de uma vez
                 * se sim, deve ser reconstruído para cada utilização
                 */
                let instances = sap.ui.getCore()
                    .getModel("foreignKey" + MainView.rootComponent);

                if (!instances) return;


                instances = instances.getData().filter(l => l.idapp === oEvent.getSource().getSelectedSection().split('--_')[1]).length || 0;

                /**
                * armazenta o atual componente para o caso de haver mudança
                * de registro
                */
                MainView.secId = oEvent.getSource().getSelectedSection().split('--_')[1] || undefined;

                /**
                * se não encontrou, é porque trata-se da primeira aba, dados básicos
                */
                if (!MainView.secId) return;

                const appId = oEvent.getSource().getSelectedSection();
                MainView.rootParent = oEvent.getSource().getSelectedSection().split('--_')[0];

                if (MainView.id !== params.id || !MainView[appId] || instances > 1) {


                    /**
                    * o componente só é reconstruído se:
                    *  - mudar o o registro ( MainView.id !== params.id )
                    *  - a tela ainda não foi construída ( !MainView[appId] )
                    *  - ou existir o mesmo componente mais de uma vez no mesmo app (instances > 1)
                    */
                    let sec = oEvent.getSource().getSections().find(s => s.getId() === oEvent.getSource().getSelectedSection());
                    sec.setBusy(true);
                    sec.getSubSections()[0].destroyBlocks()
                    /**
                     * embora destruído acima, o componente será recriado com o mesmo Id
                     */
                    sec.getSubSections()[0].addBlock(
                        new ScreenFactory(MainView).create({
                            name: MainView.secId,
                            key: MainView.secId,
                            idapp: MainView.rootParent
                        }))

                    /* 
                    *  esse falg está sendo considerado em MainView / pressToNav, 
                    */
                    MainView[appId] = true;

                    //setTimeout(() => {
                    sec.setBusy(false);
                    //}, 1500)

                }
                MainView.id = params.id;
            }
        },

        setId(Id) {
            this.id = Id;
        },

        save() {
            sap.ui.getCore().byId(MainView.rootApp)[MainView.rootComponent].saves[0]().then((res) => {
                if (res)
                    try {
                        sap.ui.getCore().byId(MainView.rootApp)[MainView.rootComponent].saves.splice(0, 1);
                    } catch (error) {
                    }
                MainView.getView().setBusy(false);
            })
        },

        delete() {
            sap.ui.getCore().byId(MainView.rootApp)[MainView.rootComponent].deletes[0]().then((res) => {

                if (res)
                    try {
                        sap.ui.getCore().byId(MainView.rootApp)[MainView.rootComponent].deletes.splice(0, 1);
                    } catch (error) {
                    }
                MainView.getView().setBusy(false);
            });

        },

        setBtEvents() {
            try {
                sap.ui.getCore().byId(MainView.rootApp)[MainView.rootComponent].saves.unshift(MainView.save);
                sap.ui.getCore().byId(MainView.rootApp)[MainView.rootComponent].deletes.unshift(MainView.delete);
            } catch (error) {
                alert(error);
            }

            this.nivel = sap.ui.getCore().byId(MainView.rootApp)[MainView.rootComponent].saves.length;
        },

        removeBtEvents() {
            try {
                let i = sap.ui.getCore().byId(MainView.rootApp)[MainView.rootComponent].saves.length;
                sap.ui.getCore().byId(MainView.rootApp)[MainView.rootComponent].saves.splice(i, 1);
                sap.ui.getCore().byId(MainView.rootApp)[MainView.rootComponent].deletes.splice(i, 1);
            } catch (err) {
                console.error("removeBtEvents " + erro)
            }
        },

        getId() {
            return this.id;
        },

        setModel(oModel, nameModel) {
            MainView.getView().setModel(oModel, nameModel);
        },

        addContent(content, section) {

            let index = (section) ? (section.index || 0) : 0;

            View.sections[index].getSubSections()[0].getBlocks()[0].getContent()[0].addContent(content);

        },

        addOtherContent(content, section) {

            let index = (section) ? (section.index || 0) : 0;

            View.sections[index].getSubSections()[0].getBlocks()[0].getContent()[1].addContent(content);

        },

        setHeaderData: function (data) {

            this.Page.getObjectPageHeader().setObjectTitle(data.header)
        },

        getContainer(indexSection, sec) {

            let infoSection = {}
            if (MainView.infoSections && MainView.infoSections instanceof Array) {
                infoSection = MainView.infoSections.find(s => s.index === indexSection) || {};
            } else if (MainView.infoSections) {
                infoSection = MainView.infoSections;
            }

            if (!sec) sec = 0;

            let subSec = [new sap.uxap.ObjectPageSubSection({
                tooltip: MainView.IDAPP,
                mode: sap.uxap.ObjectPageSubSectionMode.Expanded,
                validateFieldGroup: () => { },
                blocks: new sap.m.Panel({
                    tooltip: MainView.IDAPP,
                    content:
                        [new sap.ui.layout.form.SimpleForm({
                            width: '100%',
                            editable: true,
                            layout: "ResponsiveGridLayout",
                            columnsM: 1,
                            columnsL: 1,
                            columnsXL: 1
                        }), new sap.m.Panel()
                        ]
                })
                // moreBlocks: new sap.m.Label({ text: "Anbother block" })
            })]



            return new sap.uxap.ObjectPageSection({
                showTitle: false,
                title: infoSection.title || ((sec === 0) ? "{i18n>basicData}" : infoSection.title || sec.SCRTEXT_S || "{i18n>basicData}"),
                tooltip: infoSection.tooltip || sec.SCRTEXT_L,
                subSections: subSec
            })
        }
    })

});