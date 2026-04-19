import { getApiUrl, getApiKey, setApiUrl, setApiKey, getApiMode, setApiMode, getModel, setModel, testApi } from '../../utils/api'

interface ISettingsData {
  apiMode: string
  apiUrl: string
  apiKey: string
  modelName: string
  hasKey: boolean
  showKey: boolean
  keyPlaceholder: string
  testing: boolean
  testResult: IApiTestResult | null
}

Page<ISettingsData>({
  data: {
    apiMode: 'default',
    apiUrl: '',
    apiKey: '',
    modelName: '',
    hasKey: false,
    showKey: false,
    keyPlaceholder: '请输入 API Key',
    testing: false,
    testResult: null
  },

  onLoad() {
    const mode = getApiMode()
    const key = getApiKey()
    const url = getApiUrl()
    const model = getModel()
    this.setData({
      apiMode: mode,
      apiUrl: mode === 'custom' ? url : '',
      apiKey: mode === 'custom' ? key : '',
      modelName: mode === 'custom' ? model : '',
      hasKey: mode === 'default' || !!key,
      keyPlaceholder: (mode === 'custom' && key) ? key.substring(0, 6) + '****' + key.substring(key.length - 4) : '请输入 API Key'
    })
  },

  switchMode(e: WechatMiniprogram.TouchEvent) {
    const mode = e.currentTarget.dataset.mode as string
    this.setData({ apiMode: mode, testResult: null })

    if (mode === 'default') {
      setApiMode('default')
      this.setData({ hasKey: true })
    }
  },

  onUrlInput(e: WechatMiniprogram.Input) {
    this.setData({ apiUrl: e.detail.value })
  },

  onKeyInput(e: WechatMiniprogram.Input) {
    this.setData({ apiKey: e.detail.value })
  },

  onModelInput(e: WechatMiniprogram.Input) {
    this.setData({ modelName: e.detail.value })
  },

  toggleShowKey() {
    this.setData({ showKey: !this.data.showKey })
  },

  saveConfig() {
    const key = this.data.apiKey.trim()
    const url = this.data.apiUrl.trim()
    const model = this.data.modelName.trim()

    if (!key) {
      wx.showToast({ title: '请输入API Key', icon: 'none' })
      return
    }
    if (!url) {
      wx.showToast({ title: '请输入API URL', icon: 'none' })
      return
    }
    if (!model) {
      wx.showToast({ title: '请输入模型名称', icon: 'none' })
      return
    }

    setApiMode('custom')
    setApiUrl(url)
    setApiKey(key)
    setModel(model)
    this.setData({
      hasKey: true,
      keyPlaceholder: key.substring(0, 6) + '****' + key.substring(key.length - 4),
      showKey: false
    })
    wx.showToast({ title: '保存成功', icon: 'success' })
  },

  clearConfig() {
    const that = this
    wx.showModal({
      title: '确认清除',
      content: '确定要清除已保存的配置吗？',
      success(res) {
        if (res.confirm) {
          setApiKey('')
          setApiUrl('')
          setModel('')
          that.setData({
            apiUrl: '',
            apiKey: '',
            modelName: '',
            hasKey: false,
            showKey: false,
            keyPlaceholder: '请输入 API Key'
          })
          wx.showToast({ title: '已清除', icon: 'success' })
        }
      }
    })
  },

  resetUrl() {
    this.setData({
      apiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
    })
  },

  async testConnection() {
    let url: string
    let key: string
    let model: string | undefined

    if (this.data.apiMode === 'default') {
      url = 'https://coding.dashscope.aliyuncs.com/v1/chat/completions'
      key = 'built-in'
      model = undefined
    } else {
      url = this.data.apiUrl.trim()
      key = this.data.apiKey.trim()
      model = this.data.modelName.trim() || undefined
    }

    if (!url || !key) {
      wx.showToast({ title: '请先填写完整配置', icon: 'none' })
      return
    }

    this.setData({ testing: true, testResult: null })

    if (this.data.apiMode === 'default') {
      const result = await testApi(url, getApiKey())
      this.setData({ testing: false, testResult: result })
    } else {
      const result = await testApi(url, key, model)
      this.setData({ testing: false, testResult: result })
    }
  },

  copyLink() {
    wx.setClipboardData({
      data: 'https://open.bigmodel.cn/usercenter/apikeys',
      success() {
        wx.showToast({ title: '链接已复制', icon: 'success' })
      }
    })
  }
})
