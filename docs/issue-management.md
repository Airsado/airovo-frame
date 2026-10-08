# Issue 模板、标签与 agent 操作规范

默认协作分支是 `dev`。仓库级 agent 入口是 [AGENTS.md](../AGENTS.md)，实现边界见 [CLAUDE.md](../CLAUDE.md)，PR 流程见 [CONTRIBUTING.md](../CONTRIBUTING.md)。

## 创建 Issue

网页入口提供 [Bug](../.github/ISSUE_TEMPLATE/01-bug.yml)、[功能建议](../.github/ISSUE_TEMPLATE/02-feature.yml)、[维护任务](../.github/ISSUE_TEMPLATE/03-maintenance.yml) 三类 Issue Forms。一个 Issue 聚焦一个独立问题，验收条件是本次任务的停止点。

| 类型 | 必填内容 | 自动标签 |
| --- | --- | --- |
| Bug | 影响模块、版本与环境、最小复现、实际行为与证据、预期行为、影响与边界、验收条件 | `bug`、`status:needs-triage` |
| 功能建议 | 影响模块、问题与使用场景、期望能力、现有方案与依据、最小交付与非目标、兼容性影响、验收条件 | `enhancement`、`status:needs-triage` |
| 维护任务 | 影响模块、背景与依据、目标与边界、实施方向、验收条件 | `maintenance`、`status:needs-triage` |

`相关源码与关联项` 为可选字段。证据应注明观察范围：静态依赖声明缺失、测试导入失败、行为断言失败和浏览器点击失败是不同结论，不能相互替代。未知的版本或尚未运行的验证直接注明，不编造结果。

Issue Forms 的 `labels` 会添加固定标签，但模块下拉不会自动添加 `area:*`，优先级也不会自动判定。维护者或 agent 读取内容与源码后补充。GitHub 网页禁用空白模板；API、CLI、连接器创建 Issue 不受网页表单校验约束，需要自行保留对应表单的标题和必填信息。

纯解释性问题使用 `question` 标签，并包含问题、版本或场景、已查资料与期望说明；不要假装存在尚未确认的 Bug。网页的操作说明入口可用于先查文档，必要时通过 API 或维护者创建问题 Issue。纯文档任务使用维护任务模板，评估后将类型换为 `documentation`。

## 标签契约

[.github/labels.json](../.github/labels.json) 是受管理标签的唯一清单。保留原有 GitHub 默认标签及用户自定义标签，不批量删除或重命名历史标签。

| 维度 | 约定 |
| --- | --- |
| 类型 | `bug`、`enhancement`、`maintenance`、`documentation`、`question` 选一个 |
| 模块 | 根据实际影响添加一个或多个 `area:*`；尚未定位时不猜测 |
| 优先级 | 评估后选一个 `priority:P0` 至 `priority:P3`；新提交允许不设 |
| 进度 | 打开的 Issue 至多一个 `status:*`；关闭使用 GitHub 的 closed 状态 |

模块与代码边界：

| 标签 | 对应范围 |
| --- | --- |
| `area:app` | `packages/core/app` 的启动、自注册和 AppShell |
| `area:forms` | `packages/core/forms` 的表单契约、字段、校验、焦点及联动 |
| `area:overlays` | composables 的 Modal/Drawer/OverlayStack 与 shared 的 owner、Portal 交互 |
| `area:components` | `packages/core/components` 的通用控件和数据展示 |
| `area:theme` | 主题、外观偏好、布局 UI 及颜色 |
| `area:routing` | router、permission、tabs、菜单和 KeepAlive |
| `area:request` | 请求基础能力、响应协议、错误标准化与 SSE |
| `area:auth` | 认证和 token 状态、会话与应用接入契约 |
| `area:i18n` | 语言包注册、覆盖、fallback 和语言状态 |
| `area:tooling` | manifests、lockfile、pnpm、Vite、测试工具、脚手架和仓库配置 |
| `area:docs` | 文档、贡献规则和 agent 使用说明 |

`priority:P0` 表示已确认的数据丢失、安全问题或整体不可用；`P1` 表示核心流程阻塞且缺少合理替代；`P2` 是一般功能或维护问题；`P3` 是非阻塞改进。优先级表达工作安排，不等于报告者的主观紧急程度。

状态流转：

1. 新报告使用 `status:needs-triage`。阅读源码、现有测试、评论与 PR，确认重复项和影响。
2. 关键复现信息缺失时替换为 `status:needs-info`，说明缺少什么；补齐后回到待评估。
3. 获得任务授权且实际开始实施后使用 `status:in-progress`，不能把仅阅读报告当作实施。
4. 独立 PR 提交后替换为 `status:in-review`。在 Issue 回填实现方案、commit、PR 链接、实际验证及限制。
5. PR 合并后由 `Closes #N` 关闭 Issue，并清除进度标签。当前默认分支是 `dev`；如果默认分支将来变更，GitHub 对关闭关键字的自动处理也可能变化，合并后检查实际状态。

状态标签不会自行流转；本仓库没有自动改状态的 workflow。重复报告使用 `duplicate` 并引用原 Issue，不独立重复修复；非问题和不计划处理的项可分别使用现有 `invalid`、`wontfix`，并说明依据。

新增标签用 `POST /repos/{owner}/{repo}/issues/{number}/labels`，它会保留其他标签。切换进度时只删除原 `status:*`，再添加新状态。不要用替换所有标签的接口清除他人的分类。历史关闭 Issue 只补内容分类，不追加“处理中”等状态。

## API 创建示例

例如使用 GitHub API 的 `POST /repos/{owner}/{repo}/issues` 提交 Bug 时：

```json
{
  "title": "[Bug] 禁用组件仍可清除值",
  "labels": ["bug", "area:components", "status:needs-triage"],
  "body": "### 影响模块\ncomponents / 内置组件\n\n### 版本与环境\ndev / 完整 commit；Node、pnpm、浏览器版本\n\n### 最小复现\n提供通用代码与操作步骤\n\n### 实际行为与证据\n描述实际 DOM 点击和发出的值更新，注明验证限制\n\n### 预期行为\n禁用时控件不应修改值\n\n### 影响与边界\n只处理禁用清除路径，不重构主题或弹层\n\n### 验收条件\n- [ ] 禁用时鼠标/键盘不可清空\n- [ ] 启用后正常清空\n\n### 相关源码与关联项\n相关文件与 Issue/PR 链接"
}
```

实际提交必须替换示例占位内容。Markdown 标题与网页表单保持一致，便于 agent 提取信息。Body 是普通 Markdown；不要将表单 YAML 当作 API body，也不要以为英文 `id` 会成为 API 的结构化字段。

若有 GitHub CLI，可将完整 JSON 写入文件后使用 `gh api --method POST repos/OWNER/REPO/issues --input /path/to/issue.json`。连接器或直接 API 调用同样可用；不要求安装另一套第三方仓库工具。

修复分支建议使用 `codex/issue-<编号>-<说明>`。每个修复 PR 只对应一个独立 Issue，以 `dev` 为目标，并使用 [PR 模板](../.github/pull_request_template.md)。授权实现不等于自动授权合并；不要提前删除未合并分支，更不能删除 `dev`。

## 同步标签定义

Node 脚本只添加缺失标签或同步清单中标签的规范名称、颜色、描述，不删除未列入清单的标签。名称匹配忽略大小写，避免重复创建。没有新增依赖。

```sh
# GITHUB_TOKEN 已通过环境安全提供；不要写进仓库或命令参数。
node scripts/sync-github-labels.mjs --repo Airsado/airovo-frame --check
node scripts/sync-github-labels.mjs --repo Airsado/airovo-frame --apply
```

也可通过 `GITHUB_REPOSITORY=OWNER/REPO` 提供目标仓库。默认模式是只读 `--check`：存在待同步项时返回 1，一致时返回 0。`--apply` 需要目标仓库的标签管理权限，例如 fine-grained token 的 Issues write；已有授权的 connector 或 Git 凭据同样可由调用方在内存中使用，脚本不读取或保存凭据。不要为运行脚本额外申请全仓库管理权限。

脚本自身回归：`node --test scripts/sync-github-labels.test.mjs`。同步完成后再次运行 `--check`，应报告 0 个待变更项。

## 生效与停止点

标签属于 GitHub 仓库元数据，创建后立即可用。网页 Issue Forms 和 PR 模板需要进入 GitHub 默认分支后生效；本仓库默认分支是 `dev`，仅在待合并分支存在模板不代表网页已经启用。

完成标准：模板格式与必填字段有效、标签清单可安全重复同步、实际 Issue 标签符合内容、API 与网页操作规则清晰、独立 PR 已回填任务 Issue。仓库配置任务不混入独立业务修复，也不以此为由运行或重构无关框架功能。
