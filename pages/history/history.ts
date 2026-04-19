import { getHistory, deleteHistory as apiDeleteHistory, clearHistory as apiClearHistory } from '../../utils/api'

interface IHistoryData {
  historyList: IHistoryRecord[]
  expandedId: number | null
  expandedAnswers: Record<string, boolean>
  isEmpty: boolean
}

Page<IHistoryData>({
  data: {
    historyList: [],
    expandedId: null,
    expandedAnswers: {},
    isEmpty: false
  },

  onShow() {
    this.loadHistory()
  },

  loadHistory() {
    const list = getHistory()
    this.setData({
      historyList: list,
      isEmpty: list.length === 0,
      expandedId: null,
      expandedAnswers: {}
    })
  },

  toggleExpand(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as number
    this.setData({
      expandedId: this.data.expandedId === id ? null : id,
      expandedAnswers: {}
    })
  },

  toggleAnswer(e: WechatMiniprogram.TouchEvent) {
    const { id, index } = e.currentTarget.dataset
    const key = `${id}_${index}`
    const expanded = { ...this.data.expandedAnswers }
    expanded[key] = !expanded[key]
    this.setData({ expandedAnswers: expanded })
  },

  deleteItem(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as number
    const that = this
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条错题记录吗？',
      success(res) {
        if (res.confirm) {
          apiDeleteHistory(id)
          that.loadHistory()
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
  },

  clearAll() {
    const that = this
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有错题记录吗？此操作不可恢复。',
      success(res) {
        if (res.confirm) {
          apiClearHistory()
          that.loadHistory()
          wx.showToast({ title: '已清空', icon: 'success' })
        }
      }
    })
  }
})
