# 欢迎使用 z-swagger-to-apidoc 文档转换工具

------

一款精简便捷的转换工具，一键转换生成apidoc文档。
不限于当前项目内生成文档，可生成所有能访问swagger的json数据都可生成在当前项目内。

安装插件包及生成文档的依赖包**apidoc**：
```
npm i z-swagger-to-apidoc --save-dev
```

------


### 1. 制作生成apidoc文档的命令

在项目根目录package.json内，添加一条命令
```json
{
  "name": "z-swagger-to-apidoc",
  "license": "MIT",
  "scripts": {
    "build:doc": "zapidoc -u http://localhost:19005/api-doc-json -rd false",
  }
}
```

输入**npm run build:doc**命令后，开始生成apidoc文档，会访问指定的url链接获取json格式的swagger文档，并且生成apidoc的注释版本文档(/docs目录内)及网页版本的文档(/apidoc目录内)。
-rd false会在生成完网页版本的apidoc文档后，关闭自动删除注释版本文档功能。


### 2. 通用参数说明

|       字段        | 必选  |                   说明                   |
| :---------------: | :---: | :--------------------------------------: |
|     -u、--url     | true  |      swagger文档的url地址，JSON格式      |
|   -o、--output    | false |        默认输出根目录apidoc文件内        |
|    -d、--docs     | false |         生成apidoc纯注释文件目录         |
| -rd、--removeDocs | false | 是否自动清除纯注释版本目录、默认自动删除 |



### 8. 注意细节

-u参数一定要是网络可访问的形式的json格式，如果是下载好的json格式文件的话，是启动当前项目服务，随便放进一个可访问的目录内，获取url可访问的链接即可。

