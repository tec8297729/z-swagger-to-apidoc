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
本地调试node写接口即时生成apidoc文档，方便在开发环境以更美观的方式实时查看文档


###1、在node入口文件加入自动生成代码
这是使用nestjs案例，入口文件如下：
```node
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import swaggerToApidoc from 'z-swagger-to-apidoc';
import axios from 'axios';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);


  // swagger 文档构建
  if (process.env.NODE_ENV !== 'production') {
    console.log('生成文档');

    const options = new DocumentBuilder()
      .setTitle('API DOC') // 标题
      .setDescription('api doc of FE other server') // 描述
      .setVersion('1.0') // 版本
      .addBearerAuth('jwt')
      .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('api-doc', app, document);
    // 以上完成swagger文档生成，官方例子没特别之处
    
    
    // 使用插件自动转换成apidoc，
    // 方式一：传入swagger文档json格式
    swaggerToApidoc(document, {
        apidoc: true,
        baseUrl: '', // 自定义接口前缀
        treeLevel: 10,
    });

    // 方式二：使用请求的方式获取json数据
    axios.get('http://localhost:19005/api-doc-json').then(json => {
        swaggerToApidoc(json, {
            apidoc: true, // 自动生成apidoc文档
        });
    })
  }
  await app.listen(3000);
}
bootstrap();

```
以上只要是非生产环境，都会在每次更新代码的时候，自动生成swagger文档的时候，自动生成apidoc文档文件。


###2、配置参数介绍

|   字段    | 必选  |            默认参数            |                       说明                        |
| :-------: | :---: | :----------------------------: | :-----------------------------------------------: |
|  baseUrl  | false |                                |               生成的所有接口url前缀               |
|   title   | false |        读取swagger标题         |             自定义apidoc文档网页标题              |
|    jwt    | false | 读取swagger的addBearerAuth参数 |                jwt字段重新定义名称                |
|  jwtDes   | false |          内置jwt描述           |                    jwt参数描述                    |
| treeLevel | false |               5                | 生成apidoc文档层级能力，默认支持生成嵌套5层的参数 |
|  cutting  | false |              100               |            指定每N个文档切割成一个文件            |
|  apidoc   | false |             false              |              是否自动生成apidoc文档               |

