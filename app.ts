App<IAppOption>({
  onLaunch() {
    wx.login({
      success: function (_res) {}
    })
  },
  globalData: {
    userInfo: null
  }
})
