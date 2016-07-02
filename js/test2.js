$(function(){
    var Bus = 0,    //总线状态，0为空闲，或为线程号
        N = 2,      //线程数
        Conf = 470*2,   //冲突窗口，毫秒单位
        Max = 16,   //最大冲突次数
        Leng = 87,  //距离
        Time = 250;   //发送帧间隔时间点，毫秒单位

    var dataA = $('.dataA'),
        dataB = $('.dataB');

    /* 随机选数 */
    function selectRandom(count){
        var coun = count < 10 ? count : 10;
        coun = Math.pow(2, coun)-1;
        var ran = parseInt(Math.random()*coun);
        return ran;     //返回随机数，需乘以Conf
    }

    /* 线程原型 */
    var thread = function(){
    }
    thread.prototype = {
        id : null,
        length : null,
        status : 0,         //状态，0为没发送，1为已发送
        time : 0,           //执行二进制退避算法次数
        init : function(cla){
            this.id = null;
            this.length = null;
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
                if((dataB.width() > 0) && (parseInt(dataB.css('marginLeft')) <= 0)){
                    dataA.css({
                        marginLeft: -this.length + 'px'
                    });
                    return false;       //不可发送
                }
            }
            else if(cla == 'dataB'){
                if((dataA.width() > 0) && (parseInt(dataA.css('marginLeft')) >= (752 - threadA.length))){
                    dataB.css({
                        marginLeft : '752px'
                    });
                    return false;       //不可发送
                }
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
                    marginLeft : -this.length + 'px',
                    width : '0px'
                });
            }
            else if(cla == 'dataB'){
                dataB.css({
                    marginLeft : '752px',
                    width : '0px'
                });
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
        var ss = true, hasSent, select, waitedTime = 0, randomWait = 0, canCheck = true;
        threadA.interval = setInterval(function(){
            /*if(threadA.status == 2){
                console.loe(123);
                if(select){
                    randomWait = selectRandom(++threadA.time)*188;
                    console.log('ran', randomWait);
                    select = false;
                }
                if(waitedTime++ == randomWait){
                    console.log('waited', waitedTime);
                    threadA.status = 0;
                    select = true;
                    threadA.init('dataA');
                }
                else{
                    return false;
                }
            }*/
            /* 检测冲突 */
            if(!threadA.checkConf('dataA')){
                /* 还没发送，就检测到信道忙，暂时不发送 */
                if(threadA.status == 0){
                    return false;
                }
                /* 已发送 */
                else if(threadA.status == 1){
                    if(ss){
                        hasSent = threadA.length + hasSent;
                        console.log(hasSent);
                        dataA.css({
                            marginLeft : '0px',
                            width : (hasSent + 'px')
                        });
                        ss = false;
                    }
                    else{
                        /*canCheck = false;
                        var bb = setInterval(function(){
                            if(parseInt(dataA.css('marginLeft')) >= 752){
                                threadA.status = 2;
                                select = true;
                                ss = true;
                                canCheck = true;
                                clearInterval(bb);
                            }else{
                                var margin_left = parseInt(dataA.css('marginLeft')) + 8 +'px';
                                dataA.css('marginLeft', margin_left);
                            }
                        }, 5);*/
                        // canCheck = false;
                        if(parseInt(dataA.css('marginLeft')) >= 752){
                            // threadA.status = 2;
                            // select = true;
                            // ss = true;
                            // canCheck = true;
                        }else{
                            var margin_left = parseInt(dataA.css('marginLeft')) + 8 +'px';
                            dataA.css('marginLeft', margin_left);
                        }
                    }
                    return false;
                }
                else{
                    return false;
                }
            }
            // if(canCheck){
                if(parseInt(dataA.css('marginLeft')) >= 752){
                    threadA.pause('dataA');
                }else{
                    var margin_left = parseInt(dataA.css('marginLeft')) + 8 +'px';
                    dataA.css('marginLeft', margin_left);
                    hasSent = parseInt(dataA.css('marginLeft'));
                    threadA.status = 1;
                }
            // }
            
        }, 5);
    });

    $('.threadB-start').one('click', function(){
        $(this).css({
            display: 'none'
        });
        threadB = new thread();
        threadB.id = 2;
        threadB.init('dataB');
        var ss = true, hasSent, waitedTime = 0;
        threadB.interval = setInterval(function(){
            /* 检测冲突 */
            // if(!threadB.checkConf('dataB')){
            //     /* 还没发送，就检测到信道忙，暂时不发送 */
            //     if(threadB.status == 0){
            //         return false;
            //     }
            //     /* 已发送 */
            //     else if(threadB.status == 1){
            //         if(ss){
            //             hasSent = 752 - hasSent;
            //             dataB.css({
            //                 marginLeft : '752px',
            //                 width : (hasSent + 'px')
            //             });
            //             ss = false;
            //         }
            //         else{
            //             if(parseInt(dataB.css('marginLeft')) >= 752){
            //                 threadB.pause('dataA');
            //                 threadB.init('dataA');
            //                 threadB.status = 0;
            //             }else{
            //                 var margin_left = parseInt(dataB.css('marginLeft')) - 8 +'px';
            //                 dataB.css('marginLeft', margin_left);
            //             }
            //         }
            //         threadB.status = 2;
            //         return false;
            //     }
            //     else if(threadB.status == 2){
            //         return false;
            //     }
            // }
            if(parseInt(dataB.css('marginLeft')) <= -threadB.length){
                threadB.pause('dataB');
            }else{
                var margin_left = parseInt(dataB.css('marginLeft')) - 8 +'px';
                dataB.css('marginLeft', margin_left);
                hasSent = parseInt(dataB.css('marginLeft'));
                threadB.status = 1;
            }
        }, 5);
    });
    
});