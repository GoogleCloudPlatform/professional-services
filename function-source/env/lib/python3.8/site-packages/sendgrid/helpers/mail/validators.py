from .exceptions import ApiKeyIncludedException


class ValidateApiKey(object):
    """Validates content to ensure SendGrid API key is not present"""

    regexes = None

    def __init__(self, regex_strings=None, use_default=True):
        """Create an API key validator

            :param regex_strings: list of regex strings
            :type regex_strings: list(str)
            :param use_default: Whether or not to include default regex
            :type use_default: bool
        """

        import re
        self.regexes = set()

        # Compile the regex strings into patterns, add them to our set
        if regex_strings is not None:
            for regex_string in regex_strings:
                self.regexes.add(re.compile(regex_string))

        if use_default:
            default_regex_string = r'SG\.[0-9a-zA-Z]+\.[0-9a-zA-Z]+'
            self.regexes.add(re.compile(default_regex_string))

    def validate_message_dict(self, request_body):
        """With the JSON dict that will be sent to SendGrid's API,
            check the content for SendGrid API keys - throw exception if found.

           :param request_body: The JSON dict that will be sent to SendGrid's
                                API.
           :type request_body: JSON serializable structure
           :raise ApiKeyIncludedException: If any content in request_body
                                           matches regex
        """

        # Handle string in edge-case
        if isinstance(request_body, str):
            self.validate_message_text(request_body)

        # Default param
        elif isinstance(request_body, dict):

            contents = request_body.get("content", list())

            for content in contents:
                if content is not None:
                    if (content.get("type") == "text/html" or
                            isinstance(content.get("value"), str)):
                        message_text = content.get("value", "")
                        self.validate_message_text(message_text)

    def validate_message_text(self, message_string):
        """With a message string, check to see if it contains a SendGrid API Key
            If a key is found, throw an exception

           :param message_string: message that will be sent
           :type message_string: string
           :raises ApiKeyIncludedException: If message_string matches a regex
                                            string
        """
        if isinstance(message_string, str):
            for regex in self.regexes:
                if regex.match(message_string) is not None:
                    raise ApiKeyIncludedException()
