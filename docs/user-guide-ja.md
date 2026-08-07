# NarrativeLine ユーザーガイド（初版）

NarrativeLineは、E2R Datasetを使ってできごと（Event）をタイムラインで編集するアプリケーションです。

## Datasetを始める

ホーム画面では、次の操作を選べます。

- Datasetを新規作成
- E2R JSONを読み込む
- サンプルDatasetを開く
- 編集中のDatasetを開く

## Datasetを読み込む

「E2R JSONを読み込む」からJSONファイルを選択します。

- 正常なDatasetはTimeline画面で開きます。
- JSONの構文エラーやCore検証エラーがある場合は、読み込みが中止されます。
- 未知のExtensionが含まれている場合は警告を表示したうえで開きます。

## Datasetタイトル

Timeline上部のタイトル欄に名前を入力し、「タイトルを適用」を押します。
タイトルは `extensions.metadata.title` に保存されます。

## できごと（Event）を編集する

タイムライン上でできごとを選択し、「編集」を押します。名前、説明、日付を編集できます。
保存するとTimelineへ戻ります。

## Entityを関連付ける

できごとの編集画面からエンティティを選択したり、「関連付けを追加」から新しいエンティティを作成したりできます。
関連付けると、必要なRelationが自動的に作成されます。

## Datasetをエクスポートする

Timelineの「E2R JSONをエクスポート」を押します。

- タイトルがある場合：タイトルを使ったファイル名になります。
- タイトルがない場合：`e2r-dataset.e2r.json` になります。

エクスポート前にもDataset検証が行われます。

## 検証メッセージ

エラーはDatasetを開くことを妨げます。警告はDatasetを開けますが、内容を確認してください。
診断にはエラーコードとDataset内の場所（JSON Pointer）が表示されます。
