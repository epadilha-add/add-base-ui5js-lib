sap.ui.define([
    "../BaseController",
    "../ui/ScreenElements",
    "../ui/ScreenFactory",
    "sap/ui/richtexteditor/RichTextEditor",
    "sap/uxap/ObjectPageLayout",
    "sap/ui/table/Table",
], function (Object, ScreenElements, ScreenFactory) {
    "use strict";

    let MainView = {};
    let ViewTable = {};
    let promises = [];
    return Object.extend("add.ui5js.ui.ViewTable", {

        constructor: function (params) {

            MainView = params.that;
            ViewTable = this;

            ViewTable.context = [];

            ViewTable.Screen = new ScreenElements(ViewTable);

            for (const key in params.DATA[0]) {
                ViewTable.context.push({ field: key })
            }

            ViewTable.table = new sap.ui.table.Table(MainView.propTable);

            ViewTable.table.bindRows('/');

            promises = [Promise.resolve(ViewTable.Screen
                .getStruc(ViewTable.context, true).then((data) => {
                    if (!data) { console.error("ERR_GET_STRUCT_FAILED"); return }

                    ViewTable.fieldcat = JSON.parse(data);

                    var oControl, oColumn;

                    ViewTable.fieldcat.forEach(struc => {

                        let label = struc.SCRTEXT_S || struc.SCRTEXT_M || struc.SCRTEXT_L || struc.SCRTEXT_S;

                        oControl = new sap.m.Text({ text: '{' + struc.FIELD + '}', wrapping: false });

                        oColumn = new sap.ui.table.Column(
                            {
                                label: new sap.m.Text({ text: label }),
                                template: oControl,
                                tooltip: struc.FIELD,

                                sortProperty: struc.FIELD,
                                filterProperty: struc.FIELD,
                                ...MainView.propColumn
                                // width: "120px"
                            });

                        oColumn.setCreationTemplate(new sap.m.Input({ value: '{' + struc.FIELD + '}' }));

                        ViewTable.table.addColumn(oColumn);

                        /*    ViewTable.table.addColumn(new sap.ui.table.Column({
                               label: struc.SCRTEXT_M || struc.SCRTEXT_M || struc.SCRTEXT_L || struc.SCRTEXT_S,
                               //tooltip: (struc.SCRTEXT_L) ? struc.SCRTEXT_L : (struc.SCRTEXT_S),
                               sortProperty: struc.FIELDNAME,
                               filterProperty: struc.FIELDNAME,
                               autoResizable: true,
                               visible: (struc.VISIBLE == "X") ? true : false,
                               // template: this.formatter.checkTypeFieldAndCreate(this.that, struc, this.that.models.IDAPP + 'LIST>', null, 'L')
                           })) */
                    });

                }))]
            Promise.all(promises);
            /*******************************************
             * EXIT
             * ao selecionar a linha da sap.,
             * 
             *******************************************/
            if (MainView.onSelectLine)
                if (!MainView.onSelectLine(params, MainView)) return;

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

            if (MainView.upButton || MainView.upButton === undefined)
                this.upButton = new sap.m.Button({
                    icon: 'sap-icon://slim-arrow-up', tooltip: '{i18n>openWindow}', visible: true, press: (oEvent) => {

                        let urlParams = new URLSearchParams(window.location.search);
                        urlParams.set('app', MainView.IDAPP);
                        urlParams.set('id', params.id);
                        urlParams.set('tb', "0"); //"turn-off toolbar"
                        urlParams.set('nIO', "1"); // "turn-on navIfOne"

                        window.open("?" + urlParams.toString());
                        return;

                        if (!ViewTable.messageDialog)
                            ViewTable.messageDialog = new sap.m.Dialog({
                                verticalScrolling: false,
                                horizontalScrolling: false,
                                showHeader: false,
                                contentHeight: "100%",
                                contentWidth: "100%",
                                //type: sap.m.DialogType.Message,
                                content: new sap.m.Page({
                                    showHeader: false,
                                    enableScrolling: false,
                                    content: new sap.ui.core.HTML({
                                        preferDOM: true,
                                        sanitizeContent: false,
                                        content: "<iframe height='100%' width='100%' src='/?" + urlParams.toString() + "'</iframe>"
                                    })
                                }),

                                leftButton: new sap.m.Button({
                                    text: "Ok",
                                    press: function () {
                                        ViewTable.messageDialog.close()
                                    }
                                })

                            });

                        MainView.mainContent.back();

                        ViewTable.messageDialog.open();

                    }
                })

            let buttons = [];

            if (MainView.edit === true || MainView.edit === undefined) {


            }

            ViewTable.sections = [];

            ViewTable.headerToolbar = new sap.m.Toolbar({
                design: "Transparent",
                content: []
            })

            if (this.component && (this.component.embedded === undefined || this.component.embedded === true)) {
                /***************************************************
                 * 
                 * se for um componente embedded, considerar aba
                 * 
                 **************************************************/
                if (!MainView.infoSections) MainView.infoSections = [];

                ViewTable.sections[0] = this.getContainer(0);

                let secs = MainView.context.find(c => c.section);

                if (secs) {

                    if (!(secs instanceof Array)) secs = [secs];

                    for (const sec of secs) {
                        ViewTable.sections[sec.section.index || ViewTable.sections.length] = this.getContainer(sec.section.index, sec);
                    }
                }
            }


            if (MainView.sectionsItems) {
                /*********************************************************
                   Possibilita incluir mais seções a partir do controller.
                   Type: sap.uxap.ObjectPageSection
                   Esse parametro tem prioridade
                 *********************************************************/
                ViewTable.sections = ViewTable.sections.concat(MainView.sectionsItems.items);
            }

            this.title = new sap.m.Label({
                text: params[MainView.title] || MainView.title || null
            });

            this.avatar = new sap.m.Avatar({
                src: MainView.icon,
                displaySize: sap.m.AvatarSize.XS,
                //backgroundColor: sap.m.AvatarColor.Accent1,
                tooltip: MainView.IDAPP
            });

            this.avatar.ondblclick = () => {

            }

            this.Bar = new sap.m.Bar({
                contentLeft: [MainView.btBack, this.avatar, this.title],
                contentMiddle: [this.upButton],
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
                headerContent: [this.Bar],
                navigate: (oEvent) => {
                    /*********************************************
                     * carregar demais sections ou componentes
                     ********************************************/
                    if (MainView.onNavigateSection)
                        if (!MainView.onNavigateSection(oEvent, MainView, ViewTable)) return;

                    _navigate(oEvent);
                },
                sections: ViewTable.sections
            });
            /*********************************************
             * construir elementos de tela
             ********************************************/
            /*         new ScreenElements(MainView).set(MainView.context, View).then(() => {
                        ViewTable.Page.setBusy(false);
                        MainView.getView().setBusy(false);
                    }); */

            sap.ui.core.BusyIndicator.hide();

            MainView.getView().setBusy(false);

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
                    .getModel("foreignKey" + MainView.rootComponent)
                    .getData().filter(l => l.idapp === oEvent.getSource().getSelectedSection().split('--_')[1]).length;

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
            })
        },

        delete() {
            sap.ui.getCore().byId(MainView.rootApp)[MainView.rootComponent].deletes[0]().then((res) => {

                if (res)
                    try {
                        sap.ui.getCore().byId(MainView.rootApp)[MainView.rootComponent].deletes.splice(0, 1);
                    } catch (error) {
                    }
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

            ViewTable.sections[index].getSubSections()[0].getBlocks()[0].getContent()[0].addContent(content);

        },

        addOtherContent(content, section) {

            let index = (section) ? (section.index || 0) : 0;

            ViewTable.sections[index].getSubSections()[0].getBlocks()[0].getContent()[1].addContent(content);

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
                mode: sap.uxap.ObjectPageSubSectionMode.Expanded,
                validateFieldGroup: () => { },
                blocks: new sap.m.Panel({
                    //headerToolbar: ViewTable.headerToolbar,
                    content:
                        [
                            ViewTable.table,
                            new sap.m.Panel({
                                content: []
                            })
                        ]
                })

            })]

            return new sap.uxap.ObjectPageSection({
                showTitle: false,
                title: (sec === 0) ? "{i18n>basicData}" : infoSection.title || sec.SCRTEXT_S || "{i18n>basicData}",
                tooltip: infoSection.tooltip || sec.SCRTEXT_L,
                subSections: subSec
            })
        }
    })

});