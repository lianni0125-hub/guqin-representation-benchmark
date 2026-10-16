# 第三方数据与本地构建

[English](THIRD_PARTY_DATA.md) | [简体中文](THIRD_PARTY_DATA.zh-CN.md)

本项目不对任何上游材料授予使用权。使用者应直接从原作者或原项目获取各项材料，并在使用前核查上游当前有效的许可与使用条款。

## GQ39 / Guqin dataset

上游项目：[yufenhuang/Guqin-dataset](https://github.com/yufenhuang/Guqin-dataset)

在本研究中的作用：主要实验数据源。研究审计期间没有找到明确适用于标注数据的许可证；上游 README 还说明历史录音受版权保护。不得通过本项目提交或重新分发工作簿、逐行衍生数据或音频。

## Guqin-Dataset MusicXML

上游项目：[lukewys/Guqin-Dataset](https://github.com/lukewys/Guqin-Dataset)

在本研究中的作用：音高辅助数据源。研究审计期间没有找到明确许可证。在获得许可或发现适用许可证之前，XML 文件及可逆推出上游内容的事件数据必须保留在本地。

## guqinMM

上游项目：[wds-seu/guqinMM](https://github.com/wds-seu/guqinMM)

在本研究中的作用：记谱结构与数据模式方面的证据。该仓库原创软件采用 MIT 许可证，但不能据此推定其中的第三方图像、录音、在线视频或标注已经获得相同授权。本项目的组合发布包仅引用该上游项目，不重新分发其数据内容。

## KuiSCIMA

上游项目：[SuziAI/KuiSCIMA](https://github.com/SuziAI/KuiSCIMA)

在本研究中的作用：结构与数据模式方面的证据。该仓库采用 GPL-3.0，但其中第三方谱本影像的权利范围仍需另行核查。本项目发布包不复制或包含任何受 GPL-3.0 覆盖的上游内容。

## 本地隔离要求

依法取得的上游材料应放在构建配置所指定、并已被 Git 忽略的本地路径中。不得将这些材料放入 `public/`、`aggregates/`、合成示例、Git 历史、议题附件或发布归档。发布检查器会拒绝已知的原始数据、中间数据、外部仓库和逐行结果路径模式。

以上权利说明采取保守的科研管理口径，不构成法律意见。
