sap.ui.define([
    "../BaseController",
    "../ui/ScreenElements",
    "../ui/ScreenFactory",
    "../commons/Helpers",
    "sap/ui/richtexteditor/RichTextEditor",
    "sap/uxap/ObjectPageLayout",
    "sap/ui/table/Table",
], function (Object, ScreenElements, ScreenFactory, Helpers) {
    "use strict";

    let MainView = {};
    let ViewTable = {};
    let promises = [];
    return Object.extend("add.ui5js.ui.ViewTable", {

        constructor: function (that) {

            MainView = that;

            MainView.Helpers = Helpers;

            MainView.tableParts = this.tableParts;

            MainView.execute = this.execute;

            MainView.navToViewTable = this.navToViewTable

            MainView.setModelTable = this.setModelTable;

            MainView.setSelectScreen = this.setSelectScreen;

            MainView.setToolBarTable = MainView.getView().getController()?.setToolBarTable;

            MainView._getselectScreenFilters = () => {

                let selectScreen = {};
                /**
                 * parameters prepare - screenSelect
                 */
                for (const field of MainView.fieldcat) {

                    switch (field.REFTYPE) {
                        case 'LB':
                            selectScreen[field.REFKIND || field.field] = sap.ui.getCore().byId(field.idUi5).getSelectedKey();
                            if (selectScreen[field.REFKIND || field.field].length === 0)
                                selectScreen[field.REFKIND || field.field] = '';
                            break;
                        case 'MC':
                            selectScreen[field.REFKIND || field.field] = {
                                $in: sap.ui.getCore().byId(field.idUi5).getSelectedKeys()
                            }
                            if (selectScreen[field.REFKIND || field.field].$in.length === 0)
                                selectScreen[field.REFKIND || field.field] = '';
                            break;
                        case 'DR':

                            if (!sap.ui.getCore().byId(field.idUi5).getValue()) {
                                selectScreen[field.field] = ''; continue;
                            }

                            let from = sap.ui.core.format.DateFormat.getDateInstance({
                                pattern: "YYYYMMdd"
                            }).format(sap.ui.getCore().byId(field.idUi5).getFrom());

                            let to = sap.ui.core.format.DateFormat.getDateInstance({
                                pattern: "YYYYMMdd"
                            }).format(sap.ui.getCore().byId(field.idUi5).getTo());

                            selectScreen[field.field] = {
                                $gte: parseInt(from),
                                $lte: parseInt(to)
                            }

                            break;
                        default:
                            selectScreen[field.field] = sap.ui.getCore().byId(field.idUi5).getValue();
                            break;
                    }
                }
                return selectScreen;
            }

            MainView.headerToolbar = new sap.m.Toolbar({
                design: "Transparent",
                content: [
                    /*  MainView.avatar,
                     new sap.m.Label({ text: MainView.title }), */
                    new sap.m.Button(
                        {
                            icon: "sap-icon://away",
                            tooltip: "{i18n>execute}",
                            press: MainView.execute
                        }).addStyleClass("sapUiSmallMarginEnd"),
                    new sap.m.ToolbarSeparator(),
                    new sap.m.Button(
                        {
                            blocked: true,
                            icon: "sap-icon://date-time",
                            text: "{i18n>plan}",
                            press: () => { }
                        }).addStyleClass("sapUiSmallMarginEnd"),
                    new sap.m.Button(
                        {
                            blocked: false,
                            icon: "sap-icon://save",
                            text: "{i18n>save}",
                            tooltip: "{i18n>saveLocalVariantTootil}",
                            press: () => {
                                MainView.Helpers
                                    .openDialogToSave(MainView, MainView.IDAPP, 'SC', MainView._getselectScreenFilters());
                            }
                        }),
                    new sap.m.Button(
                        {
                            visible: false,
                            icon: "sap-icon://customize",
                            text: "{i18n>variants}",
                            tooltip: "{i18n>variantsTooltip}",
                            press: () => {
                                MainView.Helpers
                                    .openDialogToList(MainView, MainView.IDAPP, 'SC');
                            }
                        })
                ]
            })

            return this;
        },
        execute: async function (oEvent) {

            MainView.selectScreenFilters = MainView._getselectScreenFilters();

            if (MainView.obligatoryCheck().checkByData(MainView.selectScreenFilters) === false) return;

            MainView.selectScreen.setBusy(true);

            MainView.headerToolbar.setBlocked(true);

            for (const key in MainView.selectScreenFilters) {
                if (!MainView.selectScreenFilters[key] || MainView.selectScreenFilters[key] === null)
                    delete MainView.selectScreenFilters[key];
            }

            let params = {
                "method": "POST",
                //"timeout": 500000,
                "actionName": MainView.collection + "." + MainView.service || ".list",
                "params": {
                    "pageSize": MainView.pageSize || 100,
                    "query": MainView.selectScreenFilters
                }, ...MainView.callParams

            }

            await MainView.callService.postSync("add", params)
                .then((res) => {

                    if (res) {
                        res = JSON.parse(res);
                    } else {
                        throw new TypeError("ERR_TIMEOUT");
                    }

                    if (MainView.service === 'list') {
                        res.DATA = res.rows;
                    }

                    if (res && (res.DATA?.length === 0 || res.length === 0)) {
                        MainView.headerToolbar.setBlocked(false);
                        MainView.selectScreen.setBusy(false);
                        MainView.message("dataNotFound");
                        return;
                    }

                    if (MainView.afterExecute)
                        res = MainView.afterExecute(res);

                    MainView.navToViewTable(res);
                    MainView.selectScreen.setBusy(false);
                    MainView.headerToolbar.setBlocked(false);

                }).catch((e) => {
                    MainView.headerToolbar.setBlocked(false);
                    MainView.selectScreen.setBusy(false);
                    throw e;
                })



        },
        navToViewTable: function (result) {

            result.that = MainView;

            if (!MainView.View || !MainView.View.Page) {
                //if (MainView.View) MainView.View.destroy();
                MainView.View = MainView.sc.factory(result, () => MainView.mainContent.back());
                MainView.mainContent.addPage(MainView.View.Page);
            } else {
                MainView.obligatoryCheck().setNoneAll();
                MainView.getView().getController()?.setTableTitle(MainView, MainView.View);
                MainView.data = result.DATA;
                MainView.setModelTable(MainView);
            }

            MainView.mainContent.to(MainView.View.Page);
        },
        tableParts: function (MainView) {

            return {
                toolBar: toolBar
            }


            function toolBar() {

                return {
                    setToolBar: setToolBar
                }

                async function setToolBar(table) {

                    table.setToolbar(new sap.m.Toolbar({
                        content: [
                            /**
                             * exmplo de botões  deverão ser implementados
                             * no controller
                             * REF: add.tax.operation.process
                             */
                            //_getMenuButton(),
                            //_getRefreshButton(),
                            //_getSeparatorButton(),
                            // _getExecuteButton(),
                            //_getLogButton(),
                        ]
                    }))

                    if (MainView.setToolBarTable)
                        MainView.setToolBarTable(table.getToolbar(), MainView, ViewTable);

                    //TOD: aqui incluir botões comuns da table, como configuração de colunas
                }
            }

        },
        setModelTable(MainView, line) {
            if (line >= 0) {
                let path = MainView.View.table.getContextByIndex(line).sPath;
                let oModel = MainView.View.table.getModel(MainView.IDAPP + 'tab');
                let obj = oModel.getProperty(path);
                obj = MainView.data[line];
                oModel.refresh(true);
            } else {
                let oModel = MainView.View.table.getModel(MainView.IDAPP + 'tab');
                if (oModel) {
                    oModel.setData(MainView.data);
                    oModel.refresh(true);
                } else {
                    MainView.View.table.setModel(new sap.ui.model.json.JSONModel(MainView.data), MainView.IDAPP + 'tab');
                }
            }
        },
        factory: function (params) {

            ViewTable = this;
            MainView.data = params.DATA;

            ViewTable.context = [];

            ViewTable.Screen = new ScreenElements(ViewTable);

            for (const key in params.DATA[0]) {
                ViewTable.context.push({ field: key })
            }

            ViewTable.table = new sap.ui.table.Table({
                //title: "Total : " + '{total}',
                ...MainView.propTable
            });

            if (MainView.getView().getController().setTableTitle)
                MainView.getView().getController()?.setTableTitle(MainView, ViewTable);

            if (MainView.tableParts(MainView)?.toolBar()?.setToolBar)
                MainView.tableParts(MainView)?.toolBar()?.setToolBar(ViewTable.table);

            ViewTable.table.setModel(new sap.ui.model.json.JSONModel(params.DATA), MainView.IDAPP + 'tab');

            ViewTable.table.bindRows(MainView.IDAPP + 'tab>/');

            promises = [Promise.resolve(ViewTable.Screen
                .getStruc(ViewTable.context, true).then((data) => {
                    if (!data) { console.error("ERR_GET_STRUCT_FAILED"); return }

                    ViewTable.fieldcat = (typeof data === 'string') ? JSON.parse(data) : data;

                    if (MainView.getView().getController().setRowSettingsTemplate)
                        MainView.getView().getController()?.setRowSettingsTemplate(ViewTable.table);

                    ViewTable.fieldcat.forEach(field => {

                        if (MainView.getView().getController().addColumnTable) {

                            MainView.getView().getController()?.addColumnTable(field, ViewTable, MainView);

                        } else {

                            let oControl = new sap.m.Text({ text: '{' + MainView.IDAPP + 'tab>' + field.FIELD + '}', wrapping: false });
                            let label = field.SCRTEXT_S || field.SCRTEXT_M || field.SCRTEXT_L || field.DESCR;
                            let oColumn = new sap.ui.table.Column(
                                {
                                    width: 'auto',
                                    minWidth: 48,
                                    label: new sap.m.Label({ text: label, wrapping: false }),
                                    autoResizable: true,
                                    template: oControl,
                                    tooltip: field.SCRTEXT_L + " " + field.FIELD,
                                    sortProperty: field.FIELD,
                                    filterProperty: field.FIELD,
                                    autoResizable: true,
                                    //grouped: true

                                });

                            oColumn.setCreationTemplate(new sap.m.Input({ value: '{' + MainView.IDAPP + 'tab>' + field.FIELD + '}' }));

                            ViewTable.table.addColumn(oColumn);
                        }

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
            /*        this.mainContent = new sap.ui.layout.form.SimpleForm({
                       width: '65%',
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
            //this.otherContent = new sap.m.Panel();

            //this.sections = [{ mainContent: this.mainContent, otherContent: this.otherContent }] */

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
        getContent: function (promises) {

            MainView.selectScreen = new sap.m.Panel({
                headerText: null,//new sap.m.Label({ text: MainView.title }),
                headerToolbar: MainView.headerToolbar,
                content: new sap.ui.layout.form.SimpleForm({
                    width: '65%',
                    editable: true,
                    layout: "ResponsiveGridLayout",
                    columnsM: 2,
                    columnsL: 2,
                    columnsXL: 2
                })
            }
            );

            MainView.selectScreen.setBusyIndicatorDelay(50);
            MainView.selectScreen.setBusy(true);

            Promise.all(promises).then(async (data) => {

                new ScreenElements(MainView).set(MainView.context, MainView);

                if (MainView.Helpers) {

                    MainView.selectScreenFilters =
                        await MainView.Helpers
                            .getLastUsedVariant(MainView.IDAPP, 'SC', MainView);

                    if (MainView.selectScreenFilters) {

                        MainView.headerToolbar.getContent()[4].setVisible(true);

                        MainView.setSelectScreen(MainView.selectScreenFilters?.content);

                    }
                } else { throw new TypeError("ERR_HELPERS_NOT_FOUND_IN_CONTROLLER") }
                MainView.selectScreen.setBusy(false);
            })

            return MainView.selectScreen;

        },
        setSelectScreen(content) {
            for (const fld in content) {

                let el = sap.ui.getCore().byId(MainView.fieldcat.find(f => fld === (f.REFKIND || f.FIELD))?.idUi5);

                switch (el?.REFTYPE) {
                    case 'LB':
                        el.setSelectedKey(content[fld]);
                        break;
                    case 'MC':
                        el.setSelectedKeys(content[fld]?.$in);
                        break;
                    case 'DR':
                        let f = String(content[fld]?.$gte);
                        let t = String(content[fld]?.$lte);
                        el.setFrom(new Date(
                            parseInt(f.substring(0, 4)),
                            parseInt(f.substring(4, 5)),
                            parseInt(f.substring(6, 8))
                        ));
                        el.setTo(new Date(
                            parseInt(t.substring(0, 4)),
                            parseInt(t.substring(4, 5)),
                            parseInt(t.substring(6, 8))
                        ));
                        break;
                    default:
                        if (el)
                            el.setValue(content[fld]);
                        break;
                }
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
                    content: ViewTable.table

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