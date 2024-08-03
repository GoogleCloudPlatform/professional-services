# slackbot

Slackbot allows you to post build status messages to Slack.

![Slack screenshot](assets/screenshot.png)

## Getting started

If you are new to Google Cloud Build, we recommend you start by visiting the [manage resources page](https://console.cloud.google.com/cloud-resource-manager) in the Cloud Console, [enable billing](https://cloud.google.com/billing/docs/how-to/modify-project), [enable the Cloud Build API](https://console.cloud.google.com/flows/enableapi?apiid=cloudbuild.googleapis.com), and [install the Cloud SDK](https://cloud.google.com/sdk/docs/).

Clone this repository and build the builder:
```sh
gcloud builds submit . --config=cloudbuild.yaml
```

Follow instructions on the Slack website to [create a bot for your workspace](https://get.slack.help/hc/en-us/articles/115005265703-Create-a-bot-for-your-workspace).  Copy and paste the webhook URL, you'll need it in a moment.  If you want a neat bot profile image, you can download and use the [official Cloud Build solution icon](https://cloud.google.com/icons/).  (Note Slack will ask you to resize it to 500 x 500 pixels first.)

## Using this tool

Add the builder as the first step in your project's `cloudbuild.yaml`: this triggers an independent "watcher" build which posts a status update whenever your main build completes - whether it's success or failure.

```yaml
steps:
- name: 'gcr.io/$PROJECT_ID/slackbot'
  args: [ '--build', '$BUILD_ID',
          '--webhook', '<Add your webhook URL here>' ]
...
```

## API

### `build`

_**type**_ `string`

_**description**_ ID of monitored build

_**notes**_ Required

_**example**_

```yaml
steps:
- name: gcr.io/$PROJECT_ID/slackbot
  args:
  # ...
  - --build
  - 333225b1-b215-4992-9241-d8f4f3197be2
  # ...
```

### `webhook`

_**type**_ `string`

_**description**_ Slack webhook URL

_**notes**_ Required

_**example**_

```yaml
steps:
- name: gcr.io/$PROJECT_ID/slackbot
  args:
  # ...
  - --webhook
  - https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
  # ...
```

### `mode`

_**type**_ `string`

_**default**_ `"trigger"`

_**description**_ Mode the builder runs in

_**notes**_ Required. Must be one of: `"trigger"`, `"monitor"`

_**example**_

```yaml
steps:
- name: gcr.io/$PROJECT_ID/slackbot
  args:
  # ...
  - --mode
  - trigger
  # ...
```

### `copy-name`

_**type**_ `bool`

_**default**_ `false`

_**description**_ Copy [`name`](https://cloud.google.com/cloud-build/docs/build-config#name) of slackbot's build step from monitored build to watcher build

_**notes**_ If enabled, the `name` of the slackbot build step name must include `"slackbot"`. If not enabled, watcher build will use `name: gcr.io/$PROJECT_ID/slackbot`.

_**example**_

```yaml
steps:
- name: gcr.io/$PROJECT_ID/slackbot@sha256:5ae97d5e41e8c4c87f30b3766184e4440c7e4092ccebf13a166ee09ecf9891f5
  args:
  # ...
  - --copy-name
  # ...
```

### `copy-tags`

_**type**_ `bool`

_**default**_ `false`

_**description**_ Copy [`tags`](https://cloud.google.com/cloud-build/docs/build-config#tags) from monitored build to watcher build

_**notes**_ If disabled, the watcher build will use `tags: ["slackbot"]`. If enabled, the monitored build's tags will be added to the defaults. In the following example, the resulting values for the watcher build would be `tags: ["slackbot", "e2e"]`.

_**example**_

```yaml
steps:
- name: gcr.io/$PROJECT_ID/slackbot
  args:
  # ...
  - --copy-tags
  # ...

tags:
- e2e
```

### `copy-timeout`

_**type**_ `bool`

_**default**_ `false`

_**description**_ Copy [`timeout`](https://cloud.google.com/cloud-build/docs/build-config#timeout_2) from monitored build to watcher build

_**notes**_ If enabled, watcher build's `timeout` will be set to monitored build's `timeout` (plus a small margin for transient API errors encountered by the watcher). If disabled, watcher build's `timeout` will not be set (i.e., Cloud Build's defaults will apply).

_**example**_

```yaml
steps:
- name: gcr.io/$PROJECT_ID/slackbot
  args:
  # ...
  - --copy-timeout
  # ...

timeout: 900s
```

## Examples

Examples showing both successful and unsuccessful builds are in the [examples](examples/) directory.

## Customization

You may wish to customize your build notifications and provide different information in the messages posted to Slack.  To do this, edit the JSON payload in [notify.go](slackbot/notify.go), following the [Slack message formatting guidelines](https://api.slack.com/docs/message-formatting).
