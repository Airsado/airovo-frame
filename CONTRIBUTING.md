# 贡献与修复流程

当前日常迭代的目标分支是 `dev`。正式版本合并到主分支的工作单独进行。

每个修复 PR 只对应一个 Issue，独立问题分别提交。存在实现依赖时在 PR 中说明，通用协作文档单独提交，不混入修复 PR。

## 提交与分类 Issue

新 Issue 使用 [Bug、功能建议或维护任务模板](.github/ISSUE_TEMPLATE)。模板统一收集源码依据、范围和验收条件。只讨论一个独立问题，区分已验证事实和猜测。

类型标签沿用 `bug`、`enhancement`、`documentation`、`question`，维护任务使用 `maintenance`；`area:*` 表示影响模块，`priority:P0` 至 `priority:P3` 表示评估后的优先级。尚未评估不强制填写优先级。

处理中只保留一个 `status:*`：待评估、待补充、实施中、待合并。PR 提交后不提前关闭 Issue；关闭状态由 GitHub 表示，不追加完成标签。标签定义见 [.github/labels.json](.github/labels.json)，详细规则和 API 创建示例见 [Issue 与 agent 操作规范](docs/issue-management.md)。

Agent 先阅读 [AGENTS.md](AGENTS.md) 与 CLAUDE.md。通过 API 创建 Issue 时同样填写对应模板的字段；GitHub Issue Forms 不会自动校验 API 的 Markdown 内容，也不会把 area 下拉选项自动转换为标签。

## 修复 Issue

1. 在 Issue 中说明通用复现步骤、影响范围和预期行为。
2. 从最新 `dev` 创建短期分支，例如 `codex/fix-form-context`。
3. 先补能够复现问题的回归测试，再做最小修复，执行相关包的测试、lint 和类型检查。涉及字段渲染、遮挡、焦点或键盘行为时，还需要真实浏览器验收。
4. 按内容提交，例如 `fix(forms): isolate form instance contexts`。提交信息可使用 `Refs #6` 关联问题。
5. 创建以 `dev` 为目标的 PR，写明触发条件、修复行为、验证结果和限制，并使用 `Closes #6` 等关键字关联 Issue。
6. 在对应 Issue 评论中补充 PR 链接、实现方案和测试结果。修复完成以 PR 合并为准，不因本地测试通过而提前关闭 Issue。
7. 合并后删除 PR 来源分支，保留提交和 Issue 的追踪记录。不要删除 `dev`；未合并 PR 的来源分支也不要提前删除。

个人项目同样可以采用这个流程。PR 需要不同于目标分支的来源分支；直接提交到 `dev` 并在 Issue 引用 commit 可以追踪变更，但无法提供独立的合并审查。

## 修改边界

- 框架能力放在 `packages/core`，应用业务放在 `apps` 和 `app-ui`。
- 保持 shadcn-vue 基础源码原样，在框架组件层组合需要的行为。
- 问题报告和 PR 使用通用复现，不附业务端点、凭据、token 或未授权的业务资料。
- 同步受影响的 Demo、create-app 模板和文档，避免示例与公开 API 不一致。
