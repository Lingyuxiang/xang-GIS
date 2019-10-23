/**
 * @file
 * @author  lingyx
 * @version 1.0.0
 * @ignore  created on 2019/8/27
 */
define([
    'dojo/_base/lang',
    'dojo/request',
    'dojo/request/xhr',
    'dojo/request/script',
    'esri/request',
    'dojo/Deferred'
],function(
        lang,
        request,
        xhr,
        script,
        esriRequest,
        Deferred){
    /**
     * 服务调用工具模块
     * @exports dist/util/ServerUtil
     */
    var ServerUtil={};



      /**
      * ajax调用
      * @param url  链接地址
      * @param data 数据
      * @param callbackfun  回调函数
      * @param method 调用方法，默认为post
      * @param isJson 			是否发送json格式
      * @param dataType  返回参数类型,默认为json
      * @param opt  同步/异步类型,{asnyc:false}
      */
    ServerUtil.excuteAjaxRequest = (url, data, callbackfun, method, dataType, opt)=>{
        if (method == null) {
            // 默认post方式
            method = "post";
        }
        if (dataType == null) {
            // 默认json数据类型
            dataType = "json";
        }
        if (callbackfun.error == null) {
            // 默认输出错误日志
            callbackfun.error = function(data) {
                top.dialog && top.dialog({
                    title: "操作异常",
                    contentent: "操作异常",
                    quickClose: true
                }).show() || alert("操作异常");
            };
        }
        var defaultOpt = {
            url: url,
            dataType: dataType,
            type: method,
            data: data,
            asnyc:opt,
            headers : {
                   "returntype" : "ajax/json"
                //    "Accept-Encoding":"gzip, deflate, sdch, br"
           },
            traditional: true,
            success: function(data) {
                if (data.code >= 10000 && data.code < 11000) {
                    if (data.code == 10000) {
                        top.location.href = "/login.htm";
                        return;
                    }
                    top.dialog && top.dialog({
                        quickClose: true,
                        contentent: data.description
                    }).show() || alert(data.description);
                    return;
                }
                if (callbackfun.success)
                    callbackfun.success(data);
            },
            error: callbackfun.error
        };
        $.ajax($.extend({}, opt, defaultOpt));
    }
    /**
     *  执行get请求
     * @param {string} serviceSign --服务标识
     * @param {string} [serviceName=未知服务] --服务名称可选
     * @returns {Promise}
     */
    ServerUtil.excuteGetRequest=function(serviceSign,serviceName){
        if(!serviceName){
            serviceName='未知服务';
        }
        var deferred = new Deferred();
        var requestUrl = serviceSign;

        xhr(requestUrl, {
            headers: {
                'X-Requested-With': null,
                'Content-Type': 'application/json'
            },
            method: 'get',
            handleAs:'json',
            withCredentials: true
        }).then(function(response) {
            if(response.code == 0){
                deferred.resolve(response);
            }else{
                var msg = '调用到但未成功执行服务'+serviceName;
                deferred.reject(msg);
            }

        }, function(error) {
            var msg = '调用服务'+serviceName+'失败 '+error.response.url;
            deferred.reject(msg);
        });
        return deferred;
    };



    // ServerUtil.excutePureGetRequest=function(serviceSign,serviceName){
    //     if(!serviceName){
    //         serviceName='未知服务';
    //     }
    //     var deferred = new Deferred();
    //     var requestUrl =  serviceSign;
    //     script(requestUrl,{jsonp: 'callback'}).then(function(response){
    //         deferred.resolve(response);
    //     },function(error) {
    //         var msg = '调用服务--'+serviceName+'--失败 '+error.response.url;
    //         deferred.reject(msg);
    //     });
    //     return deferred;
    // };
    /**
     *  执行post请求
     * @param {string} serviceSign --服务标识
     * @param {string} [serviceName=未知服务] --服务名称可选
     * @param {object} data --请求体
     * @returns {Promise}
     */
    ServerUtil.excutePostRequest=function(serviceSign,serviceName,data,isJson){
        console.log("start request" + serviceName)
        var start = new Date().getTime();
        if(!serviceName){
            serviceName='未知服务';
        }
        if(isJson == null){
            isJson = true;
        }
        var deferred = new Deferred();
        var requestUrl = serviceSign;
        xhr(requestUrl, {
            headers: {
                'X-Requested-With': null,
                'Content-Type': isJson?'application/json;charset=UTF-8':'application/x-www-form-urlencoded; charset=UTF-8'
            },
            method: 'POST',
            handleAs:'json',
            withCredentials: true,
            data:  isJson?JSON.stringify(data):data
        }).then(function(response) {
            var end = new Date().getTime();
            console.log(serviceName +" use time:"+(end-start)+" ms")

            if(response.code == 0){
                deferred.resolve(response.data);
            }else{
                var msg = '调用到但未成功执行服务'+serviceName;
                layer.msg(resp.description)
                deferred.reject(msg);
            }

        }, function(error) {
            var msg = '调用服务'+serviceName+'失败 '+error.response.url;
            deferred.reject(msg);
        });
        return deferred;
    };
    // ServerUtil.excutePurePostRequest=function(serviceUrl,serviceName,data){
    //     if(!serviceName){
    //         serviceName='未知服务';
    //     }
    //     var deferred = new Deferred();
    //     var requestUrl = serviceUrl;
    //     xhr(requestUrl, {
    //         headers: {
    //             'X-Requested-With': null,
    //             'Content-Type': 'application/json'
    //         },
    //         method: 'POST',
    //         handleAs: 'json',
    //         data: JSON.stringify(data)
    //     }).then(function(response) {
    //         if(response.status == 'success'){
    //             deferred.resolve(response);
    //         } else {
    //             var msg = '调用到但未成功执行服务'+serviceName;
    //             deferred.reject(msg);
    //         }
    //     }, function(error) {
    //         var msg = '调用服务'+serviceName+'失败 '+error.response.url;
    //         deferred.reject(msg);
    //     });
    //     return deferred;
    // };


    ServerUtil.excuteSOEPostRequest=function(serviceUrl,serviceName,data){
        if(!serviceName){
            serviceName='未知服务';
        }
        var deferred = new Deferred();
        var requestUrl = serviceUrl;
        xhr(requestUrl, {
            headers: {
                'X-Requested-With': null,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            method: 'POST',
            handleAs: 'json',
            data: data
        }).then(function(response) {
            if(response.status == 'success' || response.IsSuccess == 'True '){
                deferred.resolve(response);
            } else {
                var msg = '调用到但未成功执行服务'+serviceName;
                deferred.reject(msg);
            }
        }, function(error) {
            var msg = '调用服务'+serviceName+'失败 '+error.response.url;
            deferred.reject(msg);
        });
        return deferred;
    };

    /**
     *  执行delete请求
     * @param {string} serviceSign --服务标识
     * @param {string} [serviceName=未知服务] --服务名称可选
     * @param {object} data --请求体
     * @returns {Promise}
     */
    ServerUtil.excuteDeleteRequest = function(serviceSign,serviceName,data){
        if(!serviceName){
            serviceName='未知服务';
        }
        var deferred = new Deferred();
        var requestUrl = window.appInfo.serverUrl+ serviceSign;
        // 这里是为了适配新版运维所更改的数据请求方式，因为之前的请求方式无法获取cookie
        var newData = JSON.stringify(data);
        var xhr = new XMLHttpRequest();
        xhr.withCredentials = true;
        xhr.open('delete',requestUrl);
        xhr.setRequestHeader("Content-Type","application/json");
        xhr.send(newData);
        xhr.onreadystatechange = function () {
            if (xhr.readyState==4 && xhr.status==200) {
                var response = JSON.parse(xhr.responseText);
                if (response.status == 'success' || response.status == '200') {
                    deferred.resolve(response.data);
                } else {
                    var msg = '未成功从服务--'+serviceName+'--获取数据';
                    deferred.reject(msg);
                }
            }
        };
        return deferred;
    };

    /**
     *  执行put请求
     * @param {string} serviceSign --服务标识
     * @param {string} [serviceName=未知服务] --服务名称可选
     * @param {object} data --请求体
     * @returns {Promise}
     */
    ServerUtil.excutePutRequest = function(serviceSign,serviceName,data){
        if(!serviceName){
            serviceName='未知服务';
        }
        var deferred = new Deferred();
        var requestUrl = window.appInfo.serverUrl + serviceSign;
        // 这里是为了适配新版运维所更改的数据请求方式，因为之前的请求方式无法获取cookie,添加xhr.withCredentials = true;获取cookie
        var newData = JSON.stringify(data);
        var xhr = new XMLHttpRequest();
        xhr.withCredentials = true;
        xhr.open('put',requestUrl);
        xhr.setRequestHeader("Content-Type","application/json");
        xhr.send(newData);
        xhr.onreadystatechange = function () {
            if (xhr.readyState==4 && xhr.status==200) {
                var response = JSON.parse(xhr.responseText);
                if (response.status == 'success' || response.status == '200') {
                    deferred.resolve(response.data);
                } else {
                    var msg = '未成功从服务--'+serviceName+'--获取数据';
                    deferred.reject(msg);
                }
            }
        };
        return deferred;
    };
    ServerUtil.excuteFileRequest = function(serviceSign,serviceName,data){
        if(!serviceName){
            serviceName='未知服务';
        }
        var deferred = new Deferred();
        var requestUrl = window.appInfo.serverUrl+ serviceSign;
        xhr(requestUrl, {
            headers: {
                'X-Requested-With': null,
                'Content-Type': false
            },
            method: 'POST',
            handleAs:'json',
            data:data,
	          withCredentials: true
        }).then(function(response) {
            if(response.status == 'success'){
                deferred.resolve(response);
            }else{
                var msg = '调用到但未成功执行服务'+serviceName;
                deferred.reject(msg);
            }

        }, function(error) {
            var msg = '调用服务'+serviceName+'失败 '+error.response.url;
            deferred.reject(msg);
        });
        return deferred;
    };

    return ServerUtil;
})