import { analyzeQuestion, saveToHistory } from '../../utils/api'

interface IIndexData {
  imagePath: string
  analyzing: boolean
  result: IAnalysisResult | null
  showResult: boolean
  expandedAnswers: Record<number, boolean>
  scrollTop: number
}

Page<IIndexData>({
  data: {
    imagePath: '',
    analyzing: false,
    result: null,
    showResult: false,
    expandedAnswers: {},
    scrollTop: 0
  },

  chooseImage() {
    const that = this
    wx.showActionSheet({
      itemList: ['拍照识别', '从相册选择'],
      success(res) {
        const sourceType: WechatMiniprogram.ChooseMediaOption['sourceType'] = res.tapIndex === 0 ? ['camera'] : ['album']
        wx.chooseMedia({
          count: 1,
          mediaType: ['image'],
          sourceType: sourceType,
          sizeType: ['compressed'],
          success(mediaRes) {
            const tempFilePath = mediaRes.tempFiles[0].tempFilePath
            that.setData({
              imagePath: tempFilePath,
              result: null,
              showResult: false,
              expandedAnswers: {}
            })
            that.analyzeImage(tempFilePath)
          }
        })
      }
    })
  },

  analyzeImage(imagePath: string) {
    const that = this
    this.setData({ analyzing: true })

    analyzeQuestion(imagePath).then(function (result) {
      const record: IHistoryRecord = {
        imagePath: imagePath,
        original_question: result.original_question,
        error_analysis: result.error_analysis,
        subject: result.subject,
        knowledge_points: result.knowledge_points,
        similar_questions: result.similar_questions
      }
      saveToHistory(record)

      that.setData({
        analyzing: false,
        result: result,
        showResult: true
      })
    }).catch(function (err: any) {
      that.setData({ analyzing: false })
      wx.showModal({
        title: '分析失败',
        content: err.message || '请检查网络连接和API Key配置',
        showCancel: false
      })
    })
  },

  reAnalyze() {
    if (this.data.imagePath) {
      this.setData({
        result: null,
        showResult: false,
        expandedAnswers: {}
      })
      this.analyzeImage(this.data.imagePath)
    }
  },

  toggleAnswer(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index as number
    const expanded = { ...this.data.expandedAnswers }
    expanded[index] = !expanded[index]
    this.setData({ expandedAnswers: expanded })
  },

  resetPage() {
    this.setData({
      imagePath: '',
      analyzing: false,
      result: null,
      showResult: false,
      expandedAnswers: {}
    })
  },

  previewImage() {
    if (this.data.imagePath) {
      wx.previewImage({
        urls: [this.data.imagePath]
      })
    }
  },

  onShareAppMessage(): WechatMiniprogram.Page.IShareAppMessageOption {
    return {
      title: '知错学堂 - 拍照识错题，举一反三',
      path: '/pages/index/index'
    }
  }
})
