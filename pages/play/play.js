import formatTime from "../../utils/util.js";

var timer = null, playStateTimer = null;

Page({
  data: {
    pageOffsetTop: 0,
    currentPageOffset: 0,
    audioListShow: false,
    playTypeOne: true,
    downloadPercent: 0,
    duration: 0,
    currentPosition: 0,
    currentAudioId: null,
    currentAudioIdIndex: 0,
    currentTime: "00:00",
    totalTime: "00:00",
    replayStatus: "ready",
    audioState: "ready",
    replayStatusText: "复读",
    replayTimeStart: 0,
    replayTimeEnd: 0,
    replayTimeFormated: {
      start: "00:00",
      end: "00:00"
    },
    currentAudioData: {},
    audioList: [
    ],

    // 听力原文
    TLContext: {
      toggleText: "显示",
      currentContextId: "",
      context: ""
    },
    contentType: '',
    TLContextType1List: [],
    answerSelectedData: [],
    //答题卡
    answerInfo: {
      answerSelectedDataLength: 0,
      quesRightAnswer: [],
      userAnswer: [],
      userAnswerIsChecked: false,
      result: {
        trueNum: "0",
        falseNum: "0",
        trueRate: "0.00%",
        answerModal: false
      }
    },
    TLType1ContextHide: true
  },

  // 初始化数据
  onReady: function (e) {
    var that = this;

    // 设置默认播放方式
    wx.getStorage({
      key: 'wx_playType',
      success: function (res) {
        that.setData({
          playTypeOne: res.data
        })
      }
    })

    wx.onBackgroundAudioStop(function (res) {
      that.onBackgroundAudioDone();
      console.log("stop");
    })
    clearInterval(timer);
    clearInterval(playStateTimer);
  },
  onLoad: function (obj) {
    var that = this;

    // 记录当前播放的音频id
    this.setData({
      currentAudioId: obj.id
    });

    // 监听网络状态改变
    wx.onNetworkStatusChange(function (res) {
      if (res.networkType !== "none") {
        wx.showToast({
          title: `您正在使用${res.networkType}网络`,
        })
      } else {
        wx.showToast({
          title: "网络已断开",
        })
      }
    })

    // 请求数据
    wx.getNetworkType({
      success: function (res) {
        var networkType = res.networkType;
        
        // 没有网络
        if (res.networkType === "none") {
          wx.showModal({
            title: '网络不可用，请链接网络后重试！',
            confirmText: "朕知道了",
            showCancel: false
          });
        } else {

          wx.showLoading({
            title: '拼命加载中',
          });

          // 请求音频数据
          wx.request({
            url: "https://weixin.tesoon.com/index.php?m=listen&c=show&ajax=1&id=" + obj.id,
            success: function (res) {
              var resContent = res.data.data.content;
              wx.hideLoading();
              if (networkType !== "wifi") {
                wx.showToast({
                  title: `您正在使用${networkType}网络`,
                  duration: 2500
                });
              }
              if (res.data.ret === 1) {
                if (resContent) {
                  var contentType = resContent.type;
                  that.setData({
                    "contentType": resContent.type, // 数据类型 
                    "audioList": res.data.data.audioList, // 音频列表
                    "currentAudioData.id": obj.id,
                    "currentAudioData.dataUrl": resContent.dataUrl,
                    "currentAudioData.title": resContent.title,
                    "currentAudioData.coverImgUrl": resContent.coverImgUrl,
                  })
                  console.log('开始播放')
                  that.audioStart();

                  // 1,无内容
                  if (contentType == 1) {

                  }

                  if (contentType == 2 || contentType == 3) {

                    resContent.data = JSON.parse(JSON.stringify(resContent.data).replace(/&#41;/g, ")")
                      .replace(/&#46;/g, ".")
                      .replace(/\&\#39\;/g, "'")
                      .replace(/<font[^>]*>W:/g, '<span style=\'color:#d00;\'>W:')
                      .replace(/<font[^>]*>M:/g, '<span style=\'color:#00d;\'>M:')
                      .replace(/<\/font>/g, '</span>'));
                  }

                  // 2,有听力原文
                  if (contentType == 2) {
                    that.setData({
                      "TLContext.context": resContent.data
                    });
                  }

                  // 3，听力作答
                  if (contentType == 3) {
                    var length = 0;
                    var answerArr = [];

                    // 格式化数据
                    var dataFormated = resContent.data.map(function (item) {
                      length++;
                      if (item.question && item.question.length) {
                        item.question.map(function (itemi) {
                          itemi['order'] = itemi['title'].split('.')[0];
                          length = itemi['order'];
                          answerArr.push(itemi['answer']);
                        })
                      }
                      return item;
                    })
                    that.setData({
                      TLContextType1List: dataFormated,
                      "answerInfo.answerSelectedDataLength": length,
                      "answerInfo.quesRightAnswer": answerArr
                    });
                  }
                }
              }
            },
            fail: function () {
              wx.hideLoading();
              wx.showToast({
                title: '加载失败！',
              })
            }
          });
        }
      },
    })
  },

  //播放器初始化
  audioPlayInit: function () {
    var _this = this;
    _this.setData({
      downloadPercent: 0,
      duration: 0,
      currentPosition: 0,
      currentTime: "00:00",
      totalTime: "00:00",
      replayStatus: "ready",
      audioState: "ready",
      replayStatusText: "复读",
      replayTimeStart: 0,
      replayTimeEnd: 0,
      "replayTimeFormated.start": "00:00",
      "replayTimeFormated.end": "00:00",
    });
  },

  // 播放初始化
  audioPlay: function (id) {
    this.audioPlayInit();

    console.log('audioPlay')

    var _this = this;
    var currentList = this.data.audioList.filter(function (item, i) {
      if (item.id === id) {
        console.log("播放初始化", id, i);
        _this.setData({
          currentAudioId: id,
          currentAudioIdIndex: i
        })
        return item.id === id;
      }
    });

    var currentListItem = _this.data.currentAudioData;
    if (currentListItem) {
      wx.playBackgroundAudio({
        dataUrl: currentListItem.dataUrl,
        title: currentListItem.title,
        coverImgUrl: currentListItem.coverImgUrl,
        success: function () {
          console.log('playing========')
          _this.setPlayerState();
          wx.setNavigationBarTitle({
            title: "天星教育|配套听力-" + currentListItem.title
          });
          _this.setData({
            audioState: "playing"
          })
        },fail: function () {
          console.log('error')
        }
      })
    }
  },

  // 设置播放状态
  setPlayerState: function () {
    var _this = this;

    clearInterval(playStateTimer);

    playStateTimer = setInterval(function () {
      wx.getBackgroundAudioPlayerState({
        success: function (res) {
          _this.setData({
            duration: res.duration,
            currentPosition: res.currentPosition,
            downloadPercent: res.downloadPercent,
            currentTime: formatTime.formatMinutesTime(res.currentPosition),
            totalTime: formatTime.formatMinutesTime(res.duration)
          })
        }
      })
    }, 300)
  },

  // 拖动修改播放进度
  drapPosition: function (e) {
    var replayStatus = this.data.replayStatus;
    if (replayStatus != 'ready') {
      return false;
    }
    wx.seekBackgroundAudio({
      position: e.detail.value
    })
  },

  // 开始播放
  audioStart: function () {
    console.log('audioStart')
    if (this.data.audioState === 'ready') {
      this.audioPlay(this.data.currentAudioId);
    } else {
      wx.playBackgroundAudio();
      this.setData({
        audioState: "playing"
      })
    }
  },

  //播放完毕回调函数
  onBackgroundAudioDone: function () {

    //单曲循环
    if (this.data.playTypeOne) {
      this.audioPlay(this.data.currentAudioId);
    }
    // 顺序播放
    else {
      if (this.data.currentAudioIdIndex === this.data.audioList.length - 1) {
        this.audioPause();
        return false;
      }
      this.audioNext();
    }
  },

  // 暂停
  audioPause: function () {
    wx.pauseBackgroundAudio();
    this.setData({
      audioState: "pause"
    });
    console.log("pause");
  },

  // 上一曲
  audioPrev: function () {
    this.audioPrevNextEvent("prev");
    console.log("prev");
  },

  // 下一曲
  audioNext: function () {
    this.audioPrevNextEvent("next");
    console.log("next");
  },

  //上一曲，下一曲切换事件
  audioPrevNextEvent: function (ctrl) {
    var that = this;
    var audioList = that.data.audioList;
    var shouldCurrentAudioIdIndex = null;
    var shouldCurrentAudioId = null;

    //只有一首立即返回
    if (audioList.length <= 1) {
      return false;
    }

    audioList.forEach(function (item, i) {

      // 当前播放曲目id
      if (item.id === that.data.currentAudioId) {

        // 下一首
        if (ctrl === 'next') {
          if (i + 1 < audioList.length) {
            shouldCurrentAudioId = audioList[i + 1].id;
            shouldCurrentAudioIdIndex = i + 1;
          } else {
            wx.showToast({
              title: '没有下一曲',
            })
            return false;
          }
        }

        // 上一首
        if (ctrl === 'prev') {
          if (i - 1 >= 0) {
            shouldCurrentAudioId = audioList[i - 1].id;
            shouldCurrentAudioIdIndex = i - 1;
          } else {
            wx.showToast({
              title: '没有上一曲',
            })
            return false;
          }
        }
        console.log(shouldCurrentAudioId, shouldCurrentAudioIdIndex);
      }
    });

    if (shouldCurrentAudioId != null && shouldCurrentAudioIdIndex != null) {
      that.setData({
        currentAudioId: shouldCurrentAudioId,
        currentAudioIdIndex: shouldCurrentAudioIdIndex
      })

      wx.redirectTo({
        url: '/pages/play/play?id=' + that.data.currentAudioId
      })
    }
  },

  // 复读
  audioReplay: function () {
    var _this = this;
    var res = _this.data;
    var state = res.replayStatus;

    if (state === "ready") {
      _this.setData({
        replayStatus: "start",
        replayStatusText: "结尾",
        replayTimeStart: res.currentPosition,
        replayTimeEnd: res.duration,
        "replayTimeFormated.start": formatTime.formatMinutesTime(res.currentPosition),
        "replayTimeFormated.end": formatTime.formatMinutesTime(res.duration)
      });
      _this.audioReplaying(res.replayTimeStart, res.replayTimeEnd);
    }
    else if (state === "start") {
      _this.setData({
        replayStatus: "end",
        replayStatusText: "停止",
        replayTimeEnd: res.currentPosition,
        "replayTimeFormated.end": formatTime.formatMinutesTime(res.currentPosition)
      });
      _this.audioReplaying(res.replayTimeStart, res.replayTimeEnd);
    }
    else if (state === "end") {
      _this.setData({
        replayStatus: "ready",
        replayStatusText: "复读"
      });
      clearInterval(timer);
    }
  },

  // 复读模式
  audioReplaying: function (start, end) {
    clearInterval(timer);
    wx.seekBackgroundAudio({
      position: start
    });
    var time = end - start;
    time = time < 1 ? 1 : time;
    timer = setInterval(function () {
      wx.seekBackgroundAudio({
        position: start
      });
    }, time * 1000);
  },

  // 播放模式切换 单曲循环||顺序播放
  togglePlayType: function () {
    var that = this;
    that.setData({
      playTypeOne: !that.data.playTypeOne
    })
    wx.setStorage({
      key: 'wx_playType',
      data: that.data.playTypeOne
    })
  },

  onHide: function () {
    clearInterval(timer);
  },

  // 播放列表项目
  currentAudioListPlayItem: function (e) {
    wx.redirectTo({
      url: '/pages/play/play?id=' + e.currentTarget.dataset.id
    })
  },

  // 显示播放列表
  currentAudioList: function () {
    this.setData({
      audioListShow: true
    })
  },

  // 关闭播放列表
  closeShade: function () {
    this.setData({
      audioListShow: false
    })
  },

  // 听力类型 1.原文
  toggleTLContext: function () {
    var that = this;
    this.setData({
      "TLContext.toggleText": that.data.TLContext.toggleText === '隐藏' ? '显示' : '隐藏'
    })
  },

  // 显示听力原文
  showTLType1Context: function (e) {
    var that = this;

    console.log(e.currentTarget.dataset.id);
    that.setData({
      "TLContext.currentContextId": e.currentTarget.dataset.id,
      TLType1ContextHide: !that.data.TLType1ContextHide
    })
  },

  // 选择选项事件
  slectedOptEvent: function (obj) {

    // 如果已提交答案直接返回
    if (this.data.answerInfo.userAnswerIsChecked) {
      return false;
    }

    // 更新作答数据
    var orderid = obj.currentTarget.dataset.order - 1;
    var opt = obj.currentTarget.dataset.opt;
    this.setData({
      [`answerInfo.userAnswer[${orderid}]`]: opt
    })
  },

  //提交答案
  submitUserAnswerEvent: function () {
    var answerInfo = this.data.answerInfo;
    var userAnswer = answerInfo.userAnswer;
    var answerLength = answerInfo.answerSelectedDataLength;

    // 判断答题是否完毕
    var userAnswerLength = userAnswer.filter(function (item) {
      return item != null;
    });
    if (userAnswerLength.length < answerLength) {
      wx.showModal({
        title: '提示',
        showCancel: false,
        confirmText: "朕知道了",
        content: '请做答完毕后提交答案哦^_^!'
      })
      return false;
    }

    // 正确数量
    var trueLen = 0;
    userAnswer.map(function (item, i) {
      if (item === answerInfo.quesRightAnswer[i]) {
        trueLen++;
      }
    })
    this.setData({
      "answerInfo.userAnswerIsChecked": true,
      "answerInfo.result.answerModal": true,
      "answerInfo.result.trueNum": trueLen,
      "answerInfo.result.falseNum": answerLength - trueLen,
      "answerInfo.result.trueRate": Math.round(trueLen / answerLength * 10000) / 100 + '%'
    })
  },

  //记录滚动位置
  pageScrollBox: function (e) {
    this.setData({
      currentPageOffset: e.detail.scrollTop
    })
  },

  // 题号导航
  scrollToThisQuesId: function (e) {
    var that = this;
    var id = e.currentTarget.dataset.id;
    var query = wx.createSelectorQuery();
    query.select('#orderid_' + (id)).boundingClientRect();
    query.select('#pageScrollBox').boundingClientRect();
    query.exec(function (res) {
      that.setData({
        pageOffsetTop: that.data.currentPageOffset + res[0].top,
      })
    });
  },

  // 重新作答
  reloadThisPage: function () {
    var that = this;

    wx.redirectTo({
      url: '/pages/play/play?id=' + that.data.currentAudioId
    })
  },

  //关闭答题结果弹框
  closeShadeAnswerResult: function () {
    this.setData({
      "answerInfo.result.answerModal": false
    })
  },
  
  onUnload:function(){
    this.audioPause();
  }
})