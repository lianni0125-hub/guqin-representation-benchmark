# 古琴表征研究框架

[English](README.md) | [简体中文](README.zh-CN.md)

[GitHub 仓库](https://github.com/lianni0125-hub/guqin-representation-benchmark)

这是一个保留数据来源信息、用于构建和评估古琴谱字—演奏动作可解释表征的研究框架。

本仓库**不重新分发上游语料的逐行数据**。仓库提供数据源适配器、映射说明、确定性的曲目分组评估、表征规格、信息泄漏测试、非重构性汇总结果，以及供合法取得上游材料的研究者在本地运行的数据构建流程。

## 科学研究范围

本框架以古琴谱字—动作序列为对象，检验若干源于音系表征研究的原则，包括对立、特征分解、语境可恢复性、层级组织和表征经济性。研究并不预设古琴音乐具有与自然语言音系学等同的“音系系统”。

当前参考研究包含两个基于 GQ39 的任务：

- **T1：**预测演奏侧六分类左手音高运动，共 2,303 个事件；
- **T2：**预测谱面侧右手单音/多音攻击，共 1,712 个合格事件。

评估采用按完整曲目组留一的方式，共十个曲目组。注册的表征包括：仅语境表征（R5）、原子表征（R0）、音高中心表征（R1）、手势中心表征（R2）、扁平联合表征（R3）和多层表征（R4）；R4M 是移除跨层关联项的消融版本。

## 仓库包含什么

- 有版本记录的任务和表征规格；
- GQ39 本地数据构建及审计脚本；
- 仅在训练折拟合的特征词表，以及明确的 `BOS`、`MISSING`、`PREV_UNRESOLVED` 和 `UNK` 处理；
- 确定性的分组划分生成与信息泄漏检查；
- 可在 CPU 上运行的参考模型和经过测试的评估指标；
- 不能用于重构原始数据的汇总参考结果；
- 数据来源、权利边界、论断边界和数据卡文档。

## 仓库不包含什么

- GQ39 工作簿或音频；
- Guqin-Dataset 的 MusicXML 文件；
- guqinMM 或 KuiSCIMA 的第三方图像、媒体或标注；
- 本地生成的统一事件级数据表；
- 逐行留出预测结果；
- 可定位到原始数据行的错误案例。

上游材料的获取方式和权利边界见 [THIRD_PARTY_DATA.md](THIRD_PARTY_DATA.md)。

## 许可证

项目原创软件采用 [MIT License](LICENSE)。项目原创文档、schema、合成示例和原创元数据表采用 [CC BY 4.0](LICENSE-DATA)。这两项许可证均不覆盖 [THIRD_PARTY_DATA.md](THIRD_PARTY_DATA.md) 所列的上游语料或第三方资产。

## 快速开始

环境要求：

- Python 3.10；
- Node.js 20 或以上；
- 按文档要求合法取得并放置于本地的上游输入。

安装参考环境：

```powershell
python -m venv .venv-research
.\.venv-research\Scripts\python.exe -m pip install -r requirements-research-lock.txt
npm install
```

运行不需要第三方数据的测试：

```powershell
.\.venv-research\Scripts\python.exe -m unittest tests.test_research_metrics
node --test tests/representation_encoders.test.mjs
node --test tests/release_matrix.test.mjs
node --test tests/research_gate.test.mjs
```

验证虚构的合成示例，并用正式 R2 编码与模型流程完成端到端运行：

```powershell
node src/validate_public_fixture.mjs
.\.venv-research\Scripts\python.exe -m src.run_public_demo
```

示例中的 16 行数据均标记为 `SYNTHETIC`。其分数只用于检查软件流程，不能视为科学研究结果。机器可读的交换格式见 `schema/canonical_event.schema.json`。准备合法的本地输入时，请将 `config/local_paths.example.json` 复制为已被 Git 忽略的 `config/local_paths.json`。

放置上游输入后，构建并验证受限分析表：

```powershell
node src/freeze_research_inputs.mjs
node src/build_gq39_analysis_tables.mjs
node --test tests/gq39_analysis_tables.test.mjs
```

运行参考模型：

```powershell
.\.venv-research\Scripts\python.exe -m src.run_baseline_models --target T1 --representation R2
```

完整流程见 [REPRODUCIBILITY.md](REPRODUCIBILITY.md)，适用范围和限制见 [DATA_CARD.md](DATA_CARD.md)。

## 参考研究的结论边界

冻结后的研究结果支持：在注册任务中，稀疏的手势特征分解是拟合、覆盖度与成本之间表现最好的表征家族；先前的右手方向对 T2 具有独立信息价值；没有证据支持显式跨层关联项。T1 中低频的回返运动类别在合并敏感性分析后仍未得到可靠识别。

这些结果来自十个曲目组上的探索性分组交叉验证。它们不能证明认知表征、音位变体、底层形式，也不能证明古琴存在与自然语言等同的音系系统。

## 发布状态

当前版本为研究框架的候选发布版。作者为 Anni Li，University College London (UCL)，[ORCID 0009-0009-0092-5752](https://orcid.org/0009-0009-0092-5752)。
