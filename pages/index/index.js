//index.js
//获取应用实例

var app = getApp();
Page({
  data: {
    filterList: {
      listSort: ["grade", "year", "series", "cate", "other"],
      grade: {
        id: "grade",
        name: "年级",
        list: []
      },
      year: {
        id: "year",
        name: "年度",
        list: []
      },
      series: {
        id: "series",
        name: "图书系列",
        list: []
      },
      cate: {
        id: "cate",
        name: "类别",
        list: []
      },
      other: {
        id: "other",
        name: "分期",
        list: []
      }
    },
    filterData: {},
    filterDataObj:null,
    currentFilterList: [],
    currentFilterListId: "",
    currentFilterListShow: false,
    ajaxParams: {
      yearname: "",
      gradename: "",
      seriesname: "",
      catename: "",
      yearid: "",
      gradeid: "",
      seriesid: "",
      cateid: "",
      otherid: ""
    },
    bannerData: [],
    indicatorDots: true,
    autoplay: true,
    interval: 4000,
    duration: 400,
    resultList: null,
    resultListId: '',
    listCurrentPage: 0,
    listIsMore: true,
    listLoading: true,
    loadingTips: "加载更多"
  },

  onShow: function () {

  },
  //banner 导航
  navOpenUrl:function(e){
    wx.setClipboardData({
      data: e.currentTarget.dataset.id,
      success: function () {
        wx.showModal({
          content: '链接复制成功！请使用浏览器查看详细信息',
        })
      }
    })
  },

  // filterItemNormal
  filterItemNormal: function (e,itemId) {

    var that = this;
    var id = typeof e === "object" ? e.currentTarget.dataset.id : itemId;

    // 数据初始化
    var currentListIndex = that.data.filterList.listSort.indexOf(that.data.currentFilterListId);
    if (currentListIndex != -1) {
      that.data.filterList.listSort.slice(currentListIndex + 1).forEach(function (item,i,arr) {

        if (item === "year") {
          that.setData({
            "filterList.year.list": null
          })
        }

        if (item === "series") {
          that.setData({
            "filterList.series.list": null
          })
        }

        if (item === "cate") {
          that.setData({
            "filterList.cate.list": null
          })
        }

        if (item === "other") {
          that.setData({
            "filterList.other.list": null
          })
        }

      })
    }
    
    that.setData({
      listIsMore: true,
      loadingTips: "加载更多",
      listCurrentPage: 0,
      resultListId: id,
      currentFilterListShow: !!itemId ? that.data.currentFilterListShow : !that.data.currentFilterListShow
    });

    that.getResultList(that.autoLoadLastLevel(that.data.currentFilterListId, id), false, function(){
      that.listDataLoadedCb()
    });
  },
  // 其他筛选参数
  filterItemOther: function (e) {
    var that = this;
    var id = e.currentTarget.dataset.id;
    this.setData({
      listIsMore: true,
      loadingTips: "加载更多",
      listCurrentPage: 0,
      resultListId: id,
      'ajaxParams.otherid': id
    })

    that.getResultList(id, false, function(){
      that.listDataLoadedCb()
    });

  },

  cacheFilterDataArray:function(){
    var newObj = {};
    var arr = [];
    var filterData = this.data.filterData;
    Object.keys(filterData).forEach(function (item) {
      arr = arr.concat(filterData[item])
    })
    arr.forEach(function(item){
      newObj[item['id']] = item["title"]
    })
    this.setData({
      "filterDataObj": newObj
    })
  },
  
  //获取筛选类目名称
  getLevelNameById:function(id){
    return this.data.filterDataObj[id]
  },

  //自动定位最后一级 return itemId
  autoLoadLastLevel:function(level,itemId){
    var _this = this;
    var saveItemId = null;

    var filterItemArr = ["grade", "year", "series", "cate", "other"];

    var newFilterItemArr = filterItemArr.slice(filterItemArr.indexOf(level));

    newFilterItemArr.forEach(function (item, i, arr) {
      if (itemId) {

        saveItemId = itemId;
        var itemName = _this.getLevelNameById(itemId);
        var itemList = _this.data.filterData[itemId];


        switch (item) {

          case "grade":
            _this.setData({
              "ajaxParams.gradename": itemName,
              "ajaxParams.gradeid": itemId,
              "filterList.year.list": itemList
            });
            break;

          case "year":
            _this.setData({
              "ajaxParams.yearname": itemName,
              "ajaxParams.yearid": itemId,
              "filterList.series.list": itemList
            });
            break;

          case "series":
            _this.setData({
              "ajaxParams.seriesname": itemName,
              "ajaxParams.seriesid": itemId,
              "filterList.cate.list": itemList
            });
            break;

          case "cate":
            _this.setData({
              "ajaxParams.catename": itemName,
              "ajaxParams.cateid": itemId,
              "filterList.other.list": itemList
            });
            break;

          case "other":
            _this.setData({
              "ajaxParams.otherid": itemId
            });
            break;
        }

        itemId = (itemList && itemList.length > 0) ? itemList[0].id : ''
      }
    })
    return saveItemId;
  },

  // 获取列表数据
  getResultList: function (id, loadmore, cb) {

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
      url: 'https://weixin.tesoon.com/index.php?m=listen&c=list&listenid=' + id + "&page=" + that.data.listCurrentPage,
      success: function (res) {
        
        

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
        }else{
          if (that.data.listCurrentPage ===1){
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

  // 筛选列表
  filterList: function (e) {
    var that = this;
    var target = e.currentTarget.dataset.id;
    if (target == that.data.currentFilterListId) {
      that.setData({
        currentFilterListShow: !that.data.currentFilterListShow
      });
    } else {
      that.setData({
        currentFilterListShow: true
      })
    }
    that.setData({
      currentFilterListId: target,
      currentFilterList: that.data.filterList[target].list
    })
  },

  // 关闭弹出层
  closeShade: function () {
    this.setData({
      currentFilterListShow: false
    })
  },

  // 文件下载
  downAudioFile: function () {
    wx.setClipboardData({
      data: "http://www.wln100.com/download",
      success: function () {
        wx.showModal({
          title: "复制成功",
          content: '链接已复制到粘贴板，请打开浏览器，粘贴至地址栏打开即可下载。'
        })
      }
    })
  },

  onLoad:function(res){
    
  },

  // 初次加载
  onReady: function () {
    var _this = this;
    wx.showNavigationBarLoading();
    wx.request({
      url: 'https://weixin.tesoon.com/index.php?m=listen&ajax=1',
      success: function (res) {
        wx.hideNavigationBarLoading();
        _this.setData({
          filterData: res.data.filterData,
          bannerData: res.data.bannerData,
          "filterList.grade.list": res.data.filterData['0']
        });
        _this.cacheFilterDataArray();
        var id = res.data.filterData['0'][0].id;
        _this.filterItemNormal(false, _this.autoLoadLastLevel("grade", id));
        
      }
    })
  },

  //加载更多
  onReachBottom: function () {
    var that = this;
    console.log('loadmore')

    if (!that.data.resultList.length){
      return false;
    }

    
    if (!that.data.listIsMore) {
      that.setData({
        loadingTips: "加载完毕"
      })
      return false;
    }

    that.setData({
      loadingTips: "数据加载中"
    })

    that.getResultList(that.data.resultListId, true, function () {
      that.listDataLoadedCb();
    });
  },

  goSearchPage:function(){
    wx.navigateTo({
      url: '/pages/search/search',
    })
  },
  
  //加载完成回调
  listDataLoadedCb:function(){
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
  }
})
