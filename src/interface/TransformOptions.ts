interface TransformOptions {
  baseUrl?: string; // 所有接口请求前缀
  docTitle?: string; // 文档网页标题
  jwt?: string; // 必带参数字段定义，权限验证
  jwtDes?: string; // 请求头必带参数描述
  docsPath?: string; // 生成注释文档位置
  treeLevel: number; // 生成文档层级能力，默认5
}

export {
  TransformOptions,
};
