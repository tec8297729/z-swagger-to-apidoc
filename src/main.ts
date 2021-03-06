import { exec } from 'child_process';
import * as path from 'path';
import Processing from './processing';
import { TransformOptions } from './interface';
// const packageData = require('../package.json');
import * as fs from 'fs-extra';
import * as shelljs from 'shelljs';
import { TEMP_DIR } from './constant';

let flag = true;
const transformSwagger = async (
  document,
  opts: TransformOptions = {
    apidoc: true,
    treeLevel: 5,
    cutting: 100,
  }
) => {
  // console.log('package', packageData.name);
  if (!document) {
    console.warn('error: url地址的json为空，或者不是有一个swagger格式的文档');
    process.exit(1);
  }

  const { paths, definitions, securityDefinitions } = document;
  // 默认配置参数
  const defaultOpts = {
    ...opts,
    docsPath: opts!.docsPath || TEMP_DIR,
    apidocPath: opts!.apidocPath || '/apidoc',
  };
  const pro = new Processing(defaultOpts, definitions);
  const rootDir = process.cwd(); // 项目根路径
  const rootDirNodeModules = `${rootDir}`;
  // 生成文档位置
  const docsPath = path.join(rootDirNodeModules, defaultOpts.docsPath);
  const info = pro.regVersion(document.info);
  // 创建文件夹
  if (!fs.existsSync(docsPath)) {
    fs.mkdirSync(docsPath);
  }
  pro.initApiJson(docsPath, info);

  const textWrap = `/**<-- text -->*/\n`;
  let apiText;
  let AllApidocText = '';

  Object.keys(paths).forEach((apiUrlObj: string, index) => {
    const itemApiData = paths[apiUrlObj];
    Object.keys(itemApiData).forEach((itemKey) => {
      // 生成apidoc文档
      apiText = `
        * @api {${itemKey}} ${apiUrlObj} ${
        itemApiData[itemKey].summary || apiUrlObj
      }
        * @apiVersion ${info.version}
      `;

      // 权限jwt注释
      apiText += pro.addJwt(itemApiData[itemKey].security, {
        ...defaultOpts,
        bearer: securityDefinitions!.bearer,
      });
      apiText += pro.addApiGroup(itemApiData[itemKey].tags); // 接口分类
      // 请求参数生成
      apiText += pro.addApiParam(itemApiData[itemKey].parameters);
      // 响应参数生成
      apiText += pro.addApiResponse(itemApiData[itemKey].responses);
    });
    AllApidocText += textWrap.replace('<-- text -->', apiText);

    // 标记切割文档
    if (index && !(index % defaultOpts.cutting)) {
      AllApidocText += '<-- end -->\n';
    }
  });

  // 生成切割文档
  const cuttingApiTexts = AllApidocText.split(/<-- end -->/);
  cuttingApiTexts.forEach((cuttingText: string, index: number) => {
    // 生成apidoc文档文件
    if (cuttingText && cuttingText !== '\n') {
      fs.writeFile(`${docsPath}/${index}.js`, cuttingText, 'utf-8', (err) => {
        if (err) return err;
        // console.log(`更新apidoc.js文档成功`);
      });
    }
  });
  // 生成apidoc文档
  if (flag && defaultOpts.apidoc) {
    flag = false;
    const outPath = `${rootDir}${defaultOpts.apidocPath}`;
    excecShell(`apidoc -i ${docsPath} -o ${outPath}`);
  }
};

interface ExcecShellOpts {
  docsPath?: string;
  outputPath?: string;
  removeDocs?: boolean;
}

const excecShell = (
  shell: string,
  opts: ExcecShellOpts = {
    removeDocs: true,
    docsPath: TEMP_DIR,
  }
) => {
  exec(`${shell}`, (err, stdout, stderr) => {
    flag = true;
    if (err) {
      console.log(`error: 未安装apidoc`, err);
      return true;
    } else {
      // 移除注释文档
      if (opts!.removeDocs) {
        const { outputPath, docsPath } = opts;
        shelljs.rm('-rf', `${docsPath}`);
      }
    }
  });
};

export default {
  transformSwagger,
  excecShell,
};
