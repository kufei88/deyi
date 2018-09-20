//index.js
const app = getApp()
var util = require('../../lib/util.js');
Page({
  data: {
    avatarUrl: './user-unlogin.png',
    userInfo: {},
    logged: false,
    takeSession: false,
    requestResult: '',
    showModal: false,
    booksList:'',
    bookType:'',
    bookValue:''
  },  
  bindBookType(e){
    console.log(e.detail.value);
    this.setData({
      bookType: e.detail.value
    })
  },
  getBooksList(){
     const db = wx.cloud.database()
     // 查询当前用户所有的 counters
     db.collection('books').get({
       

       success: res => {
         let comms = res.data;
         console.log(comms);
         for(let c in comms){
           
           let date = util.formatDate(comms[c].bookTime);
           
           comms[c].bookTime = date;
         }
         this.setData({
           booksList: comms
         })
         console.log('[数据库] [查询记录] 成功: ', res)
         let now = new date();
         
         
       },
       fail: err => {
         wx.showToast({
           icon: 'none',
           title: '查询记录失败'
         })
         console.error('[数据库] [查询记录] 失败：', err)
       }
     })
  },
  handleOpen1() {
    this.setData({
      showModal: true
    });
  },
  handleClose1() {
    this.setData({
      visible1: false
    });
    
  },
  bindTypeInput: function (e) {
    this.setData({
      bookType: e.detail.value
    })
  },
  bindValueInput: function (e) {
    this.setData({
      bookValue: e.detail.value
    })
  },
  add(){
    console.log(this.data.bookValue);
     if(!this.data.bookType){
       wx.showToast({
         title: '请输入类型',
       })
       return;
     }
    if (!this.data.bookValue) {
      wx.showToast({
        title: '请输入金额',
      })
      return;
    }
     const db = wx.cloud.database()
     db.collection('books').add({
       data: {
         bookType: this.data.bookType,
         bookValue: this.data.bookValue,
         bookTime: new Date()
       },
       success: res => {
         // 在返回结果中会包含新创建的记录的 _id
         this.setData({
           counterId: res._id,
           count: 1
         })
         wx.showToast({
           title: '新增记录成功',
         })
         console.log('[数据库] [新增记录] 成功，记录 _id: ', res._id)
         this.getBooksList();
         this.setData({
           visible1: false
         });
         console.log(this.data.visible1);
       },
       fail: err => {
         wx.showToast({
           icon: 'none',
           title: '新增记录失败'
         })
         console.error('[数据库] [新增记录] 失败：', err)
       }
     })

  },
  onShareAppMessage: function () {

    return {

      title: '自定义分享标题',

      desc: '自定义分享描述',

      path: '/page/index?id=123'

    }

  },
  onLoad: function() {
    if (!wx.cloud) {
      wx.redirectTo({
        url: '../chooseLib/chooseLib',
      })
      return
    }
    this.getBooksList();
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              this.setData({
                avatarUrl: res.userInfo.avatarUrl,
                userInfo: res.userInfo
              })
            }
          })
        }
      }
    })
  },

  onGetUserInfo: function(e) {
    if (!this.logged && e.detail.userInfo) {
      this.setData({
        logged: true,
        avatarUrl: e.detail.userInfo.avatarUrl,
        userInfo: e.detail.userInfo
      })
    }
  },

  onGetOpenid: function() {
    // 调用云函数
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        console.log('[云函数] [login] user openid: ', res.result.openid)
        app.globalData.openid = res.result.openid
        wx.navigateTo({
          url: '../userConsole/userConsole',
        })
      },
      fail: err => {
        console.error('[云函数] [login] 调用失败', err)
        wx.navigateTo({
          url: '../deployFunctions/deployFunctions',
        })
      }
    })
  },

  // 上传图片
  doUpload: function () {
    // 选择图片
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {

        wx.showLoading({
          title: '上传中',
        })

        const filePath = res.tempFilePaths[0]
        
        // 上传图片
        const cloudPath = 'my-image' + filePath.match(/\.[^.]+?$/)[0]
        wx.cloud.uploadFile({
          cloudPath,
          filePath,
          success: res => {
            console.log('[上传文件] 成功：', res)

            app.globalData.fileID = res.fileID
            app.globalData.cloudPath = cloudPath
            app.globalData.imagePath = filePath
            
            wx.navigateTo({
              url: '../storageConsole/storageConsole'
            })
          },
          fail: e => {
            console.error('[上传文件] 失败：', e)
            wx.showToast({
              icon: 'none',
              title: '上传失败',
            })
          },
          complete: () => {
            wx.hideLoading()
          }
        })

      },
      fail: e => {
        console.error(e)
      }
    })
  },

})
