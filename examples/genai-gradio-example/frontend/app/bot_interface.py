# ============================================================================
# Copyright 2023 Google. This software is provided as-is, without warranty or
# representation for any use or purpose. Your use of it is subject to your
# agreement with Google.
# ============================================================================

"""Generate components to render user interface."""

from event_handlers import EventHandlers as handlers
import gradio as gr


class BotInterface:
  """Defines user interface."""

  def initialize(self, config) -> any:
    """Initialize and returns the chatbot interface with event handlers attached.

    Args:
            config: A configparser having gradio configurations loaded from
              config.ini file.

    Returns:
            gr (Gradio): Gradio block consisting UI components.
    """
    event_handlers = handlers(config)
    with gr.Blocks(
        css=".gradio-container {border: 1px solid #e5e5e5}"
    ) as bot_interface:
      session = gr.State([])
      with gr.Row():
        with gr.Column(scale=10):
          with gr.Row(scale=1):
            chatbot = gr.Chatbot(
                [(None, config["initial-message"])],
                elem_id="chatbot",
                show_label=False,
                height=640,
            )
          with gr.Row():
            with gr.Column(scale=12):
              user_input = gr.Textbox(
                  show_label=False,
                  placeholder=config["text-placeholder"],
                  container=False,
              )
            with gr.Column(min_width=70, scale=1):
              submit_btn = gr.Button("Send")
          with gr.Row():
            audio_input = gr.Audio(source="microphone", type="filepath")
          with gr.Row():
            clear_btn = gr.Button("Start a new conversation")
          with gr.Row():
            with gr.Column(scale=1):
              source_location = gr.Textbox(
                  label=config["location-label"],
                  show_label=True,
                  interactive=False,
                  show_copy_button=True,
                  lines=10,
                  max_lines=10,
              )
      input_msg = user_input.submit(
          event_handlers.add_user_input,
          [chatbot, user_input],
          [chatbot, user_input],
          queue=False,
      ).then(
          event_handlers.bot_response,
          [chatbot, session],
          [
              chatbot,
              session,
              source_location,
          ],
      )
      submit_done = submit_btn.click(
          event_handlers.add_user_input,
          [chatbot, user_input],
          [chatbot, user_input],
          queue=False,
      ).then(
          event_handlers.bot_response,
          [chatbot, session],
          [
              chatbot,
              session,
              source_location,
          ],
      )
      clear_btn.click(
          event_handlers.clear_history,
          [chatbot, session],
          [
              chatbot,
              session,
              source_location,
          ],
          queue=False,
      )
      input_msg.then(
          lambda: gr.update(interactive=True), None, [user_input], queue=False
      )
      submit_done.then(
          lambda: gr.update(interactive=True), None, [user_input], queue=False
      )
      inputs_event = (
          audio_input.stop_recording(
              event_handlers.transcribe_file, audio_input, user_input
          )
          .then(
              event_handlers.add_user_input,
              [chatbot, user_input],
              [chatbot, user_input],
              queue=False,
          )
          .then(
              event_handlers.bot_response,
              [chatbot, session],
              [
                  chatbot,
                  session,
                  source_location,
              ],
          )
      )
      inputs_event.then(
          lambda: gr.update(interactive=True), None, [user_input], queue=False
      )
    return bot_interface
