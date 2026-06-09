# 2048 网页小游戏

说明：这是一个纯前端的 2048 实现，包含分数记录和本地排行榜（使用 localStorage 存储）。

快速使用：

1. 在浏览器中打开 [index.html](index.html)。
2. 使用方向键或 WASD 控制方块，支持移动端触摸滑动。
3. 游戏结束后可输入昵称保存到本地排行榜（最多保存前 10 条）。

文件说明：

- index.html：主页面。
- style.css：样式文件。
- game.js：游戏逻辑、分数与排行榜实现。注释详尽，便于维护。

扩展建议：

- 已添加：当本地启动一个简单的 Node.js 服务器时，排行榜会发送到服务器保存（优先使用后端，失败回退到 localStorage）。

- 服务器（可选）说明：
	1. 进入 `server` 目录。
	2. 运行 `npm install` 安装依赖（需要 Node.js 环境）。
	3. 运行 `npm start` 启动服务器，默认监听 `http://localhost:3000`。
	4. 前端会向 `POST /leaderboard` 提交分数，并从 `GET /leaderboard` 获取排行榜。

- 其他建议：添加动画、可配置网格大小、撤销一步等功能。
