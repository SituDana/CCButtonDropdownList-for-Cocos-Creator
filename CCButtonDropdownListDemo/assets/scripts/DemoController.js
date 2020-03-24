let ButtonDropdownList = require("ButtonDropdownList");

cc.Class({
    extends: cc.Component,

    ctor() {
        this._dataList1 = [];
        this._dataList2 = [];
        this._dataList3 = [];
    },

    statics: {

    },

    properties: {
        dropdownList: cc.Node,
        dropdownListWithTitle: cc.Node,
        dropdownListWithSelection: cc.Node,
        optionButtonTemplate: cc.Prefab,
        selectedOptionButtonTemplate: cc.Prefab,
        titleOptionTemplate: cc.Prefab,
        lbSelection1: cc.Label,
        lbSelection2: cc.Label,
        lbSelection3: cc.Label
    },

    onLoad() {
        // 初始化下拉列表
        this.initDropdownList();

        this.initDropdownListWithTitleTemplate();

        this.initDropdownListWithSelectionTemplate();
    },

    initDropdownList(){
        let dropdownListController = this.dropdownList.getComponent("ButtonDropdownList");
        dropdownListController.initDropdownList(this.optionButtonTemplate, {
            placeHolder: '请选择',
            paddingLeftAndRight: 8,
            paddingTopAndBottom: 10,
            spacingY: 5,
            marginTop: 0,
            hideSelectedOption: true,
            optionButtonSize: new cc.size(120, 40)
        });

        let dataList = [];
        for(let i = 0; i < 10; i++){
            dataList.push({
                key: i +'',
                label: '选项 ' + i
            });
        }
        this._dataList1 = dataList;
        dropdownListController.addSelectionChangedEventHandler((selectionData)=>{
            this.lbSelection1.string = 'Selected: '+ selectionData.key;
        }, this);
        dropdownListController.setOptionDataList(dataList, '1');
    },

    initDropdownListWithTitleTemplate(){
        let dropdownListWithTitleController = this.dropdownListWithTitle.getComponent("ButtonDropdownList");
        dropdownListWithTitleController.initDropdownList(this.optionButtonTemplate, {
            placeHolder: '请选择',
            paddingLeftAndRight: 8,
            paddingTopAndBottom: 10,
            spacingY: 5,
            marginTop: 0,
            maxListHeight: 220,
            hideSelectedOption: true,
            optionButtonSize: new cc.size(120, 40)
        }, this.titleOptionTemplate);

        let dataList = [];
        for(let i = 0; i < 10; i++){
            dataList.push({
                key: i +'',
                label: '选项 ' + i
            });
        }
        this._dataList2 = dataList;
        dropdownListWithTitleController.addSelectionChangedEventHandler((selectionData)=>{
            this.lbSelection2.string = 'Selected: '+ selectionData.key;
        }, this);
        dropdownListWithTitleController.setOptionDataList(dataList);
    },

    initDropdownListWithSelectionTemplate(){
        let dropdownListWithSelectionController = this.dropdownListWithSelection.getComponent("ButtonDropdownList");
        dropdownListWithSelectionController.initDropdownList(this.optionButtonTemplate, {
            placeHolder: '请选择',
            paddingLeftAndRight: 8,
            paddingTopAndBottom: 10,
            spacingY: 5,
            marginTop: 0,
            maxListHeight: 220,
            hideSelectedOption: false,
            optionButtonSize: new cc.size(120, 40)
        }, this.titleOptionTemplate, this.selectedOptionButtonTemplate);

        let dataList = [];
        for(let i = 0; i < 10; i++){
            dataList.push({
                key: i +'',
                label: '选项 ' + i
            });
        }
        this._dataList3 = dataList;
        dropdownListWithSelectionController.setOptionDataList(dataList);
        this.dropdownListWithSelection.on(ButtonDropdownList.Events.SELECTTION_CHANGED, (event)=>{
            this.lbSelection3.string = 'Selected: '+ event.selection.key;
        }, this);
        dropdownListWithSelectionController.setSelection('2', true);
    },
});