# Coforyou Meeting Board

这个 folder 是给团队记录 meeting 重点的网页。

## Upload 去 GitHub

上传整个 `meeting-board` folder：

- `meeting-board/index.html`
- `meeting-board/styles.css`
- `meeting-board/app.js`
- `meeting-board/google-apps-script.js`
- `meeting-board/README.md`

如果 GitHub Pages 已经开了，网址会像这样：

`https://chloehenlei-hash.github.io/coforyou/meeting-board/`

## 连接 Google Sheet

1. 新开一个 Google Sheet。
2. 去 `Extensions` -> `Apps Script`。
3. 把 `google-apps-script.js` 里面的内容全部复制进去。
4. 点 `Deploy` -> `New deployment`。
5. Type 选择 `Web app`。
6. `Execute as` 选择 `Me`。
7. `Who has access` 选择 `Anyone with the link`。
8. Deploy 后复制 `Web app URL`。
9. 打开 `meeting-board/app.js`，把链接放进这里：

```js
const SHEET_API_URL = "PASTE_YOUR_WEB_APP_URL_HERE";
```

10. 重新上传 `meeting-board/app.js` 到 GitHub。

连接好后，网页会自动从 Sheet 读取资料；团队在网页新增、编辑、打勾、删除事项后，也会同步回同一个 Sheet。

## Sheet Columns

Apps Script 会自动建立这些 columns：

`id, department, category, text, owner, due, meetingTitle, meetingDate, priority, notes, done, updatedAt`
