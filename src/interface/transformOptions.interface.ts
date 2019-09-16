interface TransformOptions {
  baseUrl?: string; // 所有接口请求前缀
  title?: string; // 文档网页标题
  jwt?: string; // 必带参数字段定义，权限验证
  jwtDes?: string; // 请求头必带参数描述
  apidoc?: boolean; // 是否自动生成apidoc，默认flase
  docsPath?: string; // 生成注释文档位置
  apidocPath?: string; // 生成apidoc文档位置
  treeLevel?: number; // 生成文档层级能力，默认5
  cutting?: number; // 指定每N个文档切割成一个文件，默认100
}

export default TransformOptions;
