var ButtonDropdownList = cc.Class({
    extends: cc.Component,

    ctor() {
        this.buttonList = [];
    },

    statics: {
        Events: {
            SELECTTION_CHANGED: 1, // 选项变更事件
        }
    },

    properties: {
        optionButtonTemplate: cc.Prefab,    // 选项按钮模板(Button)
        titleButtonTemplate: {              // 头部按钮模板(Button)，如果不设置，默认使用optionButtonTemplate
            default: null,
            type: cc.Prefab,
        },
        selectedOptionButtonTemplate: {     // 列表中选中的按钮模板(Button)，如果不设置，默认使用optionButtonTemplate
            default: null,                  // 只有当 hideSelectedOption = false 的时候有效
            type: cc.Prefab,
        },
        placeHolder: '',                    // 当placeholder为空的时候，默认选项为列表第一个
        hideSelectedOption: false,          // 打开列表的时候，当前选中的选项是否在列表中显示
        paddingLeftAndRight: 5,             // 下拉框两侧边距
        paddingTopAndBottom: 5,             // 下拉框上下边距
        spacingY: 3,                        // 选项之间间隙
        marginTop: 0,                       // 下拉列表距标题按钮距离
        maxListHeight: 0,                   // 列表限高
        listBackground: cc.SpriteFrame,     // 下拉列表背景图片
        optionButtonSize: cc.Size,          // 下来选项按钮大小
        mask: cc.Sprite,                    // 遮罩
        titleContainer: cc.Node,            // 头部选项容器
        listBacgroundNode: cc.Node,         // 下拉选项背景节点
        listContent: cc.Node,               // 下拉列表内容容器 scrollview

        _foldFlg: true,                     // 列表是否展开标识
        _selectionChangedHandler: null,     // 选项变更事件
        _handlerThisObj: null,              // 选项变更事件this对象
        _optionDataList: null,              // 选项数据队列
        _initialized: false,                // 初始化完成
        _content: null,                     // 列表滚动区域
        _selectedKey: '',                    // 下拉列表当前选项
    },

    /**
     * 通过初始化方法传参的方式，初始化控件，建议在画面的onLoad方法中调用，
     * 相比在creator界面中设置参数，这种方式更易维护，不会因为与预制体控件保持同步而导致配置丢失或者重置。
     * @param {cc.Prefab} optionButtonTemplate 选项按钮模板(Button)
     * @param {{placeHolder?: String, 
        hideSelectedOption?: Boolean,
        paddingLeftAndRight?: Number,
        paddingTopAndBottom?: Number,
        spacingY?: Number,
        marginTop?: Number,
        maxListHeight?: Number,
        listBackground?: cc.SpriteFrame,
        optionButtonSize?: cc.Size,
        }} options

     *  placeHolder: 当placeholder为空的时候，默认选项为列表第一个
        hideSelectedOption: 打开列表的时候，当前选中的选项是否在列表中显示
        paddingLeftAndRight: 下拉框两侧边距 默认为5
        paddingTopAndBottom: 下拉框上下边距 默认为5
        spacingY: 选项之间间隙 默认为3
        marginTop: 下拉列表距标题按钮距离 默认为0
        maxListHeight: 列表限高 默认为0：不限制高度
        listBackground: 下拉列表背景图片
        optionButtonSize: 下来选项按钮大小
     * @param {cc.Prefab} titleButtonTemplate   头部按钮模板(Button)，如果不设置，默认使用optionButtonTemplate
     * @param {cc.Prefab} selectedOptionButtonTemplate  列表中选中的按钮模板(Button)，如果不设置，默认使用optionButtonTemplate,
     * 只有当 hideSelectedOption = false 的时候有效
     */
    initDropdownList(optionButtonTemplate, options, titleButtonTemplate, selectedOptionButtonTemplate) {
        this.optionButtonTemplate = optionButtonTemplate || this.optionButtonTemplate
        this.titleButtonTemplate = titleButtonTemplate || this.titleButtonTemplate;
        this.selectedOptionButtonTemplate = selectedOptionButtonTemplate || this.selectedOptionButtonTemplate;

        if (options) {
            this.placeHolder = !!options.placeHolder ? options.placeHolder : this.placeHolder;
            this.paddingLeftAndRight = options.paddingLeftAndRight === undefined ? this.paddingLeftAndRight : options.paddingLeftAndRight;
            this.paddingTopAndBottom = options.paddingTopAndBottom === undefined ? this.paddingTopAndBottom : options.paddingTopAndBottom;
            this.spacingY = options.spacingY === undefined ? this.spacingY : options.spacingY;
            this.marginTop = options.marginTop === undefined ? this.marginTop : options.marginTop;
            this.maxListHeight = options.maxListHeight === undefined ? this.maxListHeight : options.maxListHeight;
            this.hideSelectedOption = options.hideSelectedOption === undefined ? this.hideSelectedOption : options.hideSelectedOption;
            this.optionButtonSize = options.optionButtonSize || this.optionButtonSize;
            if (!this.optionButtonSize)
                this.optionButtonSize = new cc.size(this.node.width, this.node.height);
            if (options.listBackground)
                this.listBacgroundNode.getComponent(cc.Sprite).SpriteFrame = options.listBackground;
        }

        this._content = this.listContent.getComponent(cc.ScrollView).content;
    },

    /**
     * 获取下拉列表数据 [{key, label}]
     * @returns {Array}
     */
    getOptionDataList() {
        return this._optionDataList;
    },

    /**
     * 获取当前选中的key
     * @returns {String}
     */
    getSelectKey(){
        return this._selectedKey;
    },

    /**
     * 设定选中选项
     * @param {String} key 
     * @param {Boolean} triggerEvent    是否触发选项变更事件 默认 false
     */
    setSelection(key, triggerEvent) {
        let selection;
        for (let data of this._optionDataList) {
            if (data.key == key) {
                selection = data;
                break;
            }
        }
        this._initTitleButton(selection)

        if (true === triggerEvent) {
            if (this._selectionChangedHandler && this._handlerThisObj) {
                this._selectionChangedHandler.call(this._handlerThisObj, selection);
            } else {
                let event = new cc.Event(ButtonDropdownList.Events.SELECTTION_CHANGED, false);
                event.target = event.currentTarget = this;
                event.selection = selection;
                this.node.emit(ButtonDropdownList.Events.SELECTTION_CHANGED, event);
            }
        }
    },

    /**
     * 注册选项变更事件处理方法，如果注册了此事件，则不会触发emit(ButtonDropdownList.Events.SELECTTION_CHANGED)
     * @param {Function} handler 选项修改回调函数 function(selectionData)
     * @param {*} thisObj 回调函数this对象
     */
    addSelectionChangedEventHandler(handler, thisObj) {
        this._selectionChangedHandler = handler;
        this._handlerThisObj = thisObj;
    },

    /**
     * 初始化下拉列表数据
     * @param {Array} dataList 下拉列表数据 [{key, label}]
     * @param {String} selectedKey 下拉列表默认选项
     */
    setOptionDataList(dataList, selectedKey) {
        if (!dataList || dataList.length <= 0) {
            return;
        }
        this._optionDataList = dataList;
        for (let data of dataList) {
            data.enabled = true;
        }
        this._selectedKey = selectedKey || null;
    },

    onLoad() {
        if (!this._initialized) {
            this._initialized = true;
            this.node.getComponent(cc.Sprite).enabled = false;
            this.listBacgroundNode.parent = null;
            this.listBacgroundNode.getComponent(cc.Sprite).enabled = true;
            this.listContent.parent = null;
            this.mask.node.parent = null;
            this.mask.node.on(cc.Node.EventType.TOUCH_END, this._fold, this);

            if(this.titleContainer.childrenCount <= 0){
                if(!!this._selectedKey){
                    let selection;
                    for (let data of this._optionDataList) {
                        if (data.key == this._selectedKey) {
                            selection = data;
                            break;
                        }
                    }
                    this._initTitleButton(selection);
                } else {
                    this._initTitleButton();
                }
            } else {

            }
        }
    },

    /**
     * 初始化标题按钮
     * @param {*} selectionData 
     */
    _initTitleButton(selectionData) {
        // 显示默认选项
        if (!!selectionData && selectionData.key === this._selectedKey && this.titleContainer.childrenCount > 0) {
            return;
        }
        let titleContainer = this.titleContainer;
        if (titleContainer.childrenCount > 0) {
            titleContainer.children[0].off(cc.Node.EventType.TOUCH_END, this._onOptionTouched, this);
            this.titleContainer.removeAllChildren();
        }

        let dataList = this._optionDataList;
        let titleData;
        if (!!selectionData) {
            titleData = selectionData;
            this._selectedKey = titleData.key;
        } else if (!!this.placeHolder) {
            titleData = {
                key: null,
                label: this.placeHolder
            };
        } else if (!dataList || dataList.length <= 0) {
            titleData = dataList[0];
            this._selectedKey = titleData.key;
        } else {
            titleData = {
                key: null,
                label: ''
            };
        }
        let titleButton = this._createOneOption(titleData, true);
        this.titleContainer.addChild(titleButton);
    },

    /**
     * 重置
     */
    reset() {
        this._fold();
        let titleContainer = this.titleContainer;
        if (titleContainer.childrenCount > 0) {
            titleContainer.children[0].off(cc.Node.EventType.TOUCH_END, this._onOptionTouched, this);
        }
        this.titleContainer.removeAllChildren();
        this.selectedKey = null;
        this._initTitleButton();
    },

    /**
     * 创建选项按钮
     * @param {*} data  选项数据
     * @param {*} isTitleButton 是否是标题按钮，如果存在标题按钮模板，则采用标题按钮模板
     * @returns {cc.Prefab} 创建好的选项按钮
     */
    _createOneOption(data, isTitleButton) {
        let option;
        if (true === isTitleButton) {
            option = this.titleButtonTemplate ? cc.instantiate(this.titleButtonTemplate) : cc.instantiate(this.optionButtonTemplate);
        } else if (this._selectedKey === data.key) {
            option = this.selectedOptionButtonTemplate ? cc.instantiate(this.selectedOptionButtonTemplate) : cc.instantiate(this.optionButtonTemplate);
        } else {
            option = cc.instantiate(this.optionButtonTemplate);
        }
        if (false === data.enabled) {
            option.getComponent(cc.Button).interactable = false;
        } else {
            option.getComponent(cc.Button).interactable = true;
        }
        option.setContentSize(this.optionButtonSize.width, this.optionButtonSize.height);
        this._setBtnText(option, data.label);
        option.optionData = data;

        option.on(cc.Node.EventType.TOUCH_END, this._onOptionTouched, this);

        return option;
    },

    /**
     * 设置按钮文字
     * @param {Node} btnNode 按钮节点
     * @param {String} str 设置的字符串
     */
    _setBtnText(btnNode, str) {
        if (!cc.isValid(btnNode) || str == null) {
            console.error('setBtnText btnNode or str is null');
            return;
        }
        let label = null;
        if (btnNode instanceof cc.Button) {
            label = cc.find("Background/Label", btnNode.node);
        } else {
            label = cc.find("Background/Label", btnNode);
        }

        if (label) {
            label.getComponent(cc.Label).string = str;
            if (this.font) {
                label.getComponent(cc.Label).font = font;
            }
        }
    },

    /**
     * 选项按钮点击事件
     * @param {cc.Event} event 
     */
    _onOptionTouched(event) {
        let target = event.target;
        if (this._foldFlg) {
            // 展开
            this._unfold();
        } else {
            // 选中， 收起
            let data = target.optionData;
            if (data.key != this._selectedKey && data.enabled === true) {
                this._selectedKey = data.key;
                let selectedButton = this._createOneOption(data, true);
                let titleContainer = this.titleContainer;
                if (titleContainer.childrenCount > 0) {
                    titleContainer.children[0].off(cc.Node.EventType.TOUCH_END, this._onOptionTouched, this);
                }
                this.titleContainer.removeAllChildren();
                this.titleContainer.addChild(selectedButton);

                if (this._selectionChangedHandler && this._handlerThisObj) {
                    this._selectionChangedHandler.call(this._handlerThisObj, data);
                } else {
                    let event = new cc.Event(ButtonDropdownList.Events.SELECTTION_CHANGED, false);
                    event.target = event.currentTarget = this;
                    event.selection = data;
                    this.node.emit(ButtonDropdownList.Events.SELECTTION_CHANGED, event);
                }
                this._fold();
            } else if (data.enabled === true) {
                this._fold();
            }
        }
    },

    /**
     * 收起
     */
    _fold() {
        this._foldFlg = true;
        let mask = this.mask;
        let listBacgroundNode = this.listBacgroundNode;
        let listContent = this.listContent;
        mask.node.parent = null;
        if (listBacgroundNode.parent) {
            cc.tween(listContent).to(.05, {
                opacity: 0
            }).start();
            cc.tween(listBacgroundNode).delay(.05).to(.1, {
                scaleY: 0
            }).call(() => {
                let buttonList = this.buttonList;
                for (let i = buttonList.length - 1; i >= 0; i--) {
                    let button = buttonList[i];
                    if (button.optionData.key === this._selectedKey) {
                        continue;
                    }
                    button.targetOff(this);
                }
                buttonList.splice(0);
                buttonList = null;

                this._content.removeAllChildren();
                listContent.parent = null;
                listContent.active = false;
                listBacgroundNode.parent = null;
                listBacgroundNode.active = false;
                this.mask.node.active = false;
            }).start();
        } else {
            let buttonList = this.buttonList;
            for (let i = buttonList.length - 1; i >= 0; i--) {
                let button = buttonList[i];
                if (button.optionData.key === this._selectedKey) {
                    continue;
                }
                button.targetOff(this);
            }
            buttonList.splice(0);
            buttonList = null;

            this._content.removeAllChildren();
            listContent.parent = null;
            listContent.active = false;
            listBacgroundNode.parent = null;
            listBacgroundNode.active = false;
            this.mask.node.active = false;
        }
    },

    /**
     * 展开
     */
    _unfold() {
        this._foldFlg = false;
        let curScene = cc.director.getScene();
        let content = this._content;

        let mask = this.mask;
        mask.node.parent = null;
        mask.node.setContentSize(cc.winSize);
        mask.node.setPosition(0, 0);
        mask.node.active = true;
        curScene.addChild(mask.node);

        let btnTitlePos = this.node.parent.convertToWorldSpaceAR(this.node.getPosition());
        let spacingY = this.spacingY;

        let listBacgroundNode = this.listBacgroundNode;
        listBacgroundNode.parent = null;

        let listContent = this.listContent;
        listContent.parent = null;

        let hasSelection = !!this._selectedKey ? true : false;
        let optionLength = this.hideSelectedOption && hasSelection ? this._optionDataList.length - 1 : this._optionDataList.length;
        let contentHeight = (this.optionButtonSize.height + spacingY) * optionLength - spacingY;
        let height = contentHeight + this.paddingTopAndBottom * 2;
        if (this.maxListHeight > 0 && height > this.maxListHeight) {
            height = this.maxListHeight;
        }
        listBacgroundNode.setContentSize(this.optionButtonSize.width + this.paddingLeftAndRight * 2, height);
        listBacgroundNode.setAnchorPoint(.5, 1);
        listBacgroundNode.setPosition(cc.v2(btnTitlePos.x, btnTitlePos.y - this.node.height * .5 - this.marginTop));
        listBacgroundNode.active = true;
        curScene.addChild(listBacgroundNode);

        content.setContentSize(this.optionButtonSize.width, contentHeight);
        listContent.setContentSize(this.optionButtonSize.width, height - this.paddingTopAndBottom * 2);
        listContent.setAnchorPoint(.5, 1);
        listContent.setPosition(cc.v2(btnTitlePos.x, btnTitlePos.y - this.node.height * .5 - this.marginTop - this.paddingTopAndBottom));
        content.removeAllChildren();
        listContent.opacity = 255;
        listContent.active = true;
        curScene.addChild(listContent);

        listBacgroundNode.scaleY = 0;
        cc.tween(listBacgroundNode).to(.1, {
            scaleY: 1
        }, {
            easing: 'circOut'
        }).call(() => {
            listContent.getComponent(cc.ScrollView).scrollToTop();
            let dataList = this._optionDataList;
            let buttonList = this.buttonList;
            let index = 0;
            for (let i = 0; i < dataList.length; i++) {
                let data = dataList[i];
                if (true === this.hideSelectedOption && data.key == this._selectedKey) {
                    continue;
                }
                let button = this._createOneOption(data);
                buttonList.push(button);
                button.setPosition(0, -button.height * .5 - (button.height + spacingY) * index);
                content.addChild(button);
                button.opacity = 0;
                cc.tween(button).delay(.02 * index++).to(.06, {
                    opacity: 255
                }).start();
            }
        }).start();
    },

    start() {

    },

    // update (dt) {},

    onDestroy() {
        if (this.buttonList && this.buttonList.length > 0) {
            for (let button of this.buttonList) {
                button.targetOff(this);
                button.destroy();
            }
        }

        this._handlerThisObj = null;
        this._selectionChangedHandler = null;

        this.buttonList = null;
        this._optionDataList = null;
    }
});

module.exports = ButtonDropdownList;