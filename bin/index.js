#!/usr/bin/env node
const argv = require('minimist')(process.argv.slice(2));
const program = require('commander');
const fetch = require('node-fetch');
const package = require('../package.json');
const main = require('../dist/main').default; // 编译后入口
// var exec = require('child_process').exec;

const TEMP_DIR = './tempdocs';

const initData = {
  name: 'generateApidoc',
};

// 定义命令及介绍
program
  .name(package.name) // 名称
  .option('-u, --url <url>', '输入json文档地址，如: http://localhost/name.json')
  .option('-o, --output <output>', 'apidoc文档输出位置，默认当前目录doc下')
  .option('-d, --docs <docs>', '生成注释文档目录')
  .option(
    '-rd, --removeDocs <removeDocs>',
    '生成完apidoc文档，是否删除注释版本目录， 传入： -rd true删除'
  );
// .parse(process.argv);

program.on('--help', function () {
  console.log(`
  Examples:
    $ ${initData.name} --help 查看帮助命令
    $ ${initData.name} -h 查看帮助-简写
  `);
});
program.parse(process.argv);

const initApiDoc = async () => {
  const { output, docs, url, removeDocs } = program.opts();
  if (url) {
    const newUrl = /^((https|http|ftp)?:\/\/).*/.test(url)
      ? url
      : `http://${url}`;
    const newDocs = docs || TEMP_DIR;
    const resJson = await fetch(newUrl).then((res) => res.json());
    const newOutPath = output || './apidoc'; // 输出路径
    await main.transformSwagger(resJson);
    await main.excecShell(`apidoc -i ${newDocs} -o ${newOutPath}`, {
      docsPath: newDocs,
      outputPath: newOutPath,
      removeDocs: removeDocs || true, // 清除注释文档
    });
    return;
  }

  console.log(`error: 未带有-u参数或--url参数`);
  process.exit(1);
};

initApiDoc();
