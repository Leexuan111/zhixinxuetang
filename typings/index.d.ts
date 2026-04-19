interface IAppOption {
  globalData: {
    userInfo: WechatMiniprogram.UserInfo | null
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback
}

interface IApiTestResult {
  success: boolean
  message: string
}

interface ISimilarQuestion {
  question: string
  answer: string
}

interface IAnalysisResult {
  original_question: string
  error_analysis: string
  subject: string
  knowledge_points: string[]
  similar_questions: ISimilarQuestion[]
}

interface IHistoryRecord {
  id?: number
  createTime?: string
  imagePath: string
  original_question: string
  error_analysis: string
  subject: string
  knowledge_points: string[]
  similar_questions: ISimilarQuestion[]
}

interface IApiMessageContent {
  type: 'image_url' | 'text'
  image_url?: { url: string }
  text?: string
}

interface IApiMessage {
  role: 'user' | 'assistant' | 'system'
  content: string | IApiMessageContent[]
}

interface IApiResponseChoice {
  message: {
    content: string
    role: string
  }
  finish_reason: string
  index: number
}

interface IApiResponse {
  choices: IApiResponseChoice[]
  created: number
  id: string
  model: string
  object: string
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  error?: {
    code: string
    message: string
  }
}
