# ZIP版プロジェクトをローカルリポジトリへ反映する手順

この手順は、ZIPファイル内の `project` フォルダの内容を、ローカルの Git リポジトリへ反映するためのものです。

## 前提

- ZIPファイルの場所：

```powershell
C:\git\topview-todo-guide.zip
```

- ZIP内の反映元フォルダ：

```powershell
project
```

- 反映先のローカルリポジトリ：

```powershell
C:\git\topview-todo-guide
```

## PowerShellコマンド

既存のローカルリポジトリをバックアップしてから、ZIP内の `project` フォルダの中身を反映します。

```powershell
# 1. パス設定
$zipPath = "C:\git\topview-todo-guide.zip"
$destPath = "C:\git\topview-todo-guide"
$tempPath = "C:\git\_topview_extract_temp"
$backupPath = "C:\git\topview-todo-guide_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

# 2. 一時展開フォルダを初期化
if (Test-Path $tempPath) {
    Remove-Item $tempPath -Recurse -Force
}

# 3. ZIPを一時フォルダに展開
Expand-Archive -Path $zipPath -DestinationPath $tempPath -Force

# 4. 既存プロジェクトをバックアップ
Copy-Item $destPath $backupPath -Recurse -Force

# 5. ZIP内 project フォルダの中身を既存プロジェクトへ反映
Copy-Item "$tempPath\project\*" $destPath -Recurse -Force

# 6. 一時フォルダを削除
Remove-Item $tempPath -Recurse -Force

Write-Host "反映完了しました。バックアップ先: $backupPath"
```

## 反映後の確認

反映先のプロジェクトフォルダに移動します。

```powershell
cd C:\git\topview-todo-guide
```

依存関係をインストールします。

```powershell
npm install
```

ビルド確認を行います。

```powershell
npm run build
```

Gitの差分を確認します。

```powershell
git status
git diff
```

## 問題なければコミット・push

```powershell
git add .
git commit -m "Add three-mode operation plan"
git push
```

## 注意点

- `C:\git\topview-todo-guide` の内容は、作業前に自動でバックアップされます。
- バックアップ先は以下のような名前になります。

```powershell
C:\git\topview-todo-guide_backup_yyyyMMdd_HHmmss
```

- ZIP内に `project` フォルダが存在しない場合、この手順は失敗します。
- 実データ入りのテンプレート、参考動画URL、投稿結果、生データ、未公開企画、クライアント情報、APIキーなどは公開リポジトリにコミットしないでください。
