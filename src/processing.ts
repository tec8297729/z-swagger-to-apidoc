import * as fs from 'fs';
import { TransformOptions, Parameters } from './interface';

const emptyApiText = '无'; // 描述空占位符
const initData = {
  treeLevelIndex: 1,
};

class Processing {
  constructor(opts: TransformOptions, definitions) {
    this.opts = opts;
    this.definitions = definitions;
  }

  private opts: TransformOptions;
  private definitions;

  // 生成apidoc基础配置文件
  initApiJson = (rootDir: string, info) => {
    const apidocBaseData = {
      name: info.title || '标题',
      version: info.version || '0.0.1',
      description: info.description || '',
      title: this.opts.title || info.title || '',
      url: this.opts.baseUrl || '', // 请求前缀
    };
    fs.writeFileSync(`${rootDir}/apidoc.json`, JSON.stringify(apidocBaseData));
    // console.log('apidoc.json文件已更新');
  }

  // 版本号处理
  regVersion = (info) => {
    const reg = /\..*\..*/g.test(info.version);
    const newInfo = info;
    if (!reg) {
      newInfo.version = `${newInfo.version}.0`;
    }
    return newInfo;
  }

  // 生成jwt信息
  addJwt = (securityArr = [], opts) => {
    let newText = '';
    const jwtDes = opts.jwtDes || '登录、注册接口返回的jwt';
    const jwtName = opts.jwt || opts.bearer.name || 'jwt';
    // 带有指定bearer字段才添加jwt信息
    const addFlag = securityArr.some(item => item.bearer);
    if (addFlag) {
      newText += `* @apiHeader {String} ${jwtName} ${jwtDes}\n`;
    }
    return newText;
  }

  // 生成组标签
  addApiGroup = (tags: string[] = []) => {
    let newText = '';
    tags.forEach(tagItem => {
      newText += `* @apiGroup ${tagItem}\n`;
    });
    if (tags.length === 0) {
      newText = `* @apiGroup default\n`;
    }
    return newText;
  }

  // 生成请求参数标签
  addApiParam = (parameters: Parameters[] = []) => {
    let newText = '';
    // 循环处理swagger请求响应字段
    parameters!.forEach(item => {
      const { required, description, type, schema } = item;
      let { name } = item;
      initData.treeLevelIndex = 1; // 重置层级记录
      name = required ? name : `[${name}]`; // 改造成可选参数结构
      newText += `* @apiParam {${type}} ${name} ${description || emptyApiText}\n`;

      // 处理映射类型
      if (schema) {
        newText = this.handleSchema('apiParam', { schema });
      }
    });
    return newText;
  }

  // 生成响应参数标签
  addApiResponse = (responses) => {
    let newText = '';
    // 处理响应字段参数
    Object.keys(responses).forEach(item => {
      const { type, name, description, schema } = responses[item];
      initData.treeLevelIndex = 1;
      if (schema) {
        newText = this.handleSchema(`apiSuccess (Success ${item})`, { schema }); // 处理映射类型
      } else {
        // 无映射情况下、无多字段
        newText += `* @apiSuccess (Success ${item}) {${type || 'string'}} ${name || 'success'} ${description || emptyApiText}\n`;
        // let res = `
        // * @apiSuccess {Boolean} succeed 成功标识
        // * @apiSuccess {String} errorCode 结果码
        // * @apiSuccess {String} errorMessage 消息说明`;
      }
    });
    return newText;
  }

  // 获取映射ref的名称
  matchRefName = (ref: string) => {
    try {
      const reg = /(#\/definitions\/)(?<name>.*)/;
      return reg.exec(ref).groups.name;
    } catch (error) {
      return null;
    }
  }

  // 验证是否是ref字符串形式
  regRefNameFlag = (ref: string) => {
    return /(#\/definitions\/)(?<name>.*)/.test(ref);
  }

  // 生成映射出来的类型
  handleSchema = (apidocName, opts) => {
    // 映射节点层、数据字典、递归拼接前缀
    const { schema, oldMergeDefName, oldDes } = opts;
    const { type, items, $ref } = schema;
    let mergeApiParam = '';
    let defName;
    // console.log('处理次数', initData.treeLevelIndex);

    if (type === 'array') {
      // 多个映射类处理
      Object.values(items).forEach((v: string) => {
        defName = this.matchRefName(v);
        mergeApiParam += this.handleSchemaDef(apidocName, {
          defName, oldMergeDefName, oldDes,
        });
      });
    } else {
      // 单个映射类情况
      defName = this.matchRefName($ref);
      mergeApiParam = this.handleSchemaDef(apidocName, {
        defName, oldMergeDefName, oldDes,
      });
    }
    return mergeApiParam;
  }

  // 处理映射类生成文档注释（文档注释前缀、映射的名称、数据字典、递归的字段文档前缀）
  handleSchemaDef = (apidocName, opts) => {
    const { defName, oldMergeDefName, oldDes } = opts;
    const { type, properties, required } = this.definitions[defName]; // 当前类结构
    let mergeApiParam = '';
    const fieldReqired = {};

    // 必填字段处理
    if (required) {
      required.forEach(item => {
        fieldReqired[item] = true;
      });
    }

    // body注释
    // mergeApiParam += `* @${apidocName} {${type}} ${defName} ${oldDes || emptyApiText}\n`;
    Object.keys(properties).forEach(key => {
      let mergeName = `${key}`;
      // 组合前缀（递归过来的前缀）
      if (oldMergeDefName) {
        mergeName = `${oldMergeDefName}.${key}`;
      }

      mergeApiParam += this.schemaDefProperties(apidocName, {
        key, mergeName, properties, fieldReqired,
      });
    });
    return mergeApiParam;
  }

  // 映射类中的映射类(文档前缀名称)
  schemaDefProperties = (apidocName, opts) => {
    // 字段名、组合前缀名、当前字段数据集合、必传参数集合
    const { key, mergeName, properties, fieldReqired } = opts;
    const data = properties[key]; // 映射的具体字段相关参数
    const reqiredName = `[${mergeName}]`; // 字段名(默认是可选)
    let newType = data.type; // 字段类型
    let mergeApiParam = '';

    // 处理带有allOf字段，赋值描述及类型
    if (!data.description && data.allOf) {
      // console.log();
      // 获取字典指定key中的type字段
      newType = this.definitions[this.getDataAllOfParamter(data, 'refName')].type;
      data.description = this.getDataAllOfParamter(data, 'des'); // 获取allOf的des字段
    }
    // 处理单层映射字段
    mergeApiParam += `* @${apidocName} {${newType}} ${fieldReqired[key] ? mergeName : reqiredName} ${data.description || emptyApiText}\n`;

    // 还有映射层递归处理
    if (data.title) {
      const defName = this.matchRefName(data.allOf[0].$ref);
      newType = this.getMapingType(defName); // 获取映射级类型

      if (initData.treeLevelIndex < this.opts.treeLevel) {
        initData.treeLevelIndex += 1; // 记录层级次数
        mergeApiParam += this.handleSchema(apidocName, {
          schema: this.getDataAllOfParamter(data),
          oldMergeDefName: mergeName,
          oldDes: this.getDataAllOfParamter(data, 'des'),
        });
      }
    }

    // 集合类型处理，例如 array[string number]
    if (data!.items) {
      let mappingName;
      const text = Object.values(data.items).map((typeName: string) => {
        mappingName = this.matchRefName(typeName);
        if (mappingName) {
          return this.getMapingType(mappingName);
        }
        return typeName;
      }).join(' ');

      newType = `${newType}[${text}]`;
    }

    return mergeApiParam;
  }

  // 获取allOf参数上的指定属性值
  getDataAllOfParamter = (data, field: string = 'refDom') => {
    try {
      const typeData = {
        refDom: data.allOf!.filter(item => item.$ref)[0], // ref节点
        refName: this.matchRefName(data.allOf!.filter(item => item.$ref)[0].$ref), // ref处理后的名称
        des: data.allOf.filter(item => item.description)[0].description,
      };
      return typeData[field];
    } catch (error) {
      return null;
    }
  }

  // 返回指定字典中的类型
  getMapingType = (name: string) => {
    try {
      return this.definitions[name].type;
    } catch (error) {
      return null;
    }
  }
}

export default Processing;
