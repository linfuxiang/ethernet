$(function(){
    var Bus = 0,    //总线状态，0为空闲，或为线程号
        N = 2,      //线程数
        Conf = 470*2,   //冲突窗口，毫秒单位
        Max =  16,   //最大冲突次数
        Leng = 87,  //距离
        Time = 250;   //发送帧间隔时间点，毫秒单位

    var dataA = $('.dataA'),
        dataB = $('.dataB'),
        ul = $('ul');

    /* 随机选数 */
    function selectRandom(count){
        var coun = count < 10 ? count : 10;
        coun = Math.pow(2, coun)-1;
        var ran = parseInt(Math.random()*coun);
        return ran;     //返回随机数，需乘以Conf
    }

    function randomNextTime(){
        return parseInt(Math.random()*250+10);
    }

    function getTime(){
        var date = new Date(), str = '';
        if(date.getHours() < 10){
            str = str + '0' + date.getHours() + ':';
        }
        else{
            str = str + date.getHours() + ':';
        }
        if(date.getMinutes() < 10){
            str = str + '0' + date.getMinutes() + ':';
        }
        else{
            str = str + date.getMinutes() + ':';
        }
        if(date.getSeconds() < 10){
            str = str + '0' + date.getSeconds();
        }
        else{
            str = str + date.getSeconds();
        }
        return str;
    }

    /* 线程原型 */
    var thread = function(){
    }
    thread.prototype = {
        id : null,
        length : null,
        cutLength : null,
        status : 0,         //状态，0为没发送，1为已发送
        time : 0,           //执行二进制退避算法次数
        success : 0,
        init : function(cla){
            this.id = null;
            this.length = null;
            this.cutLength = null;
            this.status = 0;
            this.time = 0;
            this.randomLength();
            this.setStatus(cla);
            this.checkConf(cla);
        },
        randomLength : function(){
            this.length = parseInt(Math.random()*470)*8+1504;    //长度设为随机数
            console.log(this.length);
        },
        setStatus : function(cla){
            if(cla == 'dataA'){
                dataA.css({
                    width : this.length + 'px',
                    marginLeft : -this.length + 'px'
                });
            }
            else if(cla == 'dataB'){
                dataB.css({
                    width : this.length + 'px',
                    marginLeft : '752px'
                });
            }
        },
        checkConf : function(cla){
            if(cla == 'dataA'){
                // if((dataB.width() > 0) && threadA.cutLength && (parseInt(dataB.css('marginLeft')) <= 0)){
                if(parseInt(dataB.css('marginLeft')) <= 0){
                    return false;
                }
                // else if((dataB.width() > 0) && (parseInt(dataB.css('marginLeft')) <= 0)){
                //     dataA.css({
                //         marginLeft: -this.length + 'px'
                //     });
                //     return false;       //不可发送
                // }
                return true;
            }
            else if(cla == 'dataB'){
                if((dataA.width() > 0) && (parseInt(dataA.css('marginLeft')) >= (752 - dataA.width()))){
                    return false;
                }
                return true;
            }
            return true;
        },
        cleanData : function(cla){
            $('.' + cla).width(0);
        },
        hasData : function(){
            if(this.length > 0){
                return true;
            }
            else{
                return false;
            }
        },
        pause : function(cla){
            if(cla == 'dataA'){
                dataA.css({
                    marginLeft : '0px',
                    width : '0px'
                });
                threadA.continue = false;
            }
            else if(cla == 'dataB'){
                dataB.css({
                    marginLeft : '752px',
                    width : '0px'
                });
                threadB.continue = false;
            }
        }
    }

    $('.threadA-start').one('click', function(){
        $(this).css({
            display: 'none'
        });
        threadA = new thread();
        threadA.id = 1;
        threadA.init('dataA');

        var ss = true, hasSent, pau = false, stop = false, waitNext = randomNextTime(), backoff = false, backoffSign = false, ran;
        threadA.interval = setInterval(function(){
            if(backoff){
                if(!backoffSign){
                    ran = selectRandom(++threadA.time)*188;
                    backoffSign = true;
                }
                if(threadA.time > Max){
                    ss = true, hasSent, pau = false, stop = false, backoff = false, backoffSign = false;
                    threadA.init('dataA');
                    ul.append('<li>' + getTime() + ' <span class="failed">A send failure</span></li>');
                    return false;
                }
                if(ran-- <= 0){
                    ss = true, hasSent, pau = false, stop = false, backoff = false, backoffSign = false;
                    threadA.status = 0;
                }
                else{
                    return false;
                }
            }
            /* 发送完暂时停止循环 */
            if(stop){
                if(threadA.success == 10 && threadB.success == 10){
                    alert('已完成。');
                    clearInterval(threadA.interval);
                    clearInterval(threadB.interval);
                    return false;
                }
                else if(threadA.success == 10){
                    clearInterval(threadA.interval);
                    return false;
                }
                if(waitNext-- <= 0){
                    waitNext = randomNextTime();
                    stop = false;
                }
                return false;
            }
            if(pau){
                if(parseInt(dataA.css('marginLeft')) >= 752){
                    $('.table-conf-a').hide();
                    threadA.setStatus('dataA');
                    threadA.cutLength = null;
                    backoff = true;
                    backoffSign = false;
                    pau = false;
                }else{
                    var margin_left = parseInt(dataA.css('marginLeft')) + 8 +'px';
                    dataA.css('marginLeft', margin_left);
                }
                return false;
            }
            /* 检测冲突 */
            if(!threadA.checkConf('dataA')){
                /* 还没发送，就检测到信道忙，暂时不发送 */
                if(threadA.status == 0){
                    $('.table-conf-a').show();
                    return false;
                }
                /* 已发送 */
                else if(threadA.status == 1){
                    $('.table-conf-a').show();
                    pau = true;
                    threadA.cutLength = threadA.length + hasSent;
                    dataA.css({
                        marginLeft : '0px',
                        width : (threadA.cutLength + 'px')
                    });
                    ul.append('<li>' + getTime() + ' <span class="warn">A send collision</span></li>');
                    return false;
                }
                else{
                    $('.table-conf-a').show();
                    return false;
                }
            }
            if(parseInt(dataA.css('marginLeft')) >= 752){
                threadA.init('dataA');
                stop = true;
                threadA.success += 1;
                ul.append('<li>' + getTime() + ' <span class="success">A send success</span></li>');
                $('.success-a').text(threadA.success);
            }else{
                $('.table-conf-a').hide();
                var margin_left = parseInt(dataA.css('marginLeft')) + 8 +'px';
                dataA.css('marginLeft', margin_left);
                hasSent = parseInt(dataA.css('marginLeft'));
                threadA.status = 1;
            }
        }, 25);
    });

    $('.threadB-start').one('click', function(){
        $(this).css({
            display: 'none'
        });
        threadB = new thread();
        threadB.id = 2;
        threadB.init('dataB');
        var ss = true, hasSent, pau = false, stop = false, waitNext = randomNextTime(), backoff = false, backoffSign = false, ran;
        threadB.interval = setInterval(function(){
            if(backoff){
                if(!backoffSign){
                    ran = selectRandom(++threadB.time)*188;
                    backoffSign = true;
                }
                if(threadB.time > Max){
                    ss = true, hasSent, pau = false, stop = false, backoff = false, backoffSign = false;
                    threadB.init('dataB');
                    ul.append('<li>' + getTime() + ' <span class="failed">B send failure</span></li>');
                    return false;
                }
                if(ran-- <= 0){
                    ss = true, hasSent, pau = false, stop = false, backoff = false, backoffSign = false;
                    threadB.status = 0;
                }
                else{
                    return false;
                }         
            }
            if(stop){
                if(threadA.success == 10 && threadB.success == 10){
                    alert('已完成。');
                    clearInterval(threadA.interval);
                    clearInterval(threadB.interval);
                    return false;
                }
                else if(threadB.success == 10){
                    clearInterval(threadB.interval);
                    return false;
                }
                if(waitNext-- <= 0){
                    waitNext = randomNextTime();
                    stop = false;
                }
                return false;
            }
            if(pau){
                if(parseInt(dataB.css('marginLeft')) <= -threadB.cutLength){
                    $('.table-conf-b').hide();
                    threadB.setStatus('dataB');
                    threadB.cutLength = null;
                    backoff = true;
                    backoffSign = false;
                    pau = false;
                }else{
                    var margin_left = parseInt(dataB.css('marginLeft')) - 8 +'px';
                    dataB.css('marginLeft', margin_left);
                }
                return false;
            }       
            /* 检测冲突 */
            if(!threadB.checkConf('dataB')){
                if(threadB.status == 0){
                    $('.table-conf-b').show();
                    return false;
                }
                /* 已发送 */
                else if(threadB.status == 1){
                    $('.table-conf-b').show();
                    pau = true;
                    threadB.cutLength = 752 - hasSent;
                    dataB.css({
                        width : (threadB.cutLength + 'px')
                    });
                    ul.append('<li>' + getTime() + ' <span class="warn">B send collision</span></li>');
                    return false;
                }
                else{
                    $('.table-conf-b').show();
                    return false;
                }
            }
            if(parseInt(dataB.css('marginLeft')) <= -threadB.length){
                threadB.init('dataB');
                stop = true;
                threadB.success += 1;
                ul.append('<li>' + getTime() + ' <span class="success">B send success</span></li>');
                $('.success-b').text(threadB.success);
            }else{
                $('.table-conf-b').hide();
                var margin_left = parseInt(dataB.css('marginLeft')) - 8 +'px';
                dataB.css('marginLeft', margin_left);
                hasSent = parseInt(dataB.css('marginLeft'));
                threadB.status = 1;
            }
        }, 25);
    });
    
});