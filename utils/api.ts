const BUILT_IN_API_URL = 'https://coding.dashscope.aliyuncs.com/v1/chat/completions'
const BUILT_IN_API_KEY = 'sk-sp-16b5d5fe2a3849c891aa6a690f26b66b'
const BUILT_IN_MODEL = 'qwen3.5-plus'
const CUSTOM_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'

type ApiMode = 'default' | 'custom'

function getApiMode(): ApiMode {
  return wx.getStorageSync('zhipu_api_mode') || 'default'
}

function setApiMode(mode: ApiMode): void {
  wx.setStorageSync('zhipu_api_mode', mode)
}

function getApiUrl(): string {
  if (getApiMode() === 'default') {
    return BUILT_IN_API_URL
  }
  return wx.getStorageSync('zhipu_api_url') || CUSTOM_API_URL
}

function setApiUrl(url: string): void {
  wx.setStorageSync('zhipu_api_url', url)
}

function getApiKey(): string {
  if (getApiMode() === 'default') {
    return BUILT_IN_API_KEY
  }
  return wx.getStorageSync('zhipu_api_key') || ''
}

function setApiKey(key: string): void {
  wx.setStorageSync('zhipu_api_key', key)
}

function getModel(): string {
  if (getApiMode() === 'default') {
    return BUILT_IN_MODEL
  }
  return wx.getStorageSync('zhipu_model') || 'glm-4.6v-flash'
}

function setModel(model: string): void {
  wx.setStorageSync('zhipu_model', model)
}

function fileToBase64(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().readFile({
      filePath: filePath,
      encoding: 'base64',
      success: res => resolve(res.data as string),
      fail: reject
    })
  })
}

function getMimeType(filePath: string): string {
  const ext = filePath.split('.').pop()!.toLowerCase()
  const map: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'bmp': 'image/bmp',
    'webp': 'image/webp'
  }
  return map[ext] || 'image/jpeg'
}

async function testApi(apiUrl: string, apiKey: string, overrideModel?: string): Promise<IApiTestResult> {
  if (!apiUrl || !apiKey) {
    return { success: false, message: '请先填写 API URL 和 API Key' }
  }

  const model = overrideModel || getModel()

  try {
    const res = await new Promise<WechatMiniprogram.RequestSuccessCallbackResult>(function (resolve, reject) {
      wx.request({
        url: apiUrl,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        data: {
          model: model,
          messages: [{ role: 'user', content: '你好，请回复"连接成功"' }],
          max_tokens: 20
        },
        success: resolve,
        fail: reject
      })
    })

    const data = res.data as IApiResponse

    if (res.statusCode === 200) {
      const content = data.choices && data.choices[0] && data.choices[0].message
        ? data.choices[0].message.content : ''
      return { success: true, message: '连接成功！模型回复：' + content }
    }

    if (res.statusCode === 401) {
      return { success: false, message: '认证失败：API Key 无效或已过期，请检查后重试' }
    }
    if (res.statusCode === 403) {
      return { success: false, message: '权限不足：该 API Key 没有访问权限，请检查账户状态' }
    }
    if (res.statusCode === 404) {
      return { success: false, message: '接口地址错误：请检查 API URL 是否正确（返回404）' }
    }
    if (res.statusCode === 429) {
      return { success: false, message: '请求频率超限：API 调用次数已达上限，请稍后再试' }
    }
    if (res.statusCode === 500 || res.statusCode === 502 || res.statusCode === 503) {
      return { success: false, message: '服务器错误（' + res.statusCode + '）：大模型服务暂时不可用，请稍后再试' }
    }

    const errMsg = data && data.error ? data.error.message : ''
    return { success: false, message: '请求失败（HTTP ' + res.statusCode + '）' + (errMsg ? '：' + errMsg : '') }
  } catch (err: any) {
    if (err.errMsg && err.errMsg.indexOf('request:fail') !== -1) {
      return { success: false, message: '网络连接失败：请检查网络是否正常，以及 API URL 是否可访问（可能需要在微信公众平台添加合法域名）' }
    }
    return { success: false, message: '请求异常：' + (err.errMsg || err.message || '未知错误') }
  }
}

async function analyzeQuestion(imagePath: string): Promise<IAnalysisResult> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('请先在设置页面配置 API Key')
  }

  const apiUrl = getApiUrl()

  const base64Data = await fileToBase64(imagePath)
  const mimeType = getMimeType(imagePath)
  const imageUrl = `data:${mimeType};base64,${base64Data}`

  const messages: IApiMessage[] = [
    {
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: {
            url: imageUrl
          }
        },
        {
          type: 'text',
          text: '请分析这道错题，完成以下任务：\n1. 识别题目：完整识别图片中的题目内容。\n2. 分析错因：分析可能的出错原因。\n3. 举一反三：生成3道类型相似的练习题，包含题目和解答。\n\n请严格按JSON格式返回：\n{"original_question":"原题内容","error_analysis":"错因分析","subject":"学科","knowledge_points":["知识点"],"similar_questions":[{"question":"题目1","answer":"解答1"},{"question":"题目2","answer":"解答2"},{"question":"题目3","answer":"解答3"}]}'
        }
      ]
    }
  ]

  let res: WechatMiniprogram.RequestSuccessCallbackResult
  try {
    const payload = {
      model: getModel(),
      messages: messages,
      temperature: 0.7,
      max_tokens: 4096
    }

    console.log('Sending to:', apiUrl)
    console.log('Model:', payload.model)
    console.log('Messages count:', payload.messages.length)
    console.log('Image base64 length:', base64Data.length)

    res = await new Promise<WechatMiniprogram.RequestSuccessCallbackResult>(function (resolve, reject) {
      wx.request({
        url: apiUrl,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        data: payload,
        success: resolve,
        fail: reject
      })
    })
  } catch (err: any) {
    console.error('API request error:', err)
    throw new Error('网络请求失败：' + (err.errMsg || '请检查网络连接和API URL'))
  }

  console.log('API response status:', res.statusCode)
  console.log('API response data:', JSON.stringify(res.data).substring(0, 1000))

  if (res.statusCode !== 200) {
    let errMsg = '请求失败(' + res.statusCode + ')'
    const data = res.data as any
    if (data) {
      if (data.error && data.error.message) {
        errMsg = data.error.message
      } else if (typeof data === 'string') {
        errMsg = data.substring(0, 200)
      } else {
        errMsg = JSON.stringify(data).substring(0, 200)
      }
    }
    throw new Error('API报错：' + errMsg)
  }

  const apiData = res.data as IApiResponse
  if (!apiData || !apiData.choices || !apiData.choices[0]) {
    throw new Error('API返回数据格式异常：' + JSON.stringify(res.data).substring(0, 300))
  }

  const content = apiData.choices[0].message.content
  let parsed: IAnalysisResult
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]) as IAnalysisResult
    } else {
      throw new Error('无法解析')
    }
  } catch (e) {
    parsed = {
      original_question: content,
      error_analysis: '',
      subject: '',
      knowledge_points: [],
      similar_questions: []
    }
  }

  return parsed
}

function saveToHistory(record: IHistoryRecord): IHistoryRecord {
  const history: IHistoryRecord[] = wx.getStorageSync('error_history') || []
  record.id = Date.now()
  record.createTime = new Date().toLocaleString('zh-CN')
  history.unshift(record)
  if (history.length > 100) {
    history.pop()
  }
  wx.setStorageSync('error_history', history)
  return record
}

function getHistory(): IHistoryRecord[] {
  return wx.getStorageSync('error_history') || []
}

function deleteHistory(id: number): void {
  let history: IHistoryRecord[] = wx.getStorageSync('error_history') || []
  history = history.filter(item => item.id !== id)
  wx.setStorageSync('error_history', history)
}

function clearHistory(): void {
  wx.setStorageSync('error_history', [])
}

export {
  getApiMode,
  setApiMode,
  getApiUrl,
  setApiUrl,
  getApiKey,
  setApiKey,
  getModel,
  setModel,
  testApi,
  analyzeQuestion,
  saveToHistory,
  getHistory,
  deleteHistory,
  clearHistory
}
