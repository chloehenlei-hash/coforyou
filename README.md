# Coforyou Live Calendar

这是 Coforyou 内部用的直播、团购、活动排期网站原型。当前版本不需要安装任何东西，直接打开 `index.html` 就能看。

## Google Sheet 数据格式

建议 Google Sheet 第一行使用这些栏位：

| month | date | type | brand | status | platform | product | package | previousSales | target | importantNotice | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 5月份 | 8/5 | 专场 | Kiehl's | 已谈好 | Website | 专场产品 | 待补充 | 93k |  | 只能面交不能邮寄！！ | 4/5 开团 |

也可以使用中文栏位：月份、日期、活动、品牌、状态、平台、产品、配套、Previous Sales、TARGET、重要通知、重要事项。

## 连接 Google Sheet

1. 在 Google Sheet 选择 `File > Share > Publish to web`。
2. 选择要发布的 Sheet，并选择 `Comma-separated values (.csv)`。
3. 复制发布出来的 CSV 链接。
4. 打开 `app.js`，把最上面的链接改成：

```js
const SHEET_CSV_URL = "你的 Google Sheet CSV 链接";
```

保存后刷新网页即可。

`SHEET_CSV_URL` 是网站读取资料用的公开 CSV 链接。团队编辑资料时，直接进入原本的 Google Sheet 编辑即可。

## 当前页面功能

- 按月份分类查看活动。
- 按日期查看同一天开卖的不同品牌。
- 区分 `已谈好` 和 `Potential` 品牌。
- 展示产品、配套、平台、Previous Sales、Target、重要事项。
- 顶部显示 `品牌重要通知 ❗️` 跑马灯；点开可看全部品牌重要通知。
- 每个品牌格子里有 `重要通知` 按钮，有通知的品牌会高亮。
- 支持搜索品牌、产品和备注。
- 自动计算品牌数量和总 Target。
