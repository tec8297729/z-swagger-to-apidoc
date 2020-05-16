swagger转换成apidoc文档插件

```
npm i z-swagger-to-apidoc --save-dev
```

一款精简便捷的转换工具，一键转换生成apidoc文档。<br>
不限于当前项目内生成文档，可生成所有能访问swagger的json数据都可生成在当前项目内。<br>


### 1. 制作生成apidoc文档的命令

在项目根目录package.json内，添加一条命令
```json
{
  "name": "z-swagger-to-apidoc",
  "scripts": {
    "build:doc": "zapidoc -u http://localhost:19005/api-doc-json -rd false",
  }
}
```

输入**npm run build:doc**命令后，开始生成apidoc文档，会访问指定的url链接获取json格式的swagger文档，并且生成apidoc的注释版本文档(/docs目录内)及网页版本的文档(/apidoc目录内)。
-rd false会在生成完网页版本的apidoc文档后，关闭自动删除注释版本文档功能。


### 2. 命令行参数说明

|       字段        | 必选  |                   说明                   |
| :---------------: | :---: | :--------------------------------------: |
|     -u、--url     | true  |      swagger文档的url地址，JSON格式      |
|   -o、--output    | false |        默认输出根目录apidoc文件内        |
|    -d、--docs     | false |         生成apidoc纯注释文件目录         |
| -rd、--removeDocs | false | 是否自动清除纯注释版本目录、默认自动删除 |



注意细节

-u参数一定要是网络可访问的形式的json格式，如果是下载好的json格式文件的话，是启动当前项目服务，随便放进一个可访问的目录内，获取url可访问的链接即可。


## 自动生成apidoc文档方式

本地调试node写接口即时生成apidoc文档，方便在开发环境以更美观的方式实时查看文档<br>

PS：如果项目大建议使用手动生成，自动生成文档相对非常消耗性能。<br>

在node入口文件加入自动生成代码，nestjs框架中使用案例，main文件如下：<br>

```js
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import swaggerToApidoc from 'z-swagger-to-apidoc';
import axios from 'axios';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  if (process.env.NODE_ENV !== 'production') {
    const options = new DocumentBuilder()
      .setTitle('API DOC')
      .setDescription('api doc of FE other server')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('api-doc', app, document);

    // 使用插件自动转换成apidoc
    // 方式一：传入swagger文档数据
    swaggerToApidoc.transformSwagger(document, {
      apidoc: true,
      baseUrl: '', // 自定义接口前缀
      treeLevel: 10,
    });

    // 方式二：使用请求的方式获取json数据
    axios.get('http://localhost:19005/api-doc-json').then(json => {
      swaggerToApidoc.transformSwagger(json);
    })
  }
  await app.listen(3000);
}
bootstrap();

```


### 配置参数介绍

|   字段    | 必选  |            默认参数            |                       说明                        |
| :-------: | :---: | :----------------------------: | :-----------------------------------------------: |
|  baseUrl  | false |                                |               生成的所有接口url前缀               |
|   title   | false |        读取swagger标题         |             自定义apidoc文档网页标题              |
|    jwt    | false | 读取swagger的addBearerAuth参数 |                jwt字段重新定义名称                |
|  jwtDes   | false |          内置jwt描述           |                    jwt参数描述                    |
| treeLevel | false |               5                | 生成apidoc文档层级能力，默认支持生成嵌套5层的参数 |
|  cutting  | false |              100               |            指定每N个文档切割成一个文件            |
|  apidoc   | false |             false              |              是否自动生成apidoc文档               |

