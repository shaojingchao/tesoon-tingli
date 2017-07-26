// search.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    historyData:[],
    showHistory:true,
    inputValue:"",
    inputPlaceholder:"请输入搜索关键词",
    resultList: null,
    listCurrentPage: 0,
    listIsMore: true,
    listLoading: true,
    loadingTips: "加载更多"
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    var that = this;
    wx.getStorage({
      key: 'keyWordsHistory',
      success: function(res) {
        that.setData({
          "historyData":res.data
        })
      },
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  // 获取列表数据
  getResultList: function (loadmore, cb) {

    var that = this;

    if (!that.data.listIsMore) {
      return false;
    }

    if (!loadmore) {
      wx.showLoading({
        title: '加载中',
      });
    }
    that.setData({
      listCurrentPage: that.data.listCurrentPage + 1
    })

    wx.request({
      url: 'https://weixin.tesoon.com/index.php?m=listen&c=search&keywords=' + that.data.inputValue + "&page=" + that.data.listCurrentPage,
      success: function (res) {

        console.log(res);

        var arr = [];
        if (that.data.listIsMore && Array.isArray(res.data.data) && res.data.data.length > 0) {

          if (loadmore) {
            arr = that.data.resultList.concat(res.data.data)
          } else {
            arr = res.data.data;
          }

          that.setData({
            "resultList": arr
          })
        } else {
          if (that.data.listCurrentPage === 1) {
            that.setData({
              resultList: []
            })
          }
        }

        that.setData({
          listIsMore: res.data.ismore
        })
        wx.hideLoading();
        cb && cb();
      }
    })
  },

  bindKeyInput: function (e) {
    this.setData({
      inputValue: e.detail.value
    })
  },

  /**
   * 历史搜索
   */
  bindHistoryDataKeySearch:function(e){

    console.log(e.currentTarget.dataset.id);
    this.setData({
      inputValue:e.currentTarget.dataset.id
    })
    this.searchByKeywords();
  },

  // 清除搜索记录
  clearHistoryData:function(){
    this.setData({
      historyData: []
    });
    wx.setStorage({
      key: 'keyWordsHistory',
      data: []
    })
  },

  /**
   * 搜索
   */
  searchByKeywords:function(){
    
    var that = this;
    
    if (!that.data.inputValue.trim()){
      wx.showToast({
        title: '请输入搜索关键词',
      })
      return false;
    }
  
    var inputValue = that.data.inputValue;

    var cacheArr = that.data.historyData;

    var arrIndexOf = cacheArr.indexOf(inputValue);

    if (arrIndexOf===-1){
      cacheArr.unshift(that.data.inputValue);
    }else{
      cacheArr.splice(arrIndexOf, 1);
      cacheArr.unshift(that.data.inputValue);
    }
    
    that.setData({
      historyData: cacheArr.slice(0, 5),
      showHistory: false,
      listIsMore: true,
      loadingTips: "加载更多",
      listCurrentPage: 0
    });
    wx.setStorage({
      key: 'keyWordsHistory',
      data: that.data.historyData
    })
    that.getResultList(false, function () {
      that.listDataLoadedCb();
    });
  },

  //加载完成回调
  listDataLoadedCb: function () {
    var that = this;
    if (that.data.listIsMore) {
      that.setData({
        loadingTips: "加载更多"
      })
    } else {
      that.setData({
        loadingTips: "加载完毕"
      })
    }
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    var that = this;

    if (!that.data.resultList.length) {
      return false;
    }


    if (!that.data.listIsMore) {
      that.setData({
        loadingTips: "加载完毕"
      })
      return false;
    }

    setTimeout(function () {
      that.setData({
        loadingTips: "数据加载中"
      })
    }, 150)

    setTimeout(function () {
      that.getResultList(true, function () {
        that.listDataLoadedCb();
      });
    }, 400)
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})