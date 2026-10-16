# Third-party Data and Local Build

[English](THIRD_PARTY_DATA.md) | [简体中文](THIRD_PARTY_DATA.zh-CN.md)

This project does not grant rights to any upstream material. Obtain each source directly from its creator and review the current upstream terms before use.

## GQ39 / Guqin dataset

Upstream: [yufenhuang/Guqin-dataset](https://github.com/yufenhuang/Guqin-dataset)

Role: principal experimental source. No explicit annotation licence was located during the recorded audit; the upstream README also states that historical audio is copyright protected. Do not commit or redistribute workbooks, row-level derivatives or audio through this project.

## Guqin-Dataset MusicXML

Upstream: [lukewys/Guqin-Dataset](https://github.com/lukewys/Guqin-Dataset)

Role: pitch auxiliary. No explicit licence was located during the recorded audit. Keep XML and reversible derived events local unless permission or a licence is later supplied.

## guqinMM

Upstream: [wds-seu/guqinMM](https://github.com/wds-seu/guqinMM)

Role: notation/schema evidence. Repository-authored software is distributed under MIT, but that notice is not assumed to clear third-party images, recordings, online videos or annotations. This combined release references the upstream project and does not redistribute its payloads.

## KuiSCIMA

Upstream: [SuziAI/KuiSCIMA](https://github.com/SuziAI/KuiSCIMA)

Role: structural/schema evidence. The repository is GPL-3.0, while third-party facsimile scope requires separate review. No GPL payload is copied into this project release.

## Expected local isolation

Place acquired sources under ignored local paths documented by the builder configuration. Never place them in `public/`, `aggregates/`, fixtures, Git history, issue attachments or release archives. The release checker rejects known raw/interim/external/result-row patterns.

This rights summary is conservative research-management guidance, not legal advice.

