# Rail Map Painter

Rail Map Painter is an open-source React project aimed at making the process of creating custom rail maps easy and fun. This tool provides an interactive SVG canvas where users can add stations, connect them using lines, and customize their maps with a wide array of icons from different cities.

> Branches are renamed in v5 release. For more information see [here](./docs/developer-guide.md#rename-your-local-branches)

---

其他说明见原仓库文档，此处简单说明部署流程

1. 每次更新了线路图，需要放在`src/saves/tutorial.json`，名字不能变，覆盖即可
2. 确保服务器装了nodejs，npm，运行`npm ci`以及`npm run build`
3. 如果没问题，完成后输出静态网页在dist目录，直接放对应http服务即可

解释说明一下：

1. 这个线路图就是固定的不能编辑，这里实际上是把原来编辑器的自动保存功能给阻断了，强制它每次都读取那一个初始的介绍文件，也就是`tutorial.json`，将其替换成要展示的图，这样无论做不做更改，每次刷新都加载回线路图。
2. 好的办法可能是搭建一个文件上传页面，每次更新上传新文件覆盖上述json文件，并自动运行`npm run build`，实现一键更新。

