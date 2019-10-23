/**
 * @file
 * @author  lingyx
 * @version 1.0.0
 * @ignore  created on 2019/10/15
 */
define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/dom-class',
    'dojo/dom-construct',
    'dojo/dom-attr',
    'dojo/dom-style',
    'dojo/topic',
    'dojo/query',
    'dojo/on',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dojo/text!./Legend.html',
], function(
    declare,
    lang,
    arrayUtil,
    domClass,
    domCon,
    domAttr,
    domStyle,
    Topic,
    query,
    on,
    _WidgetBase,
    _TemplatedMixin,
    template
) {
    return declare([_WidgetBase, _TemplatedMixin], {
        baseClass:'legend-widget',
        templateString: template,
        curData: null,
		constructor (param) {
            this.curData = param;
		},
        postCreate() {
            this.legendName.innerHTML = this.curData.legendName;
            this.curData.data.forEach(item => {
                const div = domCon.create('div',{
                    class : "item"
                },this.legendContent)
                const colorSpan = domCon.create('span',{
                    class : "color-block",
                    style : `background-color:${item.color}`
                },div)
                const textSpan = domCon.create('span',{
                    class: "legendText",
                    innerHTML: "[0~100)"
                },div)
            });
        },

        startup() {
            this.bindEvend();
        },
        hide(){
            $('.legend-widget').css('display','none')
        },
        show(){
            $('.legend-widget').css('display','block')
        },
         /**
    	 * 刷新
    	 * @param legendName 名字
    	 * @param max 最大值
    	 * @param min 最小值
    	 */
        refresh(legendName,max,min){
            if(legendName && (typeof max  == "number") && (typeof min == "number")){

                this.show();
            }else{
                this.hide();
            }
            this.legendName.innerHTML = legendName;
            const dataArr = [max];
            const ave = (max-min)/4;
            for(let i=1; i <= 5; i++){
                dataArr.push(Math.round(max-ave*i))
            }
            Array.from($('.legend-content .content .legendText')).forEach((i,index) =>{
                i.innerHTML = `[${dataArr[index]},${dataArr[index+1]})`
            })
        },
        bindEvend(){
            $('#btn_showLegend').click(function(){
                if($('#legend').css("display") == "block"){
                    $('#legend').css("display","none")
                }else{
                    $('#legend').css("display","block")
                }
            })
        }
    });
});